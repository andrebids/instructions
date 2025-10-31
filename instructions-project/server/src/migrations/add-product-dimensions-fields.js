import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add dimension fields to products table
 * Adiciona campos separados para dimensões do produto (height, width, depth, diameter)
 * 
 * Campos adicionados:
 * - height: DECIMAL(10, 2) - Altura em metros (H)
 * - width: DECIMAL(10, 2) - Largura em metros (W)
 * - depth: DECIMAL(10, 2) - Profundidade em metros (D)
 * - diameter: DECIMAL(10, 2) - Diâmetro em metros
 * 
 * Uso: node src/migrations/add-product-dimensions-fields.js
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campos de dimensões aos produtos...');
    console.log('📅 Data:', new Date().toISOString());
    
    // Testar conexão com a base de dados
    await sequelize.authenticate();
    console.log('✅ Conexão com base de dados estabelecida');
    
    // Verificar se a tabela products existe
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'products'
      );
    `;
    
    const tableExists = await sequelize.query(tableExistsQuery, {
      type: QueryTypes.SELECT
    });
    
    if (!tableExists[0].exists) {
      console.log('⚠️  Tabela "products" não existe. Execute o sync dos modelos primeiro.');
      return;
    }
    
    // Verificar se os campos já existem
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('height', 'width', 'depth', 'diameter');
    `;
    
    const existingColumns = await sequelize.query(checkColumnsQuery, {
      type: QueryTypes.SELECT
    });
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    console.log('📋 Colunas existentes:', existingColumnNames.length > 0 ? existingColumnNames : 'Nenhuma');
    
    // Adicionar campos que não existem
    const fieldsToAdd = [
      {
        name: 'height',
        type: 'DECIMAL(10, 2)',
        nullable: true,
        description: 'Altura em metros (H)'
      },
      {
        name: 'width',
        type: 'DECIMAL(10, 2)',
        nullable: true,
        description: 'Largura em metros (W)'
      },
      {
        name: 'depth',
        type: 'DECIMAL(10, 2)',
        nullable: true,
        description: 'Profundidade em metros (D)'
      },
      {
        name: 'diameter',
        type: 'DECIMAL(10, 2)',
        nullable: true,
        description: 'Diâmetro em metros'
      }
    ];
    
    var addedCount = 0;
    var skippedCount = 0;
    
    for (var i = 0; i < fieldsToAdd.length; i++) {
      var field = fieldsToAdd[i];
      if (!existingColumnNames.includes(field.name)) {
        var nullable = field.nullable !== false ? 'NULL' : 'NOT NULL';
        var alterQuery = `
          ALTER TABLE products 
          ADD COLUMN "${field.name}" ${field.type} ${nullable};
        `;
        
        await sequelize.query(alterQuery);
        console.log(`✅ Campo "${field.name}" adicionado com sucesso (${field.description})`);
        addedCount++;
      } else {
        console.log(`⏭️  Campo "${field.name}" já existe, pulando...`);
        skippedCount++;
      }
    }
    
    console.log('\n📊 Resumo da migration:');
    console.log(`   ✅ Campos adicionados: ${addedCount}`);
    console.log(`   ⏭️  Campos já existentes: ${skippedCount}`);
    console.log(`   📋 Total de campos: ${fieldsToAdd.length}`);
    console.log('\n🎉 Migration concluída com sucesso!');
    
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

