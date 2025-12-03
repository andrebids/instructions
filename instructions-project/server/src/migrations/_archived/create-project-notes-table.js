import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Create project_notes table
 * Cria tabela para armazenar notas dos projetos usando Hocuspocus/Y.js
 * 
 * Esta migration cria a tabela project_notes com os seguintes campos:
 * - id: UUID (PK)
 * - projectId: UUID (FK para projects)
 * - documentName: STRING (único, usado pelo Hocuspocus)
 * - data: BYTEA (dados binários Y.js)
 * - updatedAt: TIMESTAMP
 * 
 * Uso: npm run migrate:notes
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Criar tabela project_notes...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela já existe
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_notes'
      );
    `;
    
    const tableExists = await sequelize.query(checkTableQuery, {
      type: QueryTypes.SELECT
    });
    
    if (tableExists[0]?.exists) {
      console.log('⏭️  Tabela project_notes já existe, pulando criação...');
      console.log('💡 Se precisar recriar, execute: DROP TABLE project_notes CASCADE;');
      return;
    }
    
    // Criar tabela project_notes
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "project_notes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "projectId" UUID NOT NULL,
        "documentName" VARCHAR(255) NOT NULL UNIQUE,
        "data" BYTEA,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "project_notes_projectId_fkey" 
          FOREIGN KEY ("projectId") 
          REFERENCES "projects"("id") 
          ON DELETE CASCADE
      );
    `;
    
    await sequelize.query(createTableQuery);
    console.log('✅ Tabela project_notes criada com sucesso');
    
    // Criar índice único em documentName (já está na constraint UNIQUE, mas vamos criar índice adicional para performance)
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS "project_notes_documentName_idx" 
      ON "project_notes"("documentName");
    `;
    
    await sequelize.query(createIndexQuery);
    console.log('✅ Índice em documentName criado');
    
    // Criar índice em projectId para joins mais rápidos
    const createProjectIdIndexQuery = `
      CREATE INDEX IF NOT EXISTS "project_notes_projectId_idx" 
      ON "project_notes"("projectId");
    `;
    
    await sequelize.query(createProjectIdIndexQuery);
    console.log('✅ Índice em projectId criado');
    
    console.log('\n🎉 Migration concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante migration:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Executar migration
migrate()
  .then(() => {
    console.log('✅ Migration executada com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  });

