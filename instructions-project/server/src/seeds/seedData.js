import sequelize from '../config/database.js';
import { Project, Decoration, ProjectElement } from '../models/index.js';

// Dados demo de decorações
const decorationsSeed = [
  // Bolas
  {
    name: 'Golden Ball Large',
    category: 'ball',
    tags: ['ball', 'golden', 'large', 'christmas'],
    thumbnailUrl: '/demo-images/decorations/ball-gold-large.png',
    width: 150,
    height: 150,
    description: 'Large golden Christmas ball',
    price: 25.50,
  },
  {
    name: 'Red Ball Medium',
    category: 'ball',
    tags: ['ball', 'red', 'medium', 'christmas'],
    thumbnailUrl: '/demo-images/decorations/ball-red-medium.png',
    width: 100,
    height: 100,
    description: 'Medium red Christmas ball',
    price: 18.00,
  },
  {
    name: 'Silver Ball Small',
    category: 'ball',
    tags: ['ball', 'silver', 'small', 'christmas'],
    thumbnailUrl: '/demo-images/decorations/ball-silver-small.png',
    width: 75,
    height: 75,
    description: 'Small silver Christmas ball',
    price: 12.00,
  },
  // Arcos
  {
    name: 'Blue LED Arc',
    category: 'arc',
    tags: ['arc', 'blue', 'led', 'modern'],
    thumbnailUrl: '/demo-images/decorations/arc-blue.png',
    width: 300,
    height: 200,
    description: 'Modern blue LED arc',
    price: 150.00,
  },
  {
    name: 'White LED Arc',
    category: 'arc',
    tags: ['arc', 'white', 'led', 'elegant'],
    thumbnailUrl: '/demo-images/decorations/arc-white.png',
    width: 300,
    height: 200,
    description: 'Elegant white LED arc',
    price: 145.00,
  },
  // Estrelas
  {
    name: 'Silver Star',
    category: 'star',
    tags: ['star', 'silver', 'top'],
    thumbnailUrl: '/demo-images/decorations/star-silver.png',
    width: 200,
    height: 200,
    description: 'Classic silver star',
    price: 45.00,
  },
  {
    name: 'Gold Star Large',
    category: 'star',
    tags: ['star', 'gold', 'large'],
    thumbnailUrl: '/demo-images/decorations/star-gold-large.png',
    width: 250,
    height: 250,
    description: 'Large golden star',
    price: 65.00,
  },
  // Pendentes
  {
    name: 'Cascade Pendant White',
    category: 'pendant',
    tags: ['pendant', 'cascade', 'white', 'led'],
    thumbnailUrl: '/demo-images/decorations/pendant-cascade-white.png',
    width: 100,
    height: 400,
    description: 'White LED cascade pendant',
    price: 85.00,
  },
  {
    name: 'Cascade Pendant Blue',
    category: 'pendant',
    tags: ['pendant', 'cascade', 'blue', 'led'],
    thumbnailUrl: '/demo-images/decorations/pendant-cascade-blue.png',
    width: 100,
    height: 400,
    description: 'Blue LED cascade pendant',
    price: 85.00,
  },
  {
    name: 'Icicle Pendant',
    category: 'pendant',
    tags: ['pendant', 'icicle', 'white'],
    thumbnailUrl: '/demo-images/decorations/pendant-icicle.png',
    width: 80,
    height: 300,
    description: 'White icicle pendant',
    price: 55.00,
  },
  // Mais decorações
  {
    name: 'Rainbow LED Strip',
    category: 'strip',
    tags: ['strip', 'rainbow', 'led', 'colorful'],
    thumbnailUrl: '/demo-images/decorations/strip-rainbow.png',
    width: 500,
    height: 50,
    description: 'Colorful rainbow LED strip',
    price: 120.00,
  },
  {
    name: 'Warm White LED Strip',
    category: 'strip',
    tags: ['strip', 'white', 'led', 'warm'],
    thumbnailUrl: '/demo-images/decorations/strip-warm-white.png',
    width: 500,
    height: 50,
    description: 'Warm white LED strip',
    price: 95.00,
  },
];

