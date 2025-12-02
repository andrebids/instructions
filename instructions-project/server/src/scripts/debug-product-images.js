/**
 * Script para debugar discrepâncias entre caminhos de imagens na base de dados
 * e arquivos reais no filesystem (via SMB montado)
 * 
 * Uso: node server/src/scripts/debug-product-images.js [productId]
 * Se productId não for fornecido, lista todos os produtos com problemas
 */

import sequelize from '../config/database.js';
import { Product } from '../models/index.js';
import { resolvePublicPath, getProductsUploadDir } from '../utils/pathUtils.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugProductImages(productId = null) {
  try {
    console.log('🔍 [DEBUG PRODUCT IMAGES] Iniciando diagnóstico de imagens...\n');
    console.log('='.repeat(100));

    const productsDir = getProductsUploadDir();
    console.log(`📁 Diretório de produtos (SMB montado): ${productsDir}`);
    console.log(`📁 Diretório existe: ${fs.existsSync(productsDir)}`);
    console.log(`📁 Diretório é legível: ${fs.existsSync(productsDir) ? (() => {
      try {
        fs.accessSync(productsDir, fs.constants.R_OK);
        return true;
      } catch {
        return false;
      }
    })() : false}\n`);

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

    const problems = [];
    const validImages = [];

    for (const product of products) {
      const productData = product.get({ plain: true });
      const productProblems = {
        id: productData.id,
        name: productData.name,
        isActive: productData.isActive,
        images: []
      };

      // Verificar cada tipo de imagem
      const imageTypes = [
        { key: 'imagesNightUrl', label: 'Night' },
        { key: 'imagesDayUrl', label: 'Day' },
        { key: 'thumbnailUrl', label: 'Thumbnail' }
      ];

      for (const imageType of imageTypes) {
        const imagePath = productData[imageType.key];
        
        if (!imagePath) {
          continue; // Pular se não há imagem
        }

        const resolvedPath = resolvePublicPath(imagePath);
        const exists = resolvedPath ? fs.existsSync(resolvedPath) : false;

        const imageInfo = {
          type: imageType.label,
          pathInDatabase: imagePath,
          resolvedPath: resolvedPath,
          exists: exists
        };

        if (!exists) {
          // Arquivo não encontrado - adicionar informações de diagnóstico
          imageInfo.problem = 'Arquivo não encontrado no filesystem';
          
          if (resolvedPath) {
            const dir = path.dirname(resolvedPath);
            imageInfo.directoryExists = fs.existsSync(dir);
            imageInfo.directoryPath = dir;

            // Se o diretório existe, verificar arquivos similares
            if (fs.existsSync(dir)) {
              try {
                const files = fs.readdirSync(dir);
                const fileName = path.basename(resolvedPath);
                
                // Se é um arquivo temp_, buscar outros com mesmo prefixo
                if (fileName.includes('temp_')) {
                  const prefix = fileName.split('_').slice(0, 2).join('_'); // Ex: temp_nightImage
                  const similarFiles = files.filter(f => 
                    f.startsWith(prefix) && 
                    f.endsWith(path.extname(fileName))
                  );
                  if (similarFiles.length > 0) {
                    imageInfo.similarFilesFound = similarFiles.slice(0, 10);
                    imageInfo.similarFilesCount = similarFiles.length;
                  }
                }
                
                imageInfo.totalFilesInDirectory = files.length;
              } catch (e) {
                imageInfo.directoryListError = e.message;
              }
            }
          }

          productProblems.images.push(imageInfo);
        } else {
          // Arquivo existe - adicionar informações de tamanho
          try {
            const stats = fs.statSync(resolvedPath);
            imageInfo.size = stats.size;
            imageInfo.sizeKB = (stats.size / 1024).toFixed(2);
            imageInfo.modified = stats.mtime.toISOString();
          } catch (e) {
            imageInfo.statsError = e.message;
          }
          
          validImages.push({
            productId: productData.id,
            productName: productData.name,
            type: imageType.label,
            path: imagePath
          });
        }
      }

      if (productProblems.images.length > 0) {
        problems.push(productProblems);
      }
    }

    // Relatório
    console.log('='.repeat(100));
    console.log('📊 RELATÓRIO DE DIAGNÓSTICO\n');
    console.log(`✅ Imagens válidas encontradas: ${validImages.length}`);
    console.log(`⚠️  Produtos com problemas: ${problems.length}\n`);

    if (problems.length > 0) {
      console.log('='.repeat(100));
      console.log('⚠️  PRODUTOS COM IMAGENS NÃO ENCONTRADAS:\n');
      
      for (const problem of problems) {
        console.log(`📦 Produto: ${problem.name} (ID: ${problem.id})`);
        console.log(`   Status: ${problem.isActive ? 'Ativo' : 'Inativo'}`);
        console.log(`   Problemas encontrados: ${problem.images.length}\n`);
        
        for (const img of problem.images) {
          console.log(`   🖼️  ${img.type}:`);
          console.log(`      Caminho na DB: ${img.pathInDatabase}`);
          console.log(`      Caminho resolvido: ${img.resolvedPath || 'N/A'}`);
          console.log(`      Arquivo existe: ${img.exists ? '✅ Sim' : '❌ Não'}`);
          
          if (img.problem) {
            console.log(`      Problema: ${img.problem}`);
          }
          
          if (img.directoryExists !== undefined) {
            console.log(`      Diretório existe: ${img.directoryExists ? '✅ Sim' : '❌ Não'}`);
            if (img.directoryExists) {
              console.log(`      Diretório: ${img.directoryPath}`);
              console.log(`      Total de arquivos no diretório: ${img.totalFilesInDirectory || 'N/A'}`);
            }
          }
          
          if (img.similarFilesFound && img.similarFilesFound.length > 0) {
            console.log(`      ⚠️  Arquivos similares encontrados (${img.similarFilesCount}):`);
            img.similarFilesFound.forEach(file => {
              console.log(`         - ${file}`);
            });
          }
          
          console.log('');
        }
        
        console.log('-'.repeat(100));
        console.log('');
      }
    } else {
      console.log('✅ Nenhum problema encontrado! Todas as imagens estão acessíveis.\n');
    }

    // Listar alguns arquivos do diretório de produtos para referência
    if (fs.existsSync(productsDir)) {
      try {
        const files = fs.readdirSync(productsDir);
        const imageFiles = files.filter(f => 
          f.toLowerCase().endsWith('.webp') || 
          f.toLowerCase().endsWith('.jpg') || 
          f.toLowerCase().endsWith('.jpeg') || 
          f.toLowerCase().endsWith('.png')
        );
        
        console.log('='.repeat(100));
        console.log('📁 ARQUIVOS NO DIRETÓRIO DE PRODUTOS:\n');
        console.log(`   Total de arquivos: ${files.length}`);
        console.log(`   Total de imagens: ${imageFiles.length}`);
        
        if (imageFiles.length > 0) {
          console.log(`\n   Primeiras 20 imagens encontradas:`);
          imageFiles.slice(0, 20).forEach((file, idx) => {
            console.log(`   ${idx + 1}. ${file}`);
          });
        }
        console.log('');
      } catch (e) {
        console.error(`❌ Erro ao listar arquivos do diretório: ${e.message}`);
      }
    }

    console.log('='.repeat(100));
    console.log('✅ Diagnóstico concluído!\n');

  } catch (error) {
    console.error('❌ [DEBUG PRODUCT IMAGES] Erro:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar script
const productId = process.argv[2] || null;
debugProductImages(productId).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

