import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'project_id',
  },
  status: {
    type: DataTypes.STRING, // STRING em vez de ENUM para evitar problemas
    defaultValue: 'draft',
    allowNull: false,
    comment: 'Status: draft, to_order, ordered, delivered, cancelled',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  orderedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ordered_at',
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

export default Order;
