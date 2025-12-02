/**
 * Script para verificar o conteúdo da pasta de produtos
 * Verifica tanto o caminho UNC quanto o caminho Docker montado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verificando pasta de produtos...\n');

// Caminhos para verificar
const pathsToCheck = [
  // Caminho UNC (Windows)
  '\\\\192.168.2.22\\Olimpo\\.dev\\web\\thecore\\products',
  // Caminho alternativo
  '\\\\192.168.2.22\\.dev\\web\\thecore\\products',
  // Caminho Docker montado
  '/app/server/public/uploads/products',
  // Caminho relativo (se rodando fora do Docker)
  path.resolve(__dirname, '../../public/uploads/products'),
];

function checkPath(checkPath) {
  console.log(`\n📁 Verificando: ${checkPath}`);
  console.log('─'.repeat(80));
  
  if (!fs.existsSync(checkPath)) {
    console.log('❌ Caminho não existe');
    return;
  }
  
  try {
    const stats = fs.statSync(checkPath);
    if (!stats.isDirectory()) {
      console.log('❌ Não é um diretório');
      return;
    }
    
    const files = fs.readdirSync(checkPath);
    console.log(`✅ Diretório existe`);
    console.log(`📊 Total de arquivos: ${files.length}`);
    
    if (files.length === 0) {
      console.log('⚠️  Diretório vazio');
      return;
    }
    
    // Separar arquivos por tipo
    const imageFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.webp', '.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    
    const tempFiles = files.filter(f => f.startsWith('temp_'));
    const realImageFiles = imageFiles.filter(f => !f.startsWith('temp_'));
    const dirs = files.filter(f => {
      try {
        return fs.statSync(path.join(checkPath, f)).isDirectory();
      } catch {
        return false;
      }
    });
    
    console.log(`\n📊 Estatísticas:`);
    console.log(`   - Imagens reais (não temp): ${realImageFiles.length}`);
    console.log(`   - Arquivos temporários: ${tempFiles.length}`);
    console.log(`   - Total de imagens: ${imageFiles.length}`);
    console.log(`   - Subdiretórios: ${dirs.length}`);
    
    if (realImageFiles.length > 0) {
      console.log(`\n✅ Imagens reais encontradas (primeiras 30):`);
      realImageFiles.slice(0, 30).forEach((file, idx) => {
        try {
          const filePath = path.join(checkPath, file);
          const fileStats = fs.statSync(filePath);
          const sizeKB = (fileStats.size / 1024).toFixed(2);
          const modified = fileStats.mtime.toLocaleDateString('pt-PT');
          console.log(`   ${idx + 1}. ${file} (${sizeKB} KB, modificado: ${modified})`);
        } catch (e) {
          console.log(`   ${idx + 1}. ${file} (erro ao ler)`);
        }
      });
      if (realImageFiles.length > 30) {
        console.log(`   ... e mais ${realImageFiles.length - 30} imagens`);
      }
    } else {
      console.log(`\n⚠️  NENHUMA IMAGEM REAL ENCONTRADA!`);
    }
    
    // Mostrar TODOS os arquivos para análise
    console.log(`\n📋 TODOS os arquivos na pasta (${files.length} total):`);
    files.forEach((file, idx) => {
      try {
        const filePath = path.join(checkPath, file);
        const fileStats = fs.statSync(filePath);
        const sizeKB = (fileStats.size / 1024).toFixed(2);
        const isDir = fileStats.isDirectory();
        const type = isDir ? '[DIR]' : '[FILE]';
        const ext = path.extname(file).toLowerCase();
        const isImage = ['.webp', '.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        const isTemp = file.startsWith('temp_') || file.includes('temp_');
        const marker = isTemp ? '🔴' : (isImage ? '🟢' : '⚪');
        console.log(`   ${marker} ${type} ${file} (${sizeKB} KB)`);
      } catch (e) {
        console.log(`   ❌ ${file} (erro ao ler)`);
      }
    });
    
    if (dirs.length > 0) {
      console.log(`\n📁 Subdiretórios encontrados:`);
      dirs.forEach((dir, idx) => {
        try {
          const subPath = path.join(checkPath, dir);
          const subFiles = fs.readdirSync(subPath);
          const subImages = subFiles.filter(f => {
            const ext = path.extname(f).toLowerCase();
            return ['.webp', '.jpg', '.jpeg', '.png', '.gif'].includes(ext) && !f.startsWith('temp_');
          });
          console.log(`   ${idx + 1}. ${dir}/ (${subFiles.length} arquivos, ${subImages.length} imagens)`);
          
          if (subImages.length > 0 && subImages.length <= 5) {
            console.log(`      Imagens: ${subImages.join(', ')}`);
          } else if (subImages.length > 5) {
            console.log(`      Imagens: ${subImages.slice(0, 5).join(', ')} ... e mais ${subImages.length - 5}`);
          }
        } catch (e) {
          console.log(`   ${idx + 1}. ${dir}/ (erro ao listar: ${e.message})`);
        }
      });
    }
    
    // Verificar também o diretório pai
    const parentDir = path.dirname(checkPath);
    if (fs.existsSync(parentDir)) {
      try {
        const parentFiles = fs.readdirSync(parentDir);
        const parentDirs = parentFiles.filter(f => {
          try {
            return fs.statSync(path.join(parentDir, f)).isDirectory();
          } catch {
            return false;
          }
        });
        console.log(`\n📁 Diretório pai "${parentDir}" tem ${parentDirs.length} subdiretórios:`);
        parentDirs.forEach(dir => {
          console.log(`   - ${dir}/`);
        });
      } catch (e) {
        // Ignorar erros ao listar diretório pai
      }
    }
    
  } catch (error) {
    console.log(`❌ Erro ao acessar: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

// Verificar cada caminho
pathsToCheck.forEach(checkPath);

console.log('\n' + '='.repeat(80));
console.log('✅ Verificação concluída');

