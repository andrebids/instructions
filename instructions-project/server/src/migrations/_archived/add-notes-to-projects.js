/**
 * Migration: Add notes column to projects table
 * Date: 2025-11-24
 */

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'notes', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
        comment: 'Array de notas: [{ id, topic, title, content, createdAt, updatedAt }]',
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects', 'notes');
}
