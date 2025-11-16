import sequelize from './config/database.js';
import 'dotenv/config';

/**
 * Script para verificar qual base de dados está a ser usada
 * Mostra informações sobre a conexão atual
 * 
 * Uso: node src/check-connection.js
 */

async function checkConnection() {
  try {
    console.log('🔍 Verificando conexão com a base de dados...');
    console.log('');
    
    // Mostrar configuração do .env
    console.log('📋 Configuração atual:');
    console.log('   DB_HOST:', process.env.DB_HOST || 'localhost');
    console.log('   DB_PORT:', process.env.DB_PORT || '5433');
    console.log('   DB_NAME:', process.env.DB_NAME || 'instructions_demo');
    console.log('   DB_USER:', process.env.DB_USER || 'demo_user');
    console.log('');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('');
    
    // Obter informações da conexão real
    var config = sequelize.config;
    console.log('🌐 Informações da conexão:');
    console.log('   Host:', config.host);
    console.log('   Port:', config.port);
    console.log('   Database:', config.database);
    console.log('   Dialect:', config.dialect);
    console.log('');
    
    // Verificar se é localhost ou remoto
    var isRemote = config.host !== 'localhost' && config.host !== '127.0.0.1';
    
    if (isRemote) {
      // Verificar se é Supabase
      if (config.host.includes('supabase.co')) {
        console.log('✅ ESTÁ A USAR SUPABASE');
        console.log('   Host:', config.host);
        console.log('');
        console.log('💡 Isto significa que:');
        console.log('   - Base de dados gerenciada pelo Supabase');
        console.log('   - Storage de arquivos integrado');
        console.log('   - Requer ligação à internet');
        if (process.env.SUPABASE_URL) {
          console.log('   - Supabase Storage configurado');
        } else {
          console.log('   - ⚠️  Supabase Storage não configurado (SUPABASE_URL não definida)');
        }
      } else {
        console.log('✅ ESTÁ A USAR A BASE DE DADOS ONLINE (Remoto)');
        console.log('   IP:', config.host);
        console.log('');
        console.log('💡 Isto significa que:');
        console.log('   - Todos os desenvolvedores veem os mesmos dados');
        console.log('   - Alterações são sincronizadas em tempo real');
        console.log('   - Requer ligação à internet');
      }
    } else {
      console.log('📌 ESTÁ A USAR A BASE DE DADOS LOCAL');
      console.log('   Host:', config.host);
      console.log('');
      console.log('💡 Para usar Supabase:');
      console.log('   - Configure DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
      console.log('   - Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (opcional)');
    }
    console.log('');
    
    // Mostrar timestamp atual da BD para confirmar que está conectado
    var result = await sequelize.query("SELECT NOW() as current_time, current_database() as database_name, inet_server_addr() as server_ip, inet_server_port() as server_port", { type: sequelize.QueryTypes.SELECT });
    
    if (result && result[0]) {
      console.log('📊 Informações do servidor PostgreSQL:');
      console.log('   Hora atual do servidor:', result[0].current_time);
      console.log('   Base de dados:', result[0].database_name);
      if (result[0].server_ip) {
        console.log('   IP do servidor:', result[0].server_ip);
      }
      if (result[0].server_port) {
        console.log('   Porta do servidor:', result[0].server_port);
      }
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    console.log('');
    console.log('💡 Verifique:');
    console.log('   1. Credenciais no .env estão corretas');
    console.log('   2. Ligação à internet (se usar base de dados remota)');
    console.log('   3. PostgreSQL está a correr (se usar localhost)');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

checkConnection();

