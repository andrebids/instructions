import Project from './Project.js';
import Decoration from './Decoration.js';
import ProjectElement from './ProjectElement.js';
import Product from './Product.js';
import ProjectNote from './ProjectNote.js';
import Task from './Task.js';
import Observation from './Observation.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';

// Definir associações entre modelos
Project.hasMany(ProjectElement, {
  foreignKey: 'projectId',
  as: 'elements',
  onDelete: 'CASCADE',
});

ProjectElement.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

Decoration.hasMany(ProjectElement, {
  foreignKey: 'decorationId',
  as: 'usages',
});

ProjectElement.belongsTo(Decoration, {
  foreignKey: 'decorationId',
  as: 'decoration',
});

// Associação ProjectNote com Project
Project.hasOne(ProjectNote, {
  foreignKey: 'projectId',
  as: 'note',
  onDelete: 'CASCADE',
});

ProjectNote.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Associação Observation com Project
Project.hasMany(Observation, {
  foreignKey: 'projectId',
  as: 'observations',
  onDelete: 'CASCADE',
});

Observation.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Associação Order com Project
Project.hasMany(Order, {
  foreignKey: 'projectId',
  as: 'orders',
  onDelete: 'CASCADE',
});

Order.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

// Associação OrderItem com Order
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

// Associação OrderItem com Product
Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

// Associação OrderItem com Decoration
Decoration.hasMany(OrderItem, {
  foreignKey: 'decorationId',
  as: 'orderItems',
});

OrderItem.belongsTo(Decoration, {
  foreignKey: 'decorationId',
  as: 'decoration',
});

export {
  Project,
  Decoration,
  ProjectElement,
  Product,
  ProjectNote,
  Task,
  Observation,
  Order,
  OrderItem,
};

