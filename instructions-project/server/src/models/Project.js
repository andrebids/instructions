import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
  },
  projectType: {
    type: DataTypes.ENUM('decor', 'simu', 'logo'),
    allowNull: false,
    defaultValue: 'decor',
  },
  status: {
    type: DataTypes.ENUM('created', 'in_progress', 'finished', 'approved', 'cancelled', 'in_queue'),
    defaultValue: 'created',
  },
  baseImageUrl: {
    type: DataTypes.STRING,
  },
  startDate: {
    type: DataTypes.DATE,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
  },
  description: {
    type: DataTypes.TEXT,
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  feedbackDesigner: {
    type: DataTypes.TEXT,
  },
  // Campos para dados do canvas (AI Designer)
  canvasDecorations: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  canvasImages: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  snapZonesByImage: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  decorationsByImage: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  // Metadados do cartouche por imagem (nome da rua, projeto, opção)
  cartoucheByImage: {
    type: DataTypes.JSON,
    allowNull: true, // Permitir null para compatibilidade com projetos antigos
    defaultValue: {},
    comment: 'Mapeamento de metadados do cartouche por imageId: { imageId: { projectName, streetOrZone, option, hasCartouche } }',
  },
  // Campo para guardar o último step onde o usuário estava editando
  lastEditedStep: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Último step do editor onde o usuário estava (ex: "ai-designer", "project-details")',
  },
}, {
  tableName: 'projects',
  timestamps: true,
});

export default Project;