// Dados demo de projetos
const projectsSeed = [
  {
    name: 'Christmas Shopping Mall',
    clientName: 'Fashion Outlet',
    location: 'Lisbon Center',
    projectType: 'decor',
    status: 'in_progress',
    baseImageUrl: '/demo-images/buildings/mall-facade.jpg',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2025-01-15'),
    budget: 15000,
    description: 'Christmas decoration for main shopping mall entrance',
    isFavorite: true,
  },
  {
    name: 'City Hall Decoration',
    clientName: 'Lisbon Municipality',
    location: 'City Hall Square',
    projectType: 'decor',
    status: 'finished',
    baseImageUrl: '/demo-images/buildings/city-hall.jpg',
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-12-31'),
    budget: 25000,
    description: 'Official city hall Christmas decoration project',
    isFavorite: false,
  },
  {
    name: 'Hotel Entrance',
    clientName: 'Luxury Hotel Chain',
    location: 'Porto Downtown',
    projectType: 'simu',
    status: 'approved',
    baseImageUrl: '/demo-images/buildings/hotel-entrance.jpg',
    startDate: new Date('2024-11-10'),
    endDate: new Date('2025-01-31'),
    budget: 8500,
    description: 'Elegant entrance decoration for 5-star hotel',
    isFavorite: true,
  },
  {
    name: 'Street Light Poles',
    clientName: 'City Council',
    location: 'Main Avenue',
    projectType: 'decor',
    status: 'in_progress',
    baseImageUrl: '/demo-images/buildings/street-poles.jpg',
    startDate: new Date('2024-11-20'),
    endDate: new Date('2025-01-10'),
    budget: 12000,
    description: 'Decoration for 50 street light poles',
    isFavorite: false,
  },
  {
    name: 'Restaurant Facade',
    clientName: 'Gourmet Restaurant',
    location: 'Cascais',
    projectType: 'decor',
    status: 'created',
    baseImageUrl: '/demo-images/buildings/restaurant.jpg',
    startDate: new Date('2024-12-01'),
    endDate: new Date('2025-01-20'),
    budget: 3500,
    description: 'Cozy Christmas decoration for restaurant exterior',
    isFavorite: false,
  },
  {
    name: 'Office Building',
    clientName: 'Tech Company HQ',
    location: 'Lisbon Parque das Nações',
    projectType: 'simu',
    status: 'finished',
    baseImageUrl: '/demo-images/buildings/office-building.jpg',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-15'),
    budget: 18000,
    description: 'Modern corporate Christmas decoration',
    isFavorite: false,
  },
];

// Função para popular o banco de dados
export async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Sincronizar modelos (criar tabelas)
    await sequelize.sync({ force: true }); // force: true vai recriar as tabelas
    console.log('✅ Tabelas criadas/recriadas');

    // Popular decorações
    const decorations = await Decoration.bulkCreate(decorationsSeed);
    console.log(`✅ ${decorations.length} decorações criadas`);

    // Popular projetos
    const projects = await Project.bulkCreate(projectsSeed);
    console.log(`✅ ${projects.length} projetos criados`);

    // Criar alguns elementos de projeto de exemplo
    if (projects.length > 0 && decorations.length > 0) {
      await ProjectElement.bulkCreate([
        {
          projectId: projects[0].id,
          decorationId: decorations[0].id,
          xPosition: 100,
          yPosition: 150,
          scale: 1.2,
          rotation: 0,
          zIndex: 1,
        },
        {
          projectId: projects[0].id,
          decorationId: decorations[3].id,
          xPosition: 300,
          yPosition: 200,
          scale: 1.0,
          rotation: 0,
          zIndex: 2,
        },
      ]);
      console.log('✅ Elementos de projeto criados');
    }

    console.log('🎉 Seed concluído com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - ${decorations.length} decorações`);
    console.log(`   - ${projects.length} projetos`);
    
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  }
}

// Executar seed automaticamente quando o módulo é importado
seedDatabase()
  .then(() => {
    console.log('✅ Seed executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  });

