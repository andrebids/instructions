import sequelize, { testConnection } from '../config/database.js';
import { Sequelize, QueryTypes } from 'sequelize';
import { readdir } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Variável para manter referência à instância atual do sequelize
let currentSequelize = sequelize;

/**
 * Migration Runner
 * 
 * Executa migrations pendentes automaticamente, rastreando execuções
 * na tabela SequelizeMeta.
 * 
 * Funcionalidades:
 * - Lê todas as migrations do diretório migrations/
 * - Verifica quais já foram executadas (via SequelizeMeta)
 * - Executa apenas migrations pendentes em ordem alfabética
 * - Registra execução na tabela SequelizeMeta
 * - Suporta modo dry-run para validação
 */

/**
 * Cria uma nova instância do Sequelize (útil quando a conexão foi fechada)
 * Replica a lógica do database.js para garantir compatibilidade
 * Usa a mesma instância do sequelize importada, mas cria uma nova conexão
 */
function createNewSequelizeInstance() {
  // Importar dinamicamente para evitar dependência circular
  // Mas como já importamos no topo, vamos usar a mesma configuração
  const isSupabase = process.env.DB_HOST?.includes('supabase.co') || 
                     process.env.SUPABASE_URL || 
                     process.env.DATABASE_URL?.includes('supabase.co');

  // Função helper para converter para pooler (mesma lógica do database.js)
  function convertToPoolerConnectionString(url) {
    if (!url || url.includes('pooler.supabase.com')) {
      return url;
    }
    if (!url.includes('supabase.co')) {
      return url;
    }
    const urlMatch = url.match(/postgresql?:\/\/([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:(\d+)\/([^?]+)(\?.*)?/);
    if (urlMatch) {
      const [, user, password, projectRef, port, database, queryParams] = urlMatch;
      const region = process.env.SUPABASE_REGION || 'eu-west-1';
      const poolerNumber = process.env.SUPABASE_POOLER_NUMBER || '1';
      const cleanDatabase = database.split('?')[0];
      const sslMode = queryParams || '?sslmode=require';
      const poolerUser = user === 'postgres' ? `postgres.${projectRef}` : `${user}.${projectRef}`;
      return `postgres://${poolerUser}:${password}@aws-${poolerNumber}-${region}.pooler.supabase.com:${port}/${cleanDatabase}${sslMode}`;
    }
    return url;
  }

  if (process.env.DATABASE_URL) {
    const connectionUrl = convertToPoolerConnectionString(process.env.DATABASE_URL);
    const urlIsSupabase = connectionUrl.includes('supabase.co') || 
                          connectionUrl.includes('pooler.supabase.com');
    
    // Se for pooler, extrair componentes
    if (connectionUrl.includes('pooler.supabase.com')) {
      const poolerMatch = connectionUrl.match(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
      if (poolerMatch) {
        const [, , poolerUser, password, host, port, database] = poolerMatch;
        return new Sequelize(database, poolerUser, password, {
          host: host,
          port: parseInt(port),
          dialect: 'postgres',
          protocol: 'postgres',
          logging: false,
          timezone: '+00:00',
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
            connectTimeout: 15000,
          },
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        });
      }
    }
    
    // Connection string normal
    return new Sequelize(connectionUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      timezone: '+00:00',
      dialectOptions: urlIsSupabase ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        connectTimeout: 15000,
      } : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  } else {
    // Usar variáveis separadas (com conversão para pooler se Supabase)
    let resolvedHost = process.env.DB_HOST;
    if (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co') && !process.env.DB_HOST.includes('pooler.supabase.com')) {
      const hostMatch = process.env.DB_HOST.match(/db\.([^.]+)\.supabase\.co/);
      if (hostMatch) {
        const projectRef = hostMatch[1];
        const region = process.env.SUPABASE_REGION || 'eu-west-1';
        const poolerNumber = process.env.SUPABASE_POOLER_NUMBER || '1';
        resolvedHost = `aws-${poolerNumber}-${region}.pooler.supabase.com`;
      }
    }
    
    return new Sequelize(
      process.env.DB_NAME || 'instructions_demo',
      process.env.DB_USER || 'demo_user',
      process.env.DB_PASSWORD || 'demo_password',
      {
        host: resolvedHost || 'localhost',
        port: process.env.DB_PORT || 5433,
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        timezone: '+00:00',
        dialectOptions: isSupabase ? {
          ssl: {
            require: true,
            rejectUnauthorized: false
          },
          connectTimeout: 10000,
        } : {},
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    );
  }
}

/**
 * Garante que a conexão com o banco está ativa
 * Se a conexão foi fechada, cria uma nova instância
 */
async function ensureConnection() {
  try {
    await currentSequelize.authenticate();
  } catch (error) {
    // Conexão foi fechada ou não está ativa, criar nova instância
    currentSequelize = createNewSequelizeInstance();
    await currentSequelize.authenticate();
  }
}

/**
 * Garante que a tabela SequelizeMeta existe
 */
async function ensureTrackingTable() {
  try {
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'SequelizeMeta'
      );
    `;
    
    const result = await currentSequelize.query(checkTableQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!result[0].exists) {
      // Criar tabela se não existir
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
          name VARCHAR(255) NOT NULL PRIMARY KEY
        );
      `;
      await currentSequelize.query(createTableQuery);
      console.log('✅ Tabela SequelizeMeta criada');
    }
  } catch (error) {
    console.error('❌ Erro ao garantir tabela SequelizeMeta:', error);
    throw error;
  }
}

/**
 * Obtém lista de migrations já executadas
 */
async function getExecutedMigrations() {
  try {
    const query = 'SELECT name FROM "SequelizeMeta" ORDER BY name';
    const results = await currentSequelize.query(query, {
      type: QueryTypes.SELECT
    });
    return results.map(row => row.name);
  } catch (error) {
    // Se a tabela não existir, retornar array vazio
    if (error.message && error.message.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

/**
 * Registra uma migration como executada
 */
async function recordMigration(name) {
  try {
    const query = 'INSERT INTO "SequelizeMeta" (name) VALUES (:name)';
    await currentSequelize.query(query, {
      replacements: { name },
      type: QueryTypes.INSERT
    });
  } catch (error) {
    // Se já existir (duplicado), ignorar
    if (error.message && error.message.includes('duplicate key')) {
      return;
    }
    throw error;
  }
}

/**
 * Carrega e executa uma migration
 * 
 * Nota: As migrations existentes fecham a conexão no finally.
 * Quando isso acontece, criamos uma nova instância do Sequelize para a próxima migration.
 */
async function executeMigration(migrationPath, migrationName) {
  try {
    // Garantir que a conexão está ativa antes da migration
    await ensureConnection();
    
    // Importar a migration dinamicamente usando caminho absoluto
    // Converter caminho Windows para formato correto se necessário
    let normalizedPath = migrationPath;
    if (process.platform === 'win32') {
      normalizedPath = migrationPath.replace(/\\/g, '/');
    }
    
    const migrationModule = await import(normalizedPath);
    
    // Verificar se tem função migrate exportada (named ou default)
    // Também suportar padrão Sequelize CLI (up/down)
    let migrateFunction = null;
    
    if (migrationModule.migrate && typeof migrationModule.migrate === 'function') {
      migrateFunction = migrationModule.migrate;
    } else if (migrationModule.default && typeof migrationModule.default === 'function') {
      migrateFunction = migrationModule.default;
    } else if (migrationModule.up && typeof migrationModule.up === 'function') {
      // Padrão Sequelize CLI - precisa passar queryInterface e Sequelize
      // Criar queryInterface a partir da instância atual do sequelize
      await ensureConnection();
      const queryInterface = currentSequelize.getQueryInterface();
      // Usar Sequelize importado diretamente (padrão CLI espera a classe, não instância)
      migrateFunction = async () => {
        await migrationModule.up(queryInterface, Sequelize);
      };
    }
    
    if (!migrateFunction) {
      console.log(`⚠️  Migration ${migrationName} não tem função migrate exportada, pulando...`);
      return { success: false, skipped: true };
    }
    
    // Executar a migration
    // As migrations fecham a conexão no finally, então precisamos garantir conexão depois
    await migrateFunction();
    
    // Garantir que a conexão está ativa após a migration (pode ter sido fechada)
    await ensureConnection();
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Erro ao executar migration ${migrationName}:`, error.message);
    
    // Se a conexão foi fechada, garantir que está ativa para próxima migration
    if (error.message?.includes('ConnectionManager') || error.message?.includes('closed')) {
      try {
        await ensureConnection();
      } catch (reconnectError) {
        // Ignorar erro de reconexão, será tratado no próximo loop
      }
    }
    
    return { success: false, error };
  }
}

/**
 * Executa migrations pendentes
 * 
 * @param {Object} options - Opções de execução
 * @param {boolean} options.dryRun - Se true, apenas mostra quais seriam executadas
 * @param {boolean} options.verbose - Se true, mostra mais detalhes
 * @returns {Promise<Object>} Resultado da execução
 */
export async function runMigrations(options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  try {
    console.log('🔄 Iniciando execução de migrations...');
    
    // Garantir que a tabela de tracking existe
    await ensureTrackingTable();
    
    // Obter migrations já executadas
    const executedMigrations = await getExecutedMigrations();
    if (verbose) {
      console.log(`📋 Migrations já executadas: ${executedMigrations.length}`);
    }
    
    // Ler diretório de migrations
    const migrationsDir = join(__dirname, '../migrations');
    const files = await readdir(migrationsDir);
    
    // Filtrar apenas arquivos .js (excluir README.md, diretórios e outros)
    // Excluir migration de tracking - ela é gerenciada por ensureTrackingTable()
    // Excluir migrations arquivadas (pasta _archived é ignorada automaticamente pelo readdir)
    const trackingMigration = 'create-migrations-tracking-table.js';
    const migrationFiles = files
      .filter(file => extname(file) === '.js')
      .filter(file => file !== trackingMigration)
      .sort(); // Ordenar alfabeticamente para garantir ordem consistente
    
    if (verbose) {
      console.log(`📁 Total de migrations encontradas: ${migrationFiles.length}`);
    }
    
    // Filtrar migrations pendentes
    const pendingMigrations = migrationFiles.filter(file => {
      const migrationName = basename(file, '.js');
      return !executedMigrations.includes(migrationName);
    });
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Nenhuma migration pendente');
      return {
        executed: 0,
        skipped: migrationFiles.length,
        errors: []
      };
    }
    
    console.log(`📋 Migrations pendentes: ${pendingMigrations.length}`);
    
    if (dryRun) {
      console.log('\n🔍 Modo dry-run - migrations que seriam executadas:');
      pendingMigrations.forEach(file => {
        console.log(`   - ${file}`);
      });
      return {
        executed: 0,
        pending: pendingMigrations.length,
        dryRun: true
      };
    }
    
    // Executar migrations pendentes
    const results = {
      executed: 0,
      skipped: 0,
      errors: []
    };
    
    for (const file of pendingMigrations) {
      const migrationName = basename(file, '.js');
      const migrationPath = join(migrationsDir, file);
      // Converter para URL file:// para importação dinâmica
      const migrationUrl = `file://${migrationPath.replace(/\\/g, '/')}`;
      
      console.log(`\n🔄 Executando migration: ${file}...`);
      
      try {
        // Garantir que a conexão está ativa antes de executar
        await ensureConnection();
        
        // Executar a migration
        const result = await executeMigration(migrationUrl, migrationName);
        
        if (result.success && !result.skipped) {
          // Garantir conexão ativa antes de registrar (migration pode ter fechado)
          await ensureConnection();
          
          // Registrar como executada
          await recordMigration(migrationName);
          console.log(`✅ Migration ${migrationName} executada e registrada`);
          results.executed++;
        } else if (result.skipped) {
          console.log(`⏭️  Migration ${migrationName} pulada`);
          results.skipped++;
        } else {
          throw result.error || new Error('Migration falhou');
        }
      } catch (error) {
        console.error(`❌ Erro ao executar migration ${migrationName}:`, error.message);
        results.errors.push({ migration: migrationName, error: error.message });
        
        // Tentar manter conexão ativa mesmo após erro
        try {
          await ensureConnection();
        } catch (reconnectError) {
          // Ignorar erro de reconexão, será tratado na próxima iteração
        }
        
        // Em caso de erro, parar execução (fail-fast)
        // Remover este break se quiser continuar mesmo com erros
        // break;
      }
    }
    
    console.log('\n📊 Resumo da execução:');
    console.log(`   ✅ Executadas: ${results.executed}`);
    console.log(`   ⏭️  Puladas: ${results.skipped}`);
    if (results.errors.length > 0) {
      console.log(`   ❌ Erros: ${results.errors.length}`);
      results.errors.forEach(({ migration, error }) => {
        console.log(`      - ${migration}: ${error}`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Erro ao executar migrations:', error);
    throw error;
  }
}

/**
 * Mostra status das migrations
 */
export async function getMigrationStatus() {
  try {
    await ensureTrackingTable();
    await ensureConnection();
    
    const executedMigrations = await getExecutedMigrations();
    const migrationsDir = join(__dirname, '../migrations');
    const files = await readdir(migrationsDir);
    const trackingMigration = 'create-migrations-tracking-table.js';
    const migrationFiles = files
      .filter(file => extname(file) === '.js')
      .filter(file => file !== trackingMigration)
      .sort();
    
    const pendingMigrations = migrationFiles.filter(file => {
      const migrationName = basename(file, '.js');
      return !executedMigrations.includes(migrationName);
    });
    
    return {
      total: migrationFiles.length,
      executed: executedMigrations.length,
      pending: pendingMigrations.length,
      executedMigrations: executedMigrations,
      pendingMigrations: pendingMigrations.map(f => basename(f, '.js'))
    };
  } catch (error) {
    console.error('❌ Erro ao obter status das migrations:', error);
    throw error;
  }
}

// Se executado diretamente, executar migrations
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  
  runMigrations({ dryRun, verbose })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

