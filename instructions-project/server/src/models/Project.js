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
    type: DataTypes.ENUM('draft', 'created', 'in_progress', 'finished', 'approved', 'cancelled', 'in_queue'),
    defaultValue: 'draft',
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
  // Lista de imagens uploadadas para o projeto (metadados)
  uploadedImages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array com metadados das imagens uploadadas: [{ id, name, thumbnail, dayVersion, nightVersion, originalUrl, conversionStatus, cartouche }]',
  },
  // Estado da simulação (step de upload, imagem selecionada, modo dia/noite, conversões)
  simulationState: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      uploadStep: 'uploading',
      selectedImageId: null,
      isDayMode: true,
      conversionComplete: {}
    },
    comment: 'Estado da simulação: { uploadStep, selectedImageId, isDayMode, conversionComplete }',
  },
  // Dados das instruções do logo (apenas para projetos tipo logo)
  logoDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Dados das instruções do logo: { logoNumber, logoName, requestedBy, dimensions, usageOutdoor, fixationType, composition, description, attachmentFiles, etc }',
  },
  // ID do utilizador que criou o projeto (Auth.js userId)
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'created_by',
    comment: 'ID do utilizador que criou o projeto (Auth.js userId)',
  },
}, {
  tableName: 'projects',
  timestamps: true,
});

export default Project;

