import sequelize from '../config/database.js';
import { Observation } from '../models/index.js';

async function clearObservations() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        console.log('🗑️  Deleting all observations...');
        const deletedCount = await Observation.destroy({
            where: {},
            truncate: true
        });

        console.log(`✅ Deleted ${deletedCount} observations.`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

clearObservations();
