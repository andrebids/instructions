import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProjectNote = sequelize.define('ProjectNote', {
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
  documentName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Nome único do documento usado pelo Hocuspocus (ex: project-{projectId})',
  },
  data: {
    type: DataTypes.BLOB,
    allowNull: true,
    comment: 'Dados binários Y.js (Uint8Array) - armazenado como BYTEA no PostgreSQL',
  },
}, {
  tableName: 'project_notes',
  timestamps: true,
  updatedAt: 'updatedAt',
  createdAt: false, // Não precisamos de createdAt, apenas updatedAt
});

export default ProjectNote;

