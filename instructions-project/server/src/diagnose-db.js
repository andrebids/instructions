import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';
import './models/index.js';

/**
 * Script de Diagnóstico da Base de Dados
 * Verifica se as tabelas necessárias existem
 * 
 * Uso: node src/diagnose-db.js
 */

async function diagnoseDatabase() {
  try {
    console.log('🔍 Iniciando diagnóstico da base de dados...');
    console.log('');
    
    // Verificar conexão
    console.log('1️⃣  Verificando conexão com PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');
    
    // Listar todas as tabelas
    console.log('2️⃣  Verificando tabelas existentes...');
    var tables = await sequelize.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_type = 'BASE TABLE'
       ORDER BY table_name;`,
      { type: QueryTypes.SELECT }
    );
    
    console.log('📋 Tabelas encontradas:', tables.length);
    if (tables.length === 0) {
      console.log('⚠️  NENHUMA TABELA ENCONTRADA!');
      console.log('💡 Execute: npm run setup');
    } else {
      tables.forEach(function(t) {
        console.log('   ✅', t.table_name);
      });
    }
    console.log('');
    
    // Verificar tabelas específicas necessárias
    console.log('3️⃣  Verificando tabelas específicas...');
    var requiredTables = ['projects', 'decorations', 'project_elements', 'products'];
    var missingTables = [];
    
    for (var i = 0; i < requiredTables.length; i++) {
      var tableName = requiredTables[i];
      var tableExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '" + tableName + "') as exists",
        { type: QueryTypes.SELECT }
      );
      
      if (tableExists && tableExists[0] && tableExists[0].exists) {
        console.log('   ✅', tableName, '- existe');
      } else {
        console.log('   ❌', tableName, '- NÃO existe');
        missingTables.push(tableName);
      }
    }
    console.log('');
    
    if (missingTables.length > 0) {
      console.log('⚠️  TABELAS FALTANDO:', missingTables.join(', '));
      console.log('💡 Execute: npm run setup');
      console.log('');
    } else {
      console.log('✅ Todas as tabelas necessárias existem!');
      console.log('');
    }
    
    // Verificar estrutura da tabela projects se existir
    if (!missingTables.includes('projects')) {
      console.log('4️⃣  Verificando estrutura da tabela projects...');
      try {
        var columns = await sequelize.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'projects' ORDER BY ordinal_position",
          { type: QueryTypes.SELECT }
        );
        console.log('   Colunas encontradas:', columns.length);
        columns.forEach(function(col) {
          console.log('   -', col.column_name, '(', col.data_type, ')');
        });
      } catch (err) {
        console.log('   ⚠️  Erro ao verificar colunas:', err.message);
      }
      console.log('');
    }
    
    // Resumo final
    console.log('═══════════════════════════════════════');
    if (missingTables.length === 0) {
      console.log('✅ DIAGNÓSTICO: Base de dados está configurada corretamente!');
    } else {
      console.log('❌ DIAGNÓSTICO: Base de dados precisa de configuração!');
      console.log('   Execute: npm run setup');
    }
    console.log('═══════════════════════════════════════');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error.message);
    console.error('Stack:', error.stack);
    console.log('');
    console.log('💡 Verifique:');
    console.log('   1. PostgreSQL está a correr');
    console.log('   2. Credenciais no .env estão corretas');
    console.log('   3. Base de dados existe');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

diagnoseDatabase();

