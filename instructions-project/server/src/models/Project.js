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
}, {
  tableName: 'projects',
  timestamps: true,
});

export default Project;

