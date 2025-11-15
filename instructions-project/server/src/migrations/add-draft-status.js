import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add 'draft' status to projects.status ENUM and update default value
 * Adiciona o status 'draft' ao ENUM de status e atualiza o valor padrão
 * 
 * Esta migration:
 * 1. Adiciona 'draft' como primeiro valor ao ENUM de status (se não existir)
 * 2. Atualiza o defaultValue da coluna status para 'draft'
 * 3. Atualiza projetos existentes sem status (NULL) para 'draft'
 * 
 * Uso: npm run migrate:draft
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar status "draft" ao ENUM de projetos...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela projects existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'projects'
      );
    `;
    
    const tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela "projects" não existe. Execute o sync dos modelos primeiro.');
      return;
    }
    
    // Verificar o tipo ENUM atual da coluna status
    const checkEnumTypeQuery = `
      SELECT 
        udt_name as enum_name,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'status';
    `;
    
    const enumInfo = await sequelize.query(checkEnumTypeQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!enumInfo || enumInfo.length === 0) {
      console.log('⚠️  Coluna "status" não encontrada na tabela projects.');
      return;
    }
    
    const enumName = enumInfo[0].enum_name;
    console.log(`📋 Tipo ENUM atual: ${enumName}`);
    console.log(`📋 Default atual: ${enumInfo[0].column_default || 'Nenhum'}`);
    
    // Verificar se 'draft' já existe no ENUM
    const checkDraftValueQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'draft' 
        AND enumtypid = (
          SELECT oid 
          FROM pg_type 
          WHERE typname = '${enumName}'
        )
      );
    `;
    
    const draftExists = await sequelize.query(checkDraftValueQuery, {
      type: QueryTypes.SELECT
    });
    
    const hasDraft = draftExists[0]?.exists || false;
    console.log(`📋 Status 'draft' existe no ENUM? ${hasDraft ? 'Sim' : 'Não'}`);
    
    if (!hasDraft) {
      // Adicionar 'draft' ao ENUM
      // No PostgreSQL, podemos adicionar ao final do ENUM
      console.log('➕ Adicionando valor "draft" ao ENUM...');
      
      const addDraftValueQuery = `
        ALTER TYPE ${enumName} ADD VALUE 'draft';
      `;
      
      try {
        await sequelize.query(addDraftValueQuery);
        console.log('✅ Valor "draft" adicionado ao ENUM');
      } catch (error) {
        // Verificar se o erro é porque o valor já existe (caso raro)
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log('⏭️  Valor "draft" já existe no ENUM (pode ter sido adicionado em outra execução)');
        } else {
          throw error;
        }
      }
    } else {
      console.log('⏭️  Valor "draft" já existe no ENUM, pulando adição...');
    }
    
    // Atualizar defaultValue da coluna para 'draft'
    console.log('🔄 Atualizando defaultValue da coluna status...');
    const updateDefaultQuery = `
      ALTER TABLE projects 
      ALTER COLUMN status SET DEFAULT 'draft';
    `;
    
    await sequelize.query(updateDefaultQuery);
    console.log('✅ DefaultValue da coluna status atualizado para "draft"');
    
    // Atualizar projetos existentes que têm status NULL para 'draft'
    console.log('🔄 Atualizando projetos existentes com status NULL...');
    const updateNullStatusQuery = `
      UPDATE projects 
      SET status = 'draft' 
      WHERE status IS NULL;
    `;
    
    const updateResult = await sequelize.query(updateNullStatusQuery);
    const rowsAffected = updateResult[1] || 0;
    console.log(`✅ ${rowsAffected} projeto(s) com status NULL atualizado(s) para "draft"`);
    
    // Verificar valores do ENUM após a migration
    const checkAllEnumValuesQuery = `
      SELECT enumlabel as value 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = '${enumName}'
      )
      ORDER BY enumsortorder;
    `;
    
    const allValues = await sequelize.query(checkAllEnumValuesQuery, {
      type: QueryTypes.SELECT
    });
    
    console.log('\n📋 Valores do ENUM após migration:');
    allValues.forEach((v, i) => {
      console.log(`   ${i + 1}. ${v.value}`);
    });
    
    console.log('\n🎉 Migration concluída com sucesso!');
    console.log('💡 Novos projetos terão status "draft" por padrão.');
    
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

