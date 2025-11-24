import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

/**
 * Migration: Add 'category' field to Projects table
 * Adds project category/priority classification
 * 
 * This migration:
 * 1. Creates ENUM type for category (normal, ao_tender, urgent, modifications)
 * 2. Adds category column to Projects table with default value 'normal'
 * 3. Sets existing projects to 'normal' category
 */
async function migrate() {
    try {
        console.log('🔄 Starting migration: Add category field to Projects...');
        console.log('📅 Date:', new Date().toISOString());

        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Check if Projects table exists
        const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Projects'
      );
    `;

        const tableExists = await sequelize.query(tableExistsQuery, {
            type: QueryTypes.SELECT
        });

        if (!tableExists[0].exists) {
            console.log('⚠️  Table "Projects" does not exist. Run model sync first.');
            return;
        }

        // Check if category column already exists
        const columnExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'Projects' 
        AND column_name = 'category'
      );
    `;

        const columnExists = await sequelize.query(columnExistsQuery, {
            type: QueryTypes.SELECT
        });

        if (columnExists[0].exists) {
            console.log('⏭️  Column "category" already exists, skipping migration...');
            return;
        }

        // Create ENUM type for category
        console.log('➕ Creating ENUM type for category...');
        const createEnumQuery = `
      DO $$ BEGIN
        CREATE TYPE "enum_Projects_category" AS ENUM ('normal', 'ao_tender', 'urgent', 'modifications');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

        await sequelize.query(createEnumQuery);
        console.log('✅ ENUM type created');

        // Add category column
        console.log('➕ Adding category column to Projects table...');
        const addColumnQuery = `
      ALTER TABLE "Projects" 
      ADD COLUMN "category" "enum_Projects_category" DEFAULT 'normal';
    `;

        await sequelize.query(addColumnQuery);
        console.log('✅ Category column added');

        // Update existing projects to have 'normal' category
        console.log('🔄 Setting existing projects to normal category...');
        const updateQuery = `
      UPDATE "Projects" 
      SET "category" = 'normal' 
      WHERE "category" IS NULL;
    `;

        const updateResult = await sequelize.query(updateQuery);
        const rowsAffected = updateResult[1] || 0;
        console.log(`✅ ${rowsAffected} project(s) updated to normal category`);

        console.log('\n🎉 Migration completed successfully!');
        console.log('💡 New projects will have "normal" category by default.');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        console.error('Stack:', error.stack);
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Execute migration
migrate()
    .then(() => {
        console.log('✅ Migration executed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error executing migration:', error);
        process.exit(1);
    });
