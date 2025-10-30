import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Importação da Base de Dados
 * Importa um ficheiro .sql para a base de dados PostgreSQL
 * 
 * Uso: node src/import-db.js [caminho-do-ficheiro.sql]
 * Exemplo: node src/import-db.js database-export-2025-01-30.sql
 */

async function importDatabase(sqlFile) {
  try {
    console.log('📥 Iniciando importação da base de dados...');
    console.log('');
    
    // Obter ficheiro SQL
    var sqlFilePath;
    if (sqlFile) {
      sqlFilePath = path.resolve(sqlFile);
    } else {
      // Procurar o ficheiro mais recente de exportação
      var dir = path.dirname(__dirname);
      var files = fs.readdirSync(dir);
      var dumpFiles = files.filter(function(f) {
        return f.startsWith('database-export-') && f.endsWith('.sql');
      });
      
      if (dumpFiles.length === 0) {
        console.error('❌ Nenhum ficheiro de exportação encontrado!');
        console.error('');
        console.error('💡 Coloque o ficheiro .sql na pasta server/ e execute:');
        console.error('   npm run import-db -- nome-do-ficheiro.sql');
        process.exit(1);
      }
      
      // Ordenar por data (mais recente primeiro)
      dumpFiles.sort().reverse();
      sqlFilePath = path.join(dir, dumpFiles[0]);
      console.log('📁 Ficheiro encontrado automaticamente:', dumpFiles[0]);
    }
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Ficheiro não encontrado:', sqlFilePath);
      process.exit(1);
    }
    
    console.log('📋 Importando de:', sqlFilePath);
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
    
    // Verificar se a base de dados existe
    console.log('🔍 Verificando conexão...');
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão estabelecida');
    } catch (connError) {
      console.error('❌ Erro ao conectar:', connError.message);
      console.error('');
      console.error('💡 Verifique:');
      console.error('   1. PostgreSQL está a correr');
      console.error('   2. Credenciais no .env estão corretas');
      console.error('   3. Base de dados existe');
      process.exit(1);
    }
    console.log('');
    
    // Construir comando psql
    var psqlCmd = 'psql';
    var importCommand = psqlCmd + ' -h ' + dbHost + ' -p ' + dbPort + ' -U ' + dbUser + ' -d ' + dbName + ' -f "' + sqlFilePath + '"';
    
    // Definir password como variável de ambiente
    var env = Object.assign({}, process.env);
    env.PGPASSWORD = dbPassword;
    
    console.log('🔄 Executando importação...');
    console.log('   ⚠️  Isto pode demorar alguns minutos...');
    console.log('');
    
    await execAsync(importCommand, { env: env });
    
    console.log('');
    console.log('✅ Importação concluída com sucesso!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Execute: npm run setup (para garantir schema atualizado)');
    console.log('   2. Execute: npm run dev (para iniciar servidor)');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante importação:', error.message);
    
    if (error.message.indexOf('psql') !== -1 || error.message.indexOf('not found') !== -1) {
      console.error('');
      console.error('💡 psql não encontrado. Soluções:');
      console.error('   1. Instale PostgreSQL client tools');
      console.error('   2. Ou use importação alternativa via script Node.js');
      console.error('');
      console.error('   Alternativa: Execute manualmente no terminal:');
      console.error('   set PGPASSWORD=' + (process.env.DB_PASSWORD || 'demo_password'));
      console.error('   psql -h ' + (process.env.DB_HOST || 'localhost') + ' -p ' + (process.env.DB_PORT || 5433) + ' -U ' + (process.env.DB_USER || 'demo_user') + ' -d ' + (process.env.DB_NAME || 'instructions_demo') + ' -f "' + sqlFilePath + '"');
    }
    
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Obter ficheiro dos argumentos
var sqlFile = process.argv[2];
importDatabase(sqlFile);

