import sequelize from './config/database.js';
import { QueryTypes } from 'sequelize';

async function addCategoryColumn() {
    try {
        console.log('🔄 Adding category column to projects table...');

        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Check if column already exists
        const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name = 'category';
    `;

        const columnExists = await sequelize.query(checkColumnQuery, {
            type: QueryTypes.SELECT
        });

        if (columnExists.length > 0) {
            console.log('⏭️  Column "category" already exists!');
            process.exit(0);
        }

        // Create ENUM type
        console.log('➕ Creating ENUM type...');
        await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_projects_category') THEN
          CREATE TYPE "enum_projects_category" AS ENUM ('normal', 'ao_tender', 'urgent', 'modifications');
        END IF;
      END $$;
    `);

        // Add column
        console.log('➕ Adding category column...');
        await sequelize.query(`
      ALTER TABLE "projects" 
      ADD COLUMN "category" "enum_projects_category" DEFAULT 'normal';
    `);

        // Update existing rows
        console.log('🔄 Updating existing projects...');
        await sequelize.query(`
      UPDATE "projects" 
      SET "category" = 'normal' 
      WHERE "category" IS NULL;
    `);

        console.log('✅ Category column added successfully!');
        console.log('💡 All existing projects set to "normal" category');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addCategoryColumn();
