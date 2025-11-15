import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Script de Setup Inicial
 * Executa todas as migrations necessárias para configurar a base de dados
 * 
 * Uso: npm run setup
 */
async function setup() {
  try {
    console.log('🚀 Iniciando setup da base de dados...');
    console.log('📅 Data:', new Date().toISOString());
    console.log('');
    
    // Verificar conexão com a base de dados
    console.log('1️⃣  Verificando conexão com a base de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');
    
    // Carregar modelos
    console.log('2️⃣  Carregando modelos...');
    await import('./models/index.js');
    console.log('✅ Modelos carregados');
    console.log('');
    
    // Sincronizar tabelas básicas (criar se não existirem)
    console.log('3️⃣  Criando/sincronizando tabelas básicas...');
    await sequelize.sync({ alter: false });
    console.log('✅ Tabelas sincronizadas');
    console.log('');
    
    // Fechar conexão antes de executar migrations (elas criam suas próprias conexões)
    await sequelize.close();
    
    // Executar migrations usando child_process para evitar conflitos de conexão
    console.log('4️⃣  Executando migrations...');
    console.log('');
    
    // Migration 1: Campos de canvas
    console.log('   📋 Migration: Campos de canvas...');
    try {
      await execAsync('npm run migrate');
      console.log('   ✅ Campos de canvas verificados');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 2: Campos de categoria de produtos
    console.log('   📋 Migration: Campos de categoria de produtos...');
    try {
      await execAsync('npm run migrate:products');
      console.log('   ✅ Campos de categoria verificados');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 3: Campos de dimensões de produtos
    console.log('   📋 Migration: Campos de dimensões de produtos...');
    try {
      await execAsync('npm run migrate:dimensions');
      console.log('   ✅ Campos de dimensões verificados');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 4: Campo de animação/simulação de produtos
    console.log('   📋 Migration: Campo de animação/simulação...');
    try {
      await execAsync('npm run migrate:animationSimulation');
      console.log('   ✅ Campo de animação/simulação verificado');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 5: Tabela de notas de projetos
    console.log('   📋 Migration: Tabela de notas de projetos...');
    try {
      await execAsync('npm run migrate:notes');
      console.log('   ✅ Tabela de notas verificada');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 6: Campo lastEditedStep
    console.log('   📋 Migration: Campo lastEditedStep...');
    try {
      await execAsync('npm run migrate:lastEditedStep');
      console.log('   ✅ Campo lastEditedStep verificado');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 7: Campos de cartouche por imagem
    console.log('   📋 Migration: Campos de cartouche por imagem...');
    try {
      await execAsync('npm run migrate:cartouche');
      console.log('   ✅ Campos de cartouche verificados');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 8: Campos de estado das simulações
    console.log('   📋 Migration: Campos de estado das simulações (uploadedImages, simulationState)...');
    try {
      await execAsync('npm run migrate:simulationState');
      console.log('   ✅ Campos de estado das simulações verificados');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    // Migration 9: Status draft para projetos
    console.log('   📋 Migration: Adicionar status "draft" aos projetos...');
    try {
      await execAsync('npm run migrate:draft');
      console.log('   ✅ Status "draft" verificado');
    } catch (error) {
      console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
      console.log('   💡 Continuando...');
    }
    console.log('');
    
    console.log('✅ Setup concluído com sucesso!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   - Executar seed de dados: npm run seed:products');
    console.log('   - Iniciar servidor: npm run dev');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante setup:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar setup
setup();

