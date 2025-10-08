import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'instructions_demo',
  process.env.DB_USER || 'demo_user',
  process.env.DB_PASSWORD || 'demo_password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    dialect: 'postgres',
    logging: false, // Desabilitar logs SQL (pode ativar para debug)
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

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

