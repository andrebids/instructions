import sequelize from '../config/database.js';
import { Project } from '../models/index.js';

const DESIGNERS = [
    { name: "Ana Silva", email: "ana.silva@example.com" },
    { name: "João Santos", email: "joao.santos@example.com" },
    { name: "Sofia Martins", email: "sofia.martins@example.com" },
    { name: "Pedro Oliveira", email: "pedro.oliveira@example.com" },
    { name: "Maria Costa", email: "maria.costa@example.com" },
    { name: "Rui Ferreira", email: "rui.ferreira@example.com" }
];

function getAvatarUrl(seed) {
    // Using DiceBear Avataaars for "clean" look
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

async function assignDesigners() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        const projects = await Project.findAll();
        console.log(`📋 Found ${projects.length} projects.`);

        for (const project of projects) {
            // Randomly decide how many designers (1, 2, or 3)
            // Let's make it deterministic based on project ID so it doesn't change on every run if we re-run it
            // but "random" enough for distribution.
            const idNum = project.id.charCodeAt(0) || 0;
            const count = (idNum % 3) + 1; // 1, 2, or 3

            const assigned = [];
            const shuffledDesigners = [...DESIGNERS].sort(() => 0.5 - Math.random());

            for (let i = 0; i < count; i++) {
                const designer = shuffledDesigners[i];
                assigned.push({
                    id: `designer-${i}-${Date.now()}`, // Fake ID
                    name: designer.name,
                    email: designer.email,
                    image: getAvatarUrl(designer.name.replace(' ', ''))
                });
            }

            console.log(`🎨 Assigning ${count} designers to project "${project.name}" (${project.id})`);

            await project.update({
                assignedDesigners: assigned
            });
        }

        console.log('✅ All projects updated with fictitious designers.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

assignDesigners();
