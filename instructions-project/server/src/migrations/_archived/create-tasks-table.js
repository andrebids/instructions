/**
 * Migration: Create tasks table
 * 
 * Creates the tasks table for the todo/task management feature.
 * 
 * To run this migration:
 * node src/migrations/create-tasks-table.js
 */

import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

async function up() {
    console.log('🔄 Creating tasks table...');

    try {
        // Check if table already exists
        const [tables] = await sequelize.query(
            `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'tasks'`,
            { type: QueryTypes.SELECT }
        );

        if (tables) {
            console.log('⚠️  Table "tasks" already exists. Skipping creation.');
            return;
        }

        // Create tasks table
        await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP WITH TIME ZONE,
        is_completed BOOLEAN DEFAULT FALSE,
        type VARCHAR(50) DEFAULT 'MANUAL' CHECK (type IN ('MANUAL', 'SYSTEM')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Create index on user_id for faster queries
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
    `);

        // Create index on created_at for sorting
        await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
    `);

        console.log('✅ Tasks table created successfully');
    } catch (error) {
        console.error('❌ Error creating tasks table:', error);
        throw error;
    }
}

async function down() {
    console.log('🔄 Dropping tasks table...');

    try {
        await sequelize.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
        console.log('✅ Tasks table dropped successfully');
    } catch (error) {
        console.error('❌ Error dropping tasks table:', error);
        throw error;
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    try {
        await up();
        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

export { up, down };
