/**
 * Migration: Add enableNotes column to projects table
 * Date: 2025-01-27
 * 
 * Adiciona coluna enableNotes à tabela projects para controlar se as notas do projeto estão habilitadas
 */

export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'enableNotes', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        comment: 'Indica se as notas do projeto estão habilitadas',
    });
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('projects', 'enableNotes');
}

