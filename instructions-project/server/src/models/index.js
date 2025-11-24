import Project from './Project.js';
import Decoration from './Decoration.js';
import ProjectElement from './ProjectElement.js';
import Product from './Product.js';
import ProjectNote from './ProjectNote.js';
import Task from './Task.js';
import Observation from './Observation.js';

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

export {
  Project,
  Decoration,
  ProjectElement,
  Product,
  ProjectNote,
  Task,
  Observation,
};

