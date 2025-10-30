import sequelize from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script de Verificação de Ambiente
 * Verifica se o ambiente está configurado corretamente
 * 
 * Uso: npm run check-env
 */
async function checkEnvironment() {
  var issues = [];
  var warnings = [];
  
  console.log('🔍 Verificando ambiente...');
  console.log('');
  
  // Verificar se .env existe
  var envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    issues.push('❌ Ficheiro .env não encontrado');
    console.log('💡 Crie um ficheiro .env baseado no exemplo:');
    console.log('   NODE_ENV=development');
    console.log('   PORT=5000');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5433');
    console.log('   DB_NAME=instructions_demo');
    console.log('   DB_USER=demo_user');
    console.log('   DB_PASSWORD=demo_password');
  } else {
    console.log('✅ Ficheiro .env encontrado');
  }
  
  // Verificar conexão com base de dados
  console.log('');
  console.log('🔍 Verificando conexão com base de dados...');
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se as tabelas existem
    var tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('');
    console.log('📋 Tabelas encontradas:', tables.length);
    tables.forEach(function(t) {
      console.log('   -', t.table_name);
    });
    
    if (tables.length === 0) {
      warnings.push('⚠️  Nenhuma tabela encontrada - execute: npm run setup');
    }
    
  } catch (error) {
    issues.push('❌ Erro ao conectar à base de dados: ' + error.message);
    console.log('💡 Verifique:');
    console.log('   - Se PostgreSQL está a correr');
    console.log('   - Se as credenciais no .env estão corretas');
    console.log('   - Se a base de dados existe');
  } finally {
    await sequelize.close();
  }
  
  // Verificar dependências
  console.log('');
  console.log('🔍 Verificando dependências...');
  var packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    var nodeModulesPath = path.join(__dirname, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      issues.push('❌ node_modules não encontrado');
      console.log('💡 Execute: npm install');
    } else {
      console.log('✅ node_modules encontrado');
    }
  }
  
  // Resumo
  console.log('');
  console.log('═══════════════════════════════════════');
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ Ambiente configurado corretamente!');
  } else {
    if (issues.length > 0) {
      console.log('❌ Problemas encontrados:');
      issues.forEach(function(issue) {
        console.log('   ' + issue);
      });
    }
    if (warnings.length > 0) {
      console.log('');
      console.log('⚠️  Avisos:');
      warnings.forEach(function(warning) {
        console.log('   ' + warning);
      });
    }
  }
  console.log('═══════════════════════════════════════');
  console.log('');
  
  if (issues.length > 0) {
    process.exit(1);
  }
}

checkEnvironment();

