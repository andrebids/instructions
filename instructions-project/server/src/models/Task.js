import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'user_id',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'due_date',
    },
    isCompleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_completed',
    },
    type: {
        type: DataTypes.ENUM('MANUAL', 'SYSTEM'),
        defaultValue: 'MANUAL',
        allowNull: false,
    },
}, {
    tableName: 'tasks',
    timestamps: true,
    underscored: true, // This ensures created_at and updated_at are used
});

export default Task;
