/**
 * Migration: Create observations table
 * Created: 2025-01-24
 */

export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('observations', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
        },
        projectId: {
            type: Sequelize.UUID,
            allowNull: false,
            field: 'project_id',
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: true,
        },
        authorName: {
            type: Sequelize.STRING,
            allowNull: false,
            field: 'author_name',
        },
        authorAvatar: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'author_avatar',
        },
        authorRole: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'author_role',
        },
        attachments: {
            type: Sequelize.JSONB,
            defaultValue: [],
        },
        linkedInstructionId: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'linked_instruction_id',
        },
        linkedResultImageId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            field: 'linked_result_image_id',
        },
        createdAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'created_at',
        },
        updatedAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'updated_at',
        },
    });

    // Add index on projectId for faster queries
    await queryInterface.addIndex('observations', ['project_id']);
}

export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('observations');
}
