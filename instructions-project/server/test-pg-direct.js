import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'instructions_demo',
  user: 'demo_user',
  password: 'demo_password',
});

async function test() {
  try {
    console.log('🔍 Testando conexão direta com pg...');
    console.log('   - host:', client.host);
    console.log('   - port:', client.port);
    console.log('   - database:', client.database);
    console.log('   - user:', client.user);
    console.log('   - password:', client.password ? '***' : 'NOT SET');
    
    await client.connect();
    console.log('✅ Conectado!');
    
    const res = await client.query('SELECT version()');
    console.log('✅ Query executada:', res.rows[0].version);
    
    await client.end();
    console.log('✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Código:', error.code);
    process.exit(1);
  }
}

test();

