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
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

async function addRandomDesigner(projectId) {
    try {
        console.log('🔄 Conectando à base de dados...');
        await sequelize.authenticate();
        console.log('✅ Conectado.');

        const project = await Project.findByPk(projectId);

        if (!project) {
            console.error(`❌ Projeto com ID "${projectId}" não encontrado.`);
            process.exit(1);
        }

        console.log(`📋 Projeto encontrado: "${project.name}" (${project.id})`);

        // Obter designers já atribuídos
        const currentDesigners = project.assignedDesigners || [];
        
        // Filtrar designers que já estão atribuídos (por email)
        const assignedEmails = currentDesigners.map(d => d.email);
        const availableDesigners = DESIGNERS.filter(d => !assignedEmails.includes(d.email));
        
        if (availableDesigners.length === 0) {
            console.error('❌ Todos os designers já estão atribuídos a este projeto.');
            process.exit(1);
        }

        // Escolher designer aleatório
        const randomDesigner = availableDesigners[Math.floor(Math.random() * availableDesigners.length)];
        
        console.log(`🎨 Adicionando designer: "${randomDesigner.name}" (${randomDesigner.email})`);

        // Criar objeto do designer
        const newDesigner = {
            id: `designer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: randomDesigner.name,
            email: randomDesigner.email,
            image: getAvatarUrl(randomDesigner.name.replace(' ', ''))
        };

        // Adicionar ao array de designers
        const updatedDesigners = [...currentDesigners, newDesigner];

        // Atualizar projeto
        await project.update({
            assignedDesigners: updatedDesigners
        });

        console.log(`✅ Designer "${randomDesigner.name}" adicionado com sucesso!`);
        console.log(`📊 Total de designers no projeto: ${updatedDesigners.length}`);

    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Obter ID do projeto dos argumentos da linha de comando
const projectId = process.argv[2];

if (!projectId) {
    console.error('❌ Por favor, forneça o ID do projeto como argumento.');
    console.error('   Uso: node add-random-designer-to-project.js <project-id>');
    process.exit(1);
}

addRandomDesigner(projectId);






