import sequelize from './config/database.js';
import './models/Project.js';

async function syncDatabase() {
    try {
        console.log('🔄 Syncing database with alter: true...');
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully!');
        console.log('💡 The category column should now be added to Projects table');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error syncing database:', error);
        process.exit(1);
    }
}

syncDatabase();
