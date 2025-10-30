import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';

const execAsync = promisify(exec);

/**
 * Script de Exportação da Base de Dados
 * Exporta a base de dados PostgreSQL para um ficheiro .sql
 * 
 * Uso: node src/export-db.js
 */

async function exportDatabase() {
  try {
    console.log('📤 Iniciando exportação da base de dados...');
    console.log('');
    
    // Obter informações da conexão
    var dbHost = process.env.DB_HOST || 'localhost';
    var dbPort = process.env.DB_PORT || 5433;
    var dbName = process.env.DB_NAME || 'instructions_demo';
    var dbUser = process.env.DB_USER || 'demo_user';
    var dbPassword = process.env.DB_PASSWORD || 'demo_password';
    
    console.log('📋 Configuração:');
    console.log('   Host:', dbHost);
    console.log('   Port:', dbPort);
    console.log('   Database:', dbName);
    console.log('   User:', dbUser);
    console.log('');
    
    // Nome do ficheiro de exportação
    var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    var filename = 'database-export-' + timestamp + '.sql';
    var filepath = filename;
    
    console.log('💾 Exportando para:', filepath);
    console.log('');
    
    // Construir comando pg_dump
    // Definir password via variável de ambiente para evitar prompt
    var pgDumpCmd = 'pg_dump';
    var dumpCommand = pgDumpCmd + ' -h ' + dbHost + ' -p ' + dbPort + ' -U ' + dbUser + ' -d ' + dbName + ' --no-owner --no-acl -f "' + filepath + '"';
    
    // Definir password como variável de ambiente
    var env = Object.assign({}, process.env);
    env.PGPASSWORD = dbPassword;
    
    console.log('🔄 Executando pg_dump...');
    await execAsync(dumpCommand, { env: env });
    
    console.log('');
    console.log('✅ Exportação concluída com sucesso!');
    console.log('');
    console.log('📁 Ficheiro criado:', filepath);
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Partilhe o ficheiro', filepath, 'com o seu colega');
    console.log('   2. O colega deve executar: node src/import-db.js');
    console.log('   3. Ou usar: npm run import-db -- database-export-XXXXXX.sql');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante exportação:', error.message);
    
    if (error.message.indexOf('pg_dump') !== -1 || error.message.indexOf('not found') !== -1) {
      console.error('');
      console.error('💡 pg_dump não encontrado. Soluções:');
      console.error('   1. Instale PostgreSQL client tools');
      console.error('   2. Ou use exportação alternativa via script Node.js');
      console.error('');
      console.error('   Alternativa: Execute manualmente no terminal:');
      console.error('   set PGPASSWORD=' + (process.env.DB_PASSWORD || 'demo_password'));
      console.error('   pg_dump -h ' + (process.env.DB_HOST || 'localhost') + ' -p ' + (process.env.DB_PORT || 5433) + ' -U ' + (process.env.DB_USER || 'demo_user') + ' -d ' + (process.env.DB_NAME || 'instructions_demo') + ' --no-owner --no-acl > database-export.sql');
    }
    
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

exportDatabase();

