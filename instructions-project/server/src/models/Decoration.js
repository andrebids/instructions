import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Decoration = sequelize.define('Decoration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'ball, arc, star, pendant, etc.',
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  thumbnailUrl: {
    type: DataTypes.STRING,
  },
  thumbnailNightUrl: {
    type: DataTypes.STRING,
    comment: 'Preview noturno da decoração',
  },
  width: {
    type: DataTypes.INTEGER,
    comment: 'Largura em pixels',
  },
  height: {
    type: DataTypes.INTEGER,
    comment: 'Altura em pixels',
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    comment: 'Preço opcional para orçamentos',
  },
}, {
  tableName: 'decorations',
  timestamps: true,
});

export default Decoration;

