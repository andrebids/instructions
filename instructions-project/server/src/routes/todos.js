import express from 'express';
import Task from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const isDevelopment = process.env.NODE_ENV !== 'production';

// GET /api/todos - Fetch tasks for the current user
router.get('/', requireAuth(), async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { userId: req.userId }, // requireAuth sets req.userId
            order: [['createdAt', 'DESC']],
        });

        res.json(tasks);
    } catch (error) {
        console.error('❌ [Todos] Error fetching tasks:', error.message);

        res.status(500).json({
            message: 'Failed to fetch tasks',
            error: error.message,
            errorName: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// POST /api/todos - Create a new task
router.post('/', requireAuth(), async (req, res) => {
    try {
        const { title, description, type, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const task = await Task.create({
            userId: req.userId, // requireAuth sets req.userId
            title,
            description,
            dueDate: dueDate || null,
            type: type || 'MANUAL',
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('❌ [Todos] Error creating task:', error);
        res.status(500).json({
            message: 'Failed to create task',
            error: error.message
        });
    }
});

// PATCH /api/todos/:id - Toggle completion status or update task
router.patch('/:id', requireAuth(), async (req, res) => {
    try {
        const { id } = req.params;
        const { isCompleted, dueDate } = req.body;

        const task = await Task.findOne({
            where: { id, userId: req.userId }, // requireAuth sets req.userId
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (isCompleted !== undefined) {
            task.isCompleted = isCompleted;
        }

        if (dueDate !== undefined) {
            task.dueDate = dueDate;
        }

        await task.save();
        res.json(task);
    } catch (error) {
        console.error('❌ [Todos] Error updating task:', error);
        res.status(500).json({
            message: 'Failed to update task',
            error: error.message
        });
    }
});

// DELETE /api/todos/:id - Delete a task
router.delete('/:id', requireAuth(), async (req, res) => {
    try {
        const { id } = req.params;

        const task = await Task.findOne({
            where: { id, userId: req.userId },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.destroy();
        res.json({ message: 'Task deleted successfully', id });
    } catch (error) {
        console.error('❌ [Todos] Error deleting task:', error);
        res.status(500).json({
            message: 'Failed to delete task',
            error: error.message
        });
    }
});

export default router;
