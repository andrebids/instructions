/**
 * Migration: Enable Row Level Security (RLS) on public tables
 * 
 * Esta migration habilita RLS nas seguintes tabelas:
 * - tasks
 * - observations
 * - orders
 * - order_items
 * - SequelizeMeta
 * 
 * IMPORTANTE: Como o acesso a essas tabelas é feito através do backend
 * (usando service_role key), as políticas RLS bloqueiam acesso público
 * via PostgREST para prevenir acesso não autorizado direto ao Supabase.
 * 
 * Para executar manualmente:
 * node src/migrations/enable-rls-on-public-tables.js
 */

import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Função de migration exportada (usada pelo migrationRunner)
 */
export async function migrate() {
  return enableRLS();
}

/**
 * Função principal de habilitação de RLS
 */
async function enableRLS() {
  try {
    console.log('🔄 Habilitando Row Level Security (RLS) nas tabelas públicas...');
    
    // Verificar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida\n');
    
    // Habilitar RLS em todas as tabelas
    const tables = ['tasks', 'observations', 'orders', 'order_items', 'SequelizeMeta'];
    
    for (const tableName of tables) {
      console.log(`📋 Processando tabela: ${tableName}`);
      
      // Verificar se a tabela existe
      const [tableExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = :tableName
        ) as exists;
      `, {
        replacements: { tableName },
        type: QueryTypes.SELECT
      });
      
      if (!tableExists.exists) {
        console.log(`   ⚠️  Tabela não existe, pulando...`);
        continue;
      }
      
      // Verificar se RLS já está habilitado
      const [rlsStatus] = await sequelize.query(`
        SELECT relrowsecurity as rls_enabled
        FROM pg_class
        WHERE relname = :tableName
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
      `, {
        replacements: { tableName },
        type: QueryTypes.SELECT
      });
      
      if (!rlsStatus || !rlsStatus.rls_enabled) {
        // Habilitar RLS
        await sequelize.query(`
          ALTER TABLE public."${tableName}" 
          ENABLE ROW LEVEL SECURITY;
        `);
        console.log(`   ✅ RLS habilitado`);
      } else {
        console.log(`   ℹ️  RLS já estava habilitado`);
      }
      
      // Remover políticas existentes com o mesmo nome (se houver) para evitar conflitos
      try {
        await sequelize.query(`
          DROP POLICY IF EXISTS "Block public access to ${tableName}" ON public."${tableName}";
        `);
      } catch (e) {
        // Ignorar erros se a política não existir
      }
      
      // Criar política que bloqueia acesso público via PostgREST
      // O acesso via backend (service_role) não é afetado por RLS
      await sequelize.query(`
        CREATE POLICY "Block public access to ${tableName}"
        ON public."${tableName}"
        FOR ALL
        USING (false);
      `);
      console.log(`   ✅ Política de bloqueio criada`);
    }
    
    console.log('\n✅ RLS habilitado com sucesso em todas as tabelas!');
    console.log('📋 Tabelas protegidas:');
    tables.forEach(table => console.log(`   - ${table}`));
    console.log('\n💡 Nota: O acesso via backend (service_role) não é afetado por RLS.');
    console.log('   As políticas bloqueiam apenas acesso público via PostgREST.');
  } catch (error) {
    console.error('❌ Erro ao habilitar RLS:', error);
    console.error('\n💡 Dica: Verifique se você tem permissões adequadas no banco de dados.');
    console.error('💡 Alternativa: Execute o arquivo SQL diretamente no Supabase SQL Editor:');
    console.error('   src/migrations/enable-rls-on-public-tables.sql');
    throw error;
  }
}

// Executar apenas se chamado diretamente (não quando importado pelo migrationRunner)
const isMainModule = process.argv[1] && (
  process.argv[1].replace(/\\/g, '/').endsWith(__filename.replace(/\\/g, '/')) ||
  process.argv[1].replace(/\\/g, '/').endsWith('enable-rls-on-public-tables.js')
);

if (isMainModule) {
  enableRLS()
    .then(async () => {
      await sequelize.close();
      console.log('✅ Migration executada com sucesso');
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('❌ Erro ao executar migration:', error);
      try {
        await sequelize.close();
      } catch (closeError) {
        // Ignorar erros ao fechar
      }
      process.exit(1);
    });
}

