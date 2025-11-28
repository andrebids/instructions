/**
 * Migration para criar as tabelas de orders
 * Execute com: node src/migrations/20251128_create_orders_tables.js
 */

import sequelize from '../config/database.js';

async function createOrdersTables() {
  try {
    console.log('🔄 Criando tabelas de orders...');

    // Criar tabela orders
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        total DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        ordered_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela orders criada');

    // Criar tabela order_items
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        product_id VARCHAR(255),
        decoration_id UUID,
        item_type VARCHAR(50) DEFAULT 'product',
        name VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10, 2),
        variant JSONB DEFAULT '{}',
        image_url VARCHAR(500),
        source_image_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabela order_items criada');

    // Criar índices
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_decoration_id ON order_items(decoration_id);
    `);
    console.log('✅ Índices criados');

    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

createOrdersTables();

