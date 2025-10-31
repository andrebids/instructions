import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add category fields to products table
 * Adiciona campos para categorização de produtos (season, isTrending, releaseYear, isOnSale)
 * 
 * Campos adicionados:
 * - season: ENUM('xmas', 'summer', null) - Estação/categoria do produto
 * - isTrending: BOOLEAN - Se o produto está em trending
 * - releaseYear: INTEGER - Ano de lançamento para produtos NEW
 * - isOnSale: BOOLEAN - Se o produto está em promoção (calculado ou explícito)
 * 
 * Uso: node src/migrations/add-product-category-fields.js
 */
async function migrate() {
  try {
    console.log('🔄 Iniciando migration: Adicionar campos de categoria aos produtos...');
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
      AND column_name IN ('season', 'isTrending', 'releaseYear', 'isOnSale');
    `;
    
    const existingColumns = await sequelize.query(checkColumnsQuery, {
      type: QueryTypes.SELECT
    });
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    console.log('📋 Colunas existentes:', existingColumnNames.length > 0 ? existingColumnNames : 'Nenhuma');
    
    // Criar tipo ENUM se não existir
    const createEnumQuery = `
      DO $$ BEGIN
        CREATE TYPE season_enum AS ENUM ('xmas', 'summer');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await sequelize.query(createEnumQuery);
    console.log('✅ Tipo ENUM season_enum criado/verificado');
    
    // Adicionar campos que não existem
    const fieldsToAdd = [
      {
        name: 'season',
        type: 'season_enum',
        nullable: true,
        description: 'Estação/categoria: xmas ou summer'
      },
      {
        name: 'isTrending',
        type: 'BOOLEAN',
        defaultValue: 'false',
        nullable: false,
        description: 'Se o produto está em trending'
      },
      {
        name: 'releaseYear',
        type: 'INTEGER',
        nullable: true,
        description: 'Ano de lançamento para produtos NEW'
      },
      {
        name: 'isOnSale',
        type: 'BOOLEAN',
        defaultValue: 'false',
        nullable: false,
        description: 'Se o produto está em promoção'
      }
    ];
    
    var addedCount = 0;
    var skippedCount = 0;
    
    for (var i = 0; i < fieldsToAdd.length; i++) {
      var field = fieldsToAdd[i];
      if (!existingColumnNames.includes(field.name)) {
        var defaultValue = field.defaultValue ? `DEFAULT ${field.defaultValue}` : '';
        var nullable = field.nullable !== false ? 'NULL' : 'NOT NULL';
        var alterQuery = `
          ALTER TABLE products 
          ADD COLUMN "${field.name}" ${field.type} ${defaultValue} ${nullable};
        `;
        
        await sequelize.query(alterQuery);
        console.log(`✅ Campo "${field.name}" adicionado com sucesso (${field.description})`);
        addedCount++;
      } else {
        console.log(`⏭️  Campo "${field.name}" já existe, pulando...`);
        skippedCount++;
      }
    }
    
    // Atualizar isOnSale baseado em oldPrice existente
    if (!existingColumnNames.includes('isOnSale')) {
      const updateSaleQuery = `
        UPDATE products 
        SET "isOnSale" = true 
        WHERE "oldPrice" IS NOT NULL 
        AND "oldPrice" > price;
      `;
      
      const updateResult = await sequelize.query(updateSaleQuery);
      console.log(`✅ Campo isOnSale atualizado baseado em oldPrice`);
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

