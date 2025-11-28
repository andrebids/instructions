import sequelize from '../config/database.js';

async function createOrderTables() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida');

    // Criar tipo ENUM se não existir
    console.log('🔄 Criando tipos ENUM...');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_order_items_item_type" AS ENUM('product', 'decoration');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);
    console.log('✅ ENUM item_type criado/verificado');

    // Verificar se a tabela orders existe
    const [ordersExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'orders'
      );
    `);

    if (!ordersExists[0]?.exists) {
      console.log('🔄 Criando tabela orders...');
      await sequelize.query(`
        CREATE TABLE orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          status VARCHAR(50) NOT NULL DEFAULT 'draft',
          total DECIMAL(10, 2) DEFAULT 0,
          notes TEXT,
          ordered_at TIMESTAMP WITH TIME ZONE,
          delivered_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela orders criada');
    } else {
      console.log('ℹ️ Tabela orders já existe');
    }

    // Verificar se a tabela order_items existe
    const [itemsExists] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'order_items'
      );
    `);

    if (itemsExists[0]?.exists) {
      console.log('🔄 Tabela order_items existe, verificando e atualizando colunas...');
      
      // Verificar se a coluna item_type existe
      const [itemTypeExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'order_items' AND column_name = 'item_type'
        );
      `);

      if (!itemTypeExists[0]?.exists) {
        console.log('🔄 Adicionando coluna item_type...');
        await sequelize.query(`
          ALTER TABLE order_items 
          ADD COLUMN item_type "enum_order_items_item_type" DEFAULT 'product';
        `);
        console.log('✅ Coluna item_type adicionada');
      }

      // Verificar se a coluna source_image_id existe
      const [sourceImageExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'order_items' AND column_name = 'source_image_id'
        );
      `);

      if (!sourceImageExists[0]?.exists) {
        console.log('🔄 Adicionando coluna source_image_id...');
        await sequelize.query(`
          ALTER TABLE order_items ADD COLUMN source_image_id VARCHAR(255);
        `);
        console.log('✅ Coluna source_image_id adicionada');
      }

      // Verificar se a coluna decoration_id existe
      const [decorationIdExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'order_items' AND column_name = 'decoration_id'
        );
      `);

      if (!decorationIdExists[0]?.exists) {
        console.log('🔄 Adicionando coluna decoration_id...');
        await sequelize.query(`
          ALTER TABLE order_items 
          ADD COLUMN decoration_id UUID REFERENCES decorations(id) ON DELETE RESTRICT;
        `);
        console.log('✅ Coluna decoration_id adicionada');
      }
    } else {
      console.log('🔄 Criando tabela order_items...');
      await sequelize.query(`
        CREATE TABLE order_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          product_id VARCHAR(255) REFERENCES products(id) ON DELETE RESTRICT,
          decoration_id UUID REFERENCES decorations(id) ON DELETE RESTRICT,
          item_type "enum_order_items_item_type" NOT NULL DEFAULT 'product',
          name VARCHAR(255) NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit_price DECIMAL(10, 2),
          variant JSON DEFAULT '{}',
          image_url VARCHAR(255),
          source_image_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      console.log('✅ Tabela order_items criada');
    }

    // Verificar colunas da tabela order_items
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas em order_items:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('✅ Setup completo!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createOrderTables();
