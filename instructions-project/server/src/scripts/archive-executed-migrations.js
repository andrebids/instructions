/**
 * Script para arquivar migrations já executadas
 * 
 * Move migrations que já foram executadas com sucesso para migrations/_archived/
 * Mantém histórico mas limpa o diretório principal
 * 
 * Uso: node src/scripts/archive-executed-migrations.js
 */

import { getMigrationStatus } from '../utils/migrationRunner.js';
import { readdir, mkdir, rename } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function archiveExecutedMigrations() {
  try {
    console.log('📦 Iniciando arquivamento de migrations executadas...\n');
    
    // Tentar obter status das migrations (pode falhar se banco não estiver disponível)
    let status = null;
    try {
      status = await getMigrationStatus();
    } catch (dbError) {
      console.log('⚠️  Não foi possível conectar ao banco de dados.');
      console.log('💡 Modo offline: arquivando migrations antigas baseado em data/nome.\n');
      
      // Modo offline: arquivar migrations antigas (antes de 2025-12)
      const migrationsDir = join(__dirname, '../migrations');
      const archiveDir = join(migrationsDir, '_archived');
      
      try {
        await mkdir(archiveDir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
      
      const files = await readdir(migrationsDir);
      const migrationFiles = files.filter(file => 
        extname(file) === '.js' && 
        file !== 'create-migrations-tracking-table.js' &&
        !file.startsWith('_')
      );
      
      // Arquivar migrations com data anterior a 2025-12 (migrations antigas)
      const oldMigrations = migrationFiles.filter(file => {
        const dateMatch = file.match(/^(\d{8})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const year = parseInt(dateStr.substring(0, 4));
          const month = parseInt(dateStr.substring(4, 6));
          // Arquivar migrations anteriores a dezembro de 2025
          return year < 2025 || (year === 2025 && month < 12);
        }
        // Arquivar migrations sem data no início (migrations antigas sem timestamp)
        return !file.match(/^\d{8}/);
      });
      
      if (oldMigrations.length === 0) {
        console.log('ℹ️  Nenhuma migration antiga encontrada para arquivar.');
        process.exit(0);
      }
      
      console.log(`📋 Encontradas ${oldMigrations.length} migrations antigas para arquivar:\n`);
      oldMigrations.forEach(file => console.log(`   - ${file}`));
      console.log();
      
      let archived = 0;
      const errors = [];
      
      for (const file of oldMigrations) {
        const sourcePath = join(migrationsDir, file);
        const targetPath = join(archiveDir, file);
        
        try {
          const archiveFiles = await readdir(archiveDir).catch(() => []);
          if (archiveFiles.includes(file)) {
            console.log(`⏭️  ${file} já está arquivado, pulando...`);
            continue;
          }
          
          await rename(sourcePath, targetPath);
          console.log(`📦 Arquivado: ${file}`);
          archived++;
        } catch (error) {
          console.error(`❌ Erro ao arquivar ${file}:`, error.message);
          errors.push({ file, error: error.message });
        }
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 Resumo do arquivamento (modo offline):');
      console.log(`   📦 Arquivadas: ${archived}`);
      if (errors.length > 0) {
        console.log(`   ❌ Erros: ${errors.length}`);
      }
      console.log('='.repeat(50));
      
      if (archived > 0) {
        console.log(`\n✅ ${archived} migration(s) arquivada(s) com sucesso!`);
        console.log(`📁 Localização: ${archiveDir}`);
      }
      
      process.exit(0);
    }
    
    if (status.executed === 0) {
      console.log('ℹ️  Nenhuma migration executada encontrada.');
      console.log('💡 Execute migrations primeiro ou verifique a tabela SequelizeMeta.');
      process.exit(0);
    }
    
    console.log('📊 Status atual:');
    console.log(`   Total de migrations: ${status.total}`);
    console.log(`   ✅ Executadas: ${status.executed}`);
    console.log(`   ⏳ Pendentes: ${status.pending}\n`);
    
    if (status.pending > 0) {
      console.log('⚠️  ATENÇÃO: Existem migrations pendentes!');
      console.log('   Migrations pendentes serão mantidas no diretório principal.\n');
    }
    
    // Diretórios
    const migrationsDir = join(__dirname, '../migrations');
    const archiveDir = join(migrationsDir, '_archived');
    
    // Criar diretório de arquivo se não existir
    try {
      await mkdir(archiveDir, { recursive: true });
      console.log(`📁 Diretório de arquivo criado: ${archiveDir}\n`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // Ler todas as migrations do diretório
    const files = await readdir(migrationsDir);
    const migrationFiles = files.filter(file => 
      extname(file) === '.js' && 
      file !== 'create-migrations-tracking-table.js' &&
      !file.startsWith('_')
    );
    
    let archived = 0;
    let skipped = 0;
    const errors = [];
    
    // Processar cada migration
    for (const file of migrationFiles) {
      const migrationName = basename(file, '.js');
      const sourcePath = join(migrationsDir, file);
      const targetPath = join(archiveDir, file);
      
      // Verificar se foi executada
      if (status.executedMigrations.includes(migrationName)) {
        try {
          // Verificar se já existe no arquivo (evitar sobrescrever)
          const archiveFiles = await readdir(archiveDir).catch(() => []);
          if (archiveFiles.includes(file)) {
            console.log(`⏭️  ${file} já está arquivado, pulando...`);
            skipped++;
            continue;
          }
          
          // Mover para arquivo
          await rename(sourcePath, targetPath);
          console.log(`📦 Arquivado: ${file}`);
          archived++;
        } catch (error) {
          console.error(`❌ Erro ao arquivar ${file}:`, error.message);
          errors.push({ file, error: error.message });
        }
      } else {
        // Migration não executada ou pendente - manter no diretório principal
        skipped++;
      }
    }
    
    // Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumo do arquivamento:');
    console.log(`   📦 Arquivadas: ${archived}`);
    console.log(`   ⏭️  Mantidas: ${skipped}`);
    if (errors.length > 0) {
      console.log(`   ❌ Erros: ${errors.length}`);
      errors.forEach(({ file, error }) => {
        console.log(`      - ${file}: ${error}`);
      });
    }
    console.log('='.repeat(50));
    
    if (archived > 0) {
      console.log('\n✅ Migrations arquivadas com sucesso!');
      console.log(`📁 Localização: ${archiveDir}`);
      console.log('\n💡 Notas:');
      console.log('   - Migrations arquivadas não serão mais executadas automaticamente');
      console.log('   - Para restaurar, mova de volta para migrations/');
      console.log('   - Migrations pendentes foram mantidas no diretório principal');
    } else {
      console.log('\nℹ️  Nenhuma migration foi arquivada.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao arquivar migrations:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

archiveExecutedMigrations();

