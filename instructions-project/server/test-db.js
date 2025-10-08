import sequelize from './src/config/database.js';

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão PostgreSQL...');
    console.log('\n📊 Configuração sendo usada:');
    console.log('   - Database:', sequelize.config.database);
    console.log('   - User:', sequelize.config.username);
    console.log('   - Host:', sequelize.config.host);
    console.log('   - Port:', sequelize.config.port);
    console.log('   - Password:', sequelize.config.password ? '***' : 'NOT SET');
    
    await sequelize.authenticate();
    console.log('\n✅ Conexão estabelecida com sucesso!');
    
    await sequelize.close();
    console.log('✅ Teste concluído!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error.message);
    console.error('❌ Erro completo:', error);
    process.exit(1);
  }
}

testDatabase();

