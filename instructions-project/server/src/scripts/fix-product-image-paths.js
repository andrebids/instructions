/**
 * Script para corrigir caminhos de imagens na base de dados
 * Atualiza caminhos que não existem para corresponder aos arquivos reais no filesystem
 * 
 * Uso: node server/src/scripts/fix-product-image-paths.js [--dry-run] [--product-id=ID]
 * 
 * --dry-run: Apenas mostra o que seria alterado, não faz alterações
 * --product-id=ID: Corrige apenas um produto específico
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';
import { resolvePublicPath, getProductsUploadDir } from '../utils/pathUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixProductImagePaths(options = {}) {
  const { dryRun = false, productId = null } = options;
  
  try {
    console.log('🔧 [FIX IMAGE PATHS] Iniciando correção de caminhos de imagens...\n');
    if (dryRun) {
      console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita na base de dados\n');
    }
    console.log('='.repeat(100));

    const productsDir = getProductsUploadDir();
    console.log(`📁 Diretório de produtos: ${productsDir}`);
    console.log(`📁 Diretório existe: ${fs.existsSync(productsDir)}\n`);

    if (!fs.existsSync(productsDir)) {
      console.error('❌ Diretório de produtos não existe! Verifique se o SMB está montado.');
      return;
    }

    // Listar todos os arquivos disponíveis no diretório
    const allFiles = fs.readdirSync(productsDir);
    console.log(`📁 Total de arquivos no diretório: ${allFiles.length}\n`);

    // Buscar produtos
    const whereClause = productId ? { id: productId } : {};
    const products = await Product.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'imagesNightUrl', 'imagesDayUrl', 'thumbnailUrl', 'isActive'],
      order: [['name', 'ASC']]
    });

    console.log(`📦 Total de produtos encontrados: ${products.length}\n`);

    if (products.length === 0) {
      console.log('❌ Nenhum produto encontrado.');
      return;
    }

    const updates = [];
    let fixedCount = 0;
    let notFoundCount = 0;

    for (const product of products) {
      const productData = product.get({ plain: true });
      const productUpdates = {
        id: productData.id,
        name: productData.name,
        changes: []
      };

      // Função para encontrar arquivo similar
      const findSimilarFile = (imagePath, fileType) => {
        if (!imagePath) return null;

        const fileName = path.basename(imagePath);
        const ext = path.extname(fileName);
        
        // Determinar padrão de busca baseado no tipo de arquivo
        let searchPattern;
        if (fileName.startsWith('thumb_temp_dayImage_')) {
          searchPattern = 'thumb_temp_dayImage_';
        } else if (fileName.startsWith('temp_nightImage_')) {
          searchPattern = 'temp_nightImage_';
        } else if (fileName.startsWith('temp_dayImage_')) {
          searchPattern = 'temp_dayImage_';
        } else {
          // Tentar padrões genéricos
          if (fileName.includes('night')) {
            searchPattern = 'temp_nightImage_';
          } else if (fileName.includes('day')) {
            searchPattern = 'temp_dayImage_';
          } else {
            return null;
          }
        }

        // Buscar arquivos que correspondem ao padrão
        const matchingFiles = allFiles.filter(f => 
          f.startsWith(searchPattern) && 
          f.endsWith(ext)
        );

        if (matchingFiles.length === 0) {
          return null;
        }

        // Extrair timestamp do arquivo original (se existir)
        const originalMatch = fileName.match(/(\d+)\.webp$/);
        const originalTimestamp = originalMatch ? parseInt(originalMatch[1]) : null;
        
        // Extrair timestamps de todos os arquivos correspondentes
        const filesWithTimestamp = matchingFiles.map(file => {
          const match = file.match(/(\d+)\.webp$/);
          const timestamp = match ? parseInt(match[1]) : 0;
          return { file, timestamp };
        }).sort((a, b) => b.timestamp - a.timestamp);

        // Se temos timestamp original, tentar encontrar o mais próximo
        if (originalTimestamp !== null && filesWithTimestamp.length > 1) {
          // Encontrar o arquivo com timestamp mais próximo do original
          let closest = filesWithTimestamp[0];
          let minDiff = Math.abs(closest.timestamp - originalTimestamp);
          
          for (const fileInfo of filesWithTimestamp) {
            const diff = Math.abs(fileInfo.timestamp - originalTimestamp);
            if (diff < minDiff) {
              minDiff = diff;
              closest = fileInfo;
            }
          }
          
          // Se a diferença for muito grande (mais de 30 dias), usar o mais recente
          const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
          if (minDiff > thirtyDaysInMs) {
            return filesWithTimestamp[0].file; // Mais recente
          }
          
          return closest.file; // Mais próximo
        }

        // Se não temos timestamp original ou só há um arquivo, usar o mais recente
        return filesWithTimestamp[0].file;
      };

      // Verificar e corrigir cada tipo de imagem
      const imageTypes = [
        { key: 'imagesNightUrl', label: 'Night', dbField: 'imagesNightUrl' },
        { key: 'imagesDayUrl', label: 'Day', dbField: 'imagesDayUrl' },
        { key: 'thumbnailUrl', label: 'Thumbnail', dbField: 'thumbnailUrl' }
      ];

      for (const imageType of imageTypes) {
        const imagePath = productData[imageType.key];
        
        if (!imagePath) {
          continue; // Pular se não há imagem
        }

        const resolvedPath = resolvePublicPath(imagePath);
        const exists = resolvedPath ? fs.existsSync(resolvedPath) : false;

        if (!exists) {
          // Arquivo não existe - tentar encontrar arquivo similar
          const similarFile = findSimilarFile(imagePath, imageType.label);
          
          if (similarFile) {
            // Construir novo caminho mantendo a estrutura original
            const newPath = `/uploads/products/${similarFile}`;
            
            productUpdates.changes.push({
              type: imageType.label,
              oldPath: imagePath,
              newPath: newPath,
              foundFile: similarFile
            });

            // Atualizar na base de dados se não for dry-run
            if (!dryRun) {
              await product.update({
                [imageType.dbField]: newPath
              });
              fixedCount++;
            }
          } else {
            productUpdates.changes.push({
              type: imageType.label,
              oldPath: imagePath,
              newPath: null,
              foundFile: null,
              error: 'Nenhum arquivo similar encontrado'
            });
            notFoundCount++;
          }
        }
      }

      if (productUpdates.changes.length > 0) {
        updates.push(productUpdates);
      }
    }

    // Relatório
    console.log('='.repeat(100));
    console.log('📊 RELATÓRIO DE CORREÇÃO\n');
    
    if (dryRun) {
      console.log('⚠️  MODO DRY-RUN - Nenhuma alteração foi feita\n');
    } else {
      console.log(`✅ Caminhos corrigidos: ${fixedCount}`);
      console.log(`⚠️  Arquivos não encontrados (sem similar): ${notFoundCount}\n`);
    }

    if (updates.length > 0) {
      console.log('='.repeat(100));
      console.log(`📦 PRODUTOS COM ALTERAÇÕES: ${updates.length}\n`);
      
      for (const update of updates) {
        console.log(`📦 Produto: ${update.name} (ID: ${update.id})`);
        console.log(`   Alterações: ${update.changes.length}\n`);
        
        for (const change of update.changes) {
          console.log(`   🖼️  ${change.type}:`);
          console.log(`      Caminho antigo: ${change.oldPath}`);
          
          if (change.newPath) {
            console.log(`      ${dryRun ? 'Novo caminho (seria):' : 'Novo caminho:'} ${change.newPath}`);
            console.log(`      Arquivo encontrado: ${change.foundFile}`);
            if (!dryRun) {
              console.log(`      ✅ Atualizado na base de dados`);
            }
          } else {
            console.log(`      ❌ ${change.error || 'Nenhum arquivo similar encontrado'}`);
          }
          
          console.log('');
        }
        
        console.log('-'.repeat(100));
        console.log('');
      }
    } else {
      console.log('✅ Nenhuma correção necessária! Todos os caminhos estão corretos.\n');
    }

    console.log('='.repeat(100));
    if (dryRun) {
      console.log('💡 Para aplicar as alterações, execute o script sem --dry-run\n');
    } else {
      console.log('✅ Correção concluída!\n');
    }

  } catch (error) {
    console.error('❌ [FIX IMAGE PATHS] Erro:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  productId: args.find(arg => arg.startsWith('--product-id='))?.split('=')[1] || null
};

// Executar script
fixProductImagePaths(options).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

