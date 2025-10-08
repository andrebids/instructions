import Project from './Project.js';
import Decoration from './Decoration.js';
import ProjectElement from './ProjectElement.js';

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

export {
  Project,
  Decoration,
  ProjectElement,
};

