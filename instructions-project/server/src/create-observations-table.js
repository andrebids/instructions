import sequelize from './config/database.js';
import Observation from './models/Observation.js';

async function createObservationsTable() {
    try {
        console.log('🔧 Criando tabela observations...');

        // Forçar criação da tabela
        await Observation.sync({ force: false, alter: true });

        console.log('✅ Tabela observations criada com sucesso!');
        console.log('📋 Estrutura da tabela:');
        console.log('  - id (UUID)');
        console.log('  - projectId (UUID)');
        console.log('  - content (TEXT)');
        console.log('  - authorName (STRING)');
        console.log('  - authorAvatar (STRING)');
        console.log('  - authorRole (STRING)');
        console.log('  - attachments (JSONB)');
        console.log('  - linkedInstructionId (STRING)');
        console.log('  - linkedResultImageId (INTEGER)');
        console.log('  - createdAt (DATE)');
        console.log('  - updatedAt (DATE)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar tabela:', error);
        process.exit(1);
    }
}

createObservationsTable();
