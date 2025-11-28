import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
  },
  productId: {
    type: DataTypes.STRING, // STRING para corresponder ao Product.id
    allowNull: true, // Opcional (pode ser decoração)
    field: 'product_id',
  },
  decorationId: {
    type: DataTypes.UUID,
    allowNull: true, // Opcional (pode ser produto)
    field: 'decoration_id',
    comment: 'ID da decoração (quando item vem do AI Designer)',
  },
  itemType: {
    type: DataTypes.STRING, // STRING em vez de ENUM para evitar problemas com PostgreSQL
    allowNull: false,
    defaultValue: 'product',
    field: 'item_type',
    comment: 'Tipo de item: product ou decoration',
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Snapshot do nome do produto/decoração',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'unit_price',
  },
  variant: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Variante do produto: { color, mode }',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
  },
  sourceImageId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'source_image_id',
    comment: 'ID da imagem source (AI Designer)',
  },
}, {
  tableName: 'order_items',
  timestamps: true,
  underscored: true,
});

export default OrderItem;
