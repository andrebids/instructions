#!/usr/bin/env node

/**
 * Script para verificar se o Service Worker foi processado corretamente pelo VitePWA
 * Execute após o build: node verify-sw-build.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');
const swPath = path.join(distPath, 'sw.js');
const publicSwPath = path.join(__dirname, 'public', 'sw.js');

console.log('🔍 Verificando Service Worker build...\n');

// Verificar se dist/ existe
if (!fs.existsSync(distPath)) {
  console.error('❌ Diretório dist/ não encontrado!');
  console.error('   Execute: npm run build');
  process.exit(1);
}

// Verificar se sw.js existe em dist/
if (!fs.existsSync(swPath)) {
  console.error('❌ sw.js não encontrado em dist/!');
  console.error('   O VitePWA deveria ter gerado dist/sw.js durante o build');
  process.exit(1);
}

// Ler o arquivo processado
const swContent = fs.readFileSync(swPath, 'utf-8');

console.log('✅ sw.js encontrado em dist/');
console.log(`📋 Tamanho: ${swContent.length} bytes\n`);

// Verificar se o manifest foi injetado
if (swContent.includes('__WB_MANIFEST') && !swContent.includes('self.__WB_MANIFEST = [')) {
  console.error('❌ PROBLEMA DETECTADO: Manifest NÃO foi injetado!');
  console.error('   O arquivo ainda contém o placeholder __WB_MANIFEST');
  console.error('   Isso significa que o VitePWA não processou o Service Worker durante o build\n');
  
  // Comparar com o arquivo source
  if (fs.existsSync(publicSwPath)) {
    const sourceContent = fs.readFileSync(publicSwPath, 'utf-8');
    if (swContent === sourceContent) {
      console.error('❌ O arquivo em dist/sw.js é IDÊNTICO ao de public/sw.js');
      console.error('   O VitePWA não processou o arquivo - apenas copiou!');
      console.error('\n💡 Possíveis causas:');
      console.error('   1. Plugin VitePWA não está sendo executado durante o build');
      console.error('   2. Configuração do injectManifest está incorreta');
      console.error('   3. Erro silencioso durante o processamento do VitePWA');
    }
  }
  
  process.exit(1);
} else if (swContent.includes('self.__WB_MANIFEST = [')) {
  console.log('✅ Manifest foi injetado corretamente!');
  
  // Extrair informações do manifest
  const manifestMatch = swContent.match(/self\.__WB_MANIFEST\s*=\s*\[(.*?)\]/s);
  if (manifestMatch) {
    try {
      const manifestStr = '[' + manifestMatch[1] + ']';
      const manifest = JSON.parse(manifestStr);
      console.log(`📦 Manifest contém ${manifest.length} entradas`);
      if (manifest.length > 0) {
        console.log('📋 Primeiras 3 entradas:');
        manifest.slice(0, 3).forEach((entry, i) => {
          console.log(`   ${i + 1}. ${entry.url || entry}`);
        });
      }
    } catch (e) {
      console.log('⚠️  Não foi possível parsear o manifest, mas está presente');
    }
  }
} else {
  console.warn('⚠️  Não foi possível verificar o manifest');
  console.warn('   O arquivo pode estar processado, mas em formato diferente');
}

// Verificar se contém imports do Workbox
if (swContent.includes('workbox-precaching') || swContent.includes('cleanupOutdatedCaches')) {
  console.log('✅ Contém imports do Workbox');
} else {
  console.warn('⚠️  Não contém imports do Workbox - pode ter sido transformado');
}

console.log('\n✅ Verificação concluída!');

