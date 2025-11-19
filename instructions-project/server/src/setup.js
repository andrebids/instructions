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
      const { stdout } = await execAsync('npm run migrate', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campos de canvas verificados');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campos já existem, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campos podem já existir)...');
      }
    }
    console.log('');
    
    // Migration 2: Campos de categoria de produtos
    console.log('   📋 Migration: Campos de categoria de produtos...');
    try {
      const { stdout, stderr } = await execAsync('npm run migrate:products', { 
        timeout: 30000, // 30 segundos timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campos de categoria verificados');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      // Se a migration falhar mas os campos já existem, não é um erro crítico
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campos já existem, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campos podem já existir)...');
      }
    }
    console.log('');
    
    // Migration 3: Campos de dimensões de produtos
    console.log('   📋 Migration: Campos de dimensões de produtos...');
    try {
      const { stdout } = await execAsync('npm run migrate:dimensions', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campos de dimensões verificados');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campos já existem, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campos podem já existir)...');
      }
    }
    console.log('');
    
    // Migration 4: Campo de animação/simulação de produtos
    console.log('   📋 Migration: Campo de animação/simulação...');
    try {
      const { stdout } = await execAsync('npm run migrate:animationSimulation', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campo de animação/simulação verificado');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campo já existe, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campo pode já existir)...');
      }
    }
    console.log('');
    
    // Migration 5: Tabela de notas de projetos
    console.log('   📋 Migration: Tabela de notas de projetos...');
    try {
      const { stdout } = await execAsync('npm run migrate:notes', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Tabela de notas verificada');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Tabela já existe, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (tabela pode já existir)...');
      }
    }
    console.log('');
    
    // Migration 6: Campo lastEditedStep
    console.log('   📋 Migration: Campo lastEditedStep...');
    try {
      const { stdout } = await execAsync('npm run migrate:lastEditedStep', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campo lastEditedStep verificado');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campo já existe, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campo pode já existir)...');
      }
    }
    console.log('');
    
    // Migration 7: Campos de cartouche por imagem
    console.log('   📋 Migration: Campos de cartouche por imagem...');
    try {
      const { stdout } = await execAsync('npm run migrate:cartouche', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campos de cartouche verificados');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campos já existem, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campos podem já existir)...');
      }
    }
    console.log('');
    
    // Migration 8: Campos de estado das simulações
    console.log('   📋 Migration: Campos de estado das simulações (uploadedImages, simulationState)...');
    try {
      const { stdout } = await execAsync('npm run migrate:simulationState', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campos de estado das simulações verificados');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campos já existem, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campos podem já existir)...');
      }
    }
    console.log('');
    
    // Migration 9: Status draft para projetos
    console.log('   📋 Migration: Adicionar status "draft" aos projetos...');
    try {
      const { stdout } = await execAsync('npm run migrate:draft', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Status "draft" verificado');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Status já existe, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (status pode já existir)...');
      }
    }
    console.log('');
    
    // Migration 10: Campo logoDetails para projetos
    console.log('   📋 Migration: Campo logoDetails para projetos...');
    try {
      const { stdout } = await execAsync('npm run migrate:logoDetails', { 
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      if (stdout.includes('✅') || stdout.includes('⏭️')) {
        console.log('   ✅ Campo logoDetails verificado');
      } else {
        console.log('   ⚠️  Migration executada (pode já estar aplicada)');
      }
    } catch (error) {
      if (error.stdout && (error.stdout.includes('já existe') || error.stdout.includes('já existem'))) {
        console.log('   ✅ Campo já existe, pulando...');
      } else {
        console.log('   ⚠️  Aviso:', error.message.split('\n')[0]);
        console.log('   💡 Continuando (campo pode já existir)...');
      }
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

