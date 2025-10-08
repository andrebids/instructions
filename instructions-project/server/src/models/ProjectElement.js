import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProjectElement = sequelize.define('ProjectElement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  decorationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'decorations',
      key: 'id',
    },
  },
  xPosition: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Posição X no canvas',
  },
  yPosition: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Posição Y no canvas',
  },
  scale: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    comment: 'Escala do elemento (1.0 = 100%)',
  },
  rotation: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
    comment: 'Rotação em graus',
  },
  zIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Ordem de sobreposição',
  },
}, {
  tableName: 'project_elements',
  timestamps: true,
});

export default ProjectElement;

