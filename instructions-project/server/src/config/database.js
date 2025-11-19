import { Sequelize } from 'sequelize';
import 'dotenv/config';
import dns from 'dns';

// Detectar se está usando Supabase (host contém 'supabase.co' ou DATABASE_URL contém supabase.co)
const isSupabase = process.env.DB_HOST?.includes('supabase.co') || 
                   process.env.SUPABASE_URL || 
                   process.env.DATABASE_URL?.includes('supabase.co');

// Configurar DNS para usar Google DNS
// IMPORTANTE: NODE_OPTIONS=--dns-result-order=ipv4first deve ser definido no .env ou no sistema
// Isso força Node.js a preferir IPv4 sobre IPv6 (solução oficial para problemas DNS com Supabase)
// O project-manager.bat já define isso automaticamente ao iniciar o servidor
if (isSupabase) {
  dns.setServers(['8.8.8.8', '8.8.4.4', '2001:4860:4860::8888', '2001:4860:4860::8844']);
}

// Função para converter connection string para usar pooler.supabase.com (IPv4)
// O pooler oferece endpoints IPv4 que resolvem problemas de conectividade IPv6 no Windows
function convertToPoolerConnectionString(url) {
  // Se já for uma connection string do pooler, não converter novamente
  if (!url || url.includes('pooler.supabase.com')) {
    return url;
  }
  
  // Se não for Supabase, retornar como está
  if (!url.includes('supabase.co')) {
    return url;
  }
  
  // Extrair informações da connection string atual
  // Formato: postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:PORT/postgres?sslmode=require
  const urlMatch = url.match(/postgresql?:\/\/([^:]+):([^@]+)@db\.([^.]+)\.supabase\.co:(\d+)\/([^?]+)(\?.*)?/);
  
  if (urlMatch) {
    const [, user, password, projectRef, port, database, queryParams] = urlMatch;
    
    // Tentar descobrir região (comum: eu-west-1, us-east-1, ap-southeast-1, etc.)
    // IMPORTANTE: A região deve corresponder à região do projeto Supabase
    // Pode ser necessário verificar no dashboard do Supabase (Settings → Database → Connection Pooling)
    // Se SUPABASE_REGION estiver definida no .env, usar ela
    const region = process.env.SUPABASE_REGION || 'eu-west-1'; // Região padrão
    
    // Criar connection string do pooler (usa IPv4)
    // IMPORTANTE: No pooler, o formato do usuário é: postgres.PROJECT_REF (não apenas postgres)
    // Formato: postgres://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:PORT/database?sslmode=require
    // OU: postgres://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:PORT/database?sslmode=require
    // Preservar query params originais ou adicionar sslmode=require
    const cleanDatabase = database.split('?')[0]; // Remover query params do database se houver
    const sslMode = queryParams || '?sslmode=require';
    
    // No pooler, o usuário deve ser postgres.PROJECT_REF
    const poolerUser = user === 'postgres' ? `postgres.${projectRef}` : `${user}.${projectRef}`;
    
    // Tentar aws-1 primeiro (mais comum), depois aws-0 como fallback
    // Se SUPABASE_POOLER_NUMBER estiver definido, usar ele (ex: 0, 1, 2, etc.)
    const poolerNumber = process.env.SUPABASE_POOLER_NUMBER || '1';
    const poolerUrl = `postgres://${poolerUser}:${password}@aws-${poolerNumber}-${region}.pooler.supabase.com:${port}/${cleanDatabase}${sslMode}`;
    
    console.log(`✅ Converted to pooler connection (IPv4): aws-${poolerNumber}-${region}.pooler.supabase.com`);
    console.log(`   Using pooler user format: ${poolerUser}`);
    return poolerUrl;
  }
  
  return url;
}

// Converter connection string para usar pooler (IPv4) se for Supabase
let resolvedDatabaseUrl = process.env.DATABASE_URL 
  ? convertToPoolerConnectionString(process.env.DATABASE_URL) 
  : null;

// Para variáveis separadas, também tentar usar pooler
let resolvedHost = process.env.DB_HOST;
if (process.env.DB_HOST && process.env.DB_HOST.includes('supabase.co') && !process.env.DB_HOST.includes('pooler.supabase.com')) {
  // Extrair project ref do hostname
  const hostMatch = process.env.DB_HOST.match(/db\.([^.]+)\.supabase\.co/);
  if (hostMatch) {
    const projectRef = hostMatch[1];
    // Usar pooler em vez do hostname direto
    const region = process.env.SUPABASE_REGION || 'eu-west-1';
    const poolerNumber = process.env.SUPABASE_POOLER_NUMBER || '1';
    resolvedHost = `aws-${poolerNumber}-${region}.pooler.supabase.com`;
    console.log(`✅ Using pooler host (IPv4): ${resolvedHost}`);
  }
}

// Criar instância Sequelize
let sequelize;

if (process.env.DATABASE_URL) {
  // Usar connection string (convertida para pooler se Supabase)
  const urlIsSupabase = (resolvedDatabaseUrl || process.env.DATABASE_URL).includes('supabase.co') || 
                         (resolvedDatabaseUrl || process.env.DATABASE_URL).includes('pooler.supabase.com');
  const connectionUrl = resolvedDatabaseUrl || process.env.DATABASE_URL;
  
  // Se for pooler, extrair componentes e usar variáveis separadas para garantir SSL correto
  if (connectionUrl.includes('pooler.supabase.com')) {
    // Formato pooler: postgres://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:PORT/database
    // OU: postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:PORT/database
    const poolerMatch = connectionUrl.match(/postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
    if (poolerMatch) {
      const [, , poolerUser, password, host, port, database] = poolerMatch;
      // poolerUser já está no formato correto: postgres.PROJECT_REF
      // Usar variáveis separadas para garantir que SSL seja aplicado corretamente
      sequelize = new Sequelize(database, poolerUser, password, {
        host: host,
        port: parseInt(port),
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        timezone: '+00:00', // UTC - evita consultas desnecessárias a pg_timezone_names
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false, // Aceitar certificados self-signed do pooler
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
    } else {
      // Fallback para connection string se parsing falhar
      sequelize = new Sequelize(connectionUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        timezone: '+00:00', // UTC - evita consultas desnecessárias a pg_timezone_names
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
    }
  } else {
    // Connection string normal (não pooler)
    sequelize = new Sequelize(connectionUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      timezone: '+00:00', // UTC - evita consultas desnecessárias a pg_timezone_names
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
  }
} else {
  // Usar variáveis separadas (com IP IPv6 se necessário)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'instructions_demo',
    process.env.DB_USER || 'demo_user',
    process.env.DB_PASSWORD || 'demo_password',
    {
      host: resolvedHost || 'localhost',
      port: process.env.DB_PORT || 5433,
      dialect: 'postgres',
      protocol: 'postgres', // Especificar protocolo explicitamente
      logging: false,
      timezone: '+00:00', // UTC - evita consultas desnecessárias a pg_timezone_names
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

// Testar conexão
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão PostgreSQL estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    return false;
  }
}

export default sequelize;

