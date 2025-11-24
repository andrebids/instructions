import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Observation = sequelize.define('Observation', {
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
    content: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    authorName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    authorAvatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    authorRole: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    attachments: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Array of attachment objects {name, type, url}',
    },
    linkedInstructionId: {
        type: DataTypes.STRING, // Assuming instruction IDs are strings/UUIDs from the JSON structure
        allowNull: true,
    },
    linkedResultImageId: {
        type: DataTypes.INTEGER, // Assuming result image IDs are integers based on mock data
        allowNull: true,
    },
}, {
    tableName: 'observations',
    timestamps: true,
});

export default Observation;
