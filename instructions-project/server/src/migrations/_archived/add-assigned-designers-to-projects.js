import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Migration: Add assignedDesigners field to projects table
 * Adiciona campo para designers atribuídos à tabela projects
 * 
 * Esta migration adiciona o seguinte campo:
 * - assignedDesigners: Array de designers atribuídos: [{ id, name, email, image }]
 */
export async function migrate() {
    try {
        console.log('🔄 Iniciando migration: Adicionar campo assignedDesigners ao projeto...');
        console.log('📅 Data:', new Date().toISOString());

        // Testar conexão com a base de dados
        await sequelize.authenticate();
        console.log('✅ Conexão com base de dados estabelecida');

        // Verificar se o campo já existe
        const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'assignedDesigners';
    `;

        const existingColumns = await sequelize.query(checkColumnsQuery, {
            type: QueryTypes.SELECT
        });

        if (existingColumns.length > 0) {
            console.log('⏭️  Campo "assignedDesigners" já existe, pulando...');
        } else {
            // Adicionar campo
            // Usando JSONB para Postgres, fallback para JSON se necessário, mas o projeto usa Postgres
            const alterQuery = `
        ALTER TABLE projects 
        ADD COLUMN "assignedDesigners" JSONB DEFAULT '[]'::jsonb;
      `;

            await sequelize.query(alterQuery);
            console.log('✅ Campo "assignedDesigners" adicionado com sucesso');
        }

        console.log('\n🎉 Migration concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante migration:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Executar apenas se chamado diretamente (não quando importado)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('add-assigned-designers-to-projects.js')
);

if (isMainModule) {
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
