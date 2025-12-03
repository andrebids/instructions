import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add created_by column to projects table
 * Adiciona coluna created_by à tabela projects para rastrear o criador do projeto
 * 
 * Esta migration:
 * 1. Adiciona a coluna created_by VARCHAR(255) se não existir
 * 2. Cria índice para performance
 * 
 * Uso: npm run migrate:createdBy
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar coluna created_by à tabela projects...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela projects existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      );
    `;
    
    const tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0]?.exists) {
      console.log('⚠️  Tabela "projects" não existe. Execute o sync dos modelos primeiro.');
      return;
    }
    
    // Verificar se a coluna created_by já existe
    const checkColumnQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'created_by'
      );
    `;
    
    const columnExists = await sequelize.query(checkColumnQuery, {
      type: QueryTypes.SELECT
    });
    
    if (columnExists[0]?.exists) {
      console.log('⏭️  Coluna created_by já existe, pulando adição...');
      
      // Verificar se o índice existe
      const checkIndexQuery = `
        SELECT EXISTS (
          SELECT FROM pg_indexes 
          WHERE schemaname = 'public' 
          AND tablename = 'projects' 
          AND indexname = 'idx_projects_created_by'
        );
      `;
      
      const indexExists = await sequelize.query(checkIndexQuery, {
        type: QueryTypes.SELECT
      });
      
      if (!indexExists[0]?.exists) {
        console.log('📊 Criando índice idx_projects_created_by...');
        await sequelize.query(`
          CREATE INDEX idx_projects_created_by ON projects(created_by);
        `);
        console.log('✅ Índice criado com sucesso');
      } else {
        console.log('⏭️  Índice idx_projects_created_by já existe');
      }
      
      return;
    }
    
    // Adicionar coluna created_by
    console.log('📋 Adicionando coluna created_by...');
    await sequelize.query(`
      ALTER TABLE projects 
      ADD COLUMN created_by VARCHAR(255);
    `);
    console.log('✅ Coluna created_by adicionada com sucesso');
    
    // Criar índice para performance
    console.log('📊 Criando índice idx_projects_created_by...');
    await sequelize.query(`
      CREATE INDEX idx_projects_created_by ON projects(created_by);
    `);
    console.log('✅ Índice criado com sucesso');
    
    console.log('');
    console.log('✅ Migration concluída com sucesso!');
    console.log('');
    console.log('💡 Nota: Projetos existentes terão created_by como NULL.');
    console.log('   Você pode atualizar manualmente ou deixar como está.');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migration se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate()
    .then(() => {
      console.log('✅ Migration executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    });
}

export default migrate;

