import express from 'express';
import { Broadcast } from '../Model/Models.js';
import { authMiddleware } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

// Create a new broadcast message (Admin/Operator only)
router.post('/create', async (req, res) => {
    try {
        const { title, description } = req.body;
        console.log("req.user",req.user);
        const created_by = req.user.user.moderator_id; // Assuming the authenticated user's ID is stored in req.user
        console.log("created by ",created_by);
        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const broadcastData = {
            title,
            description,
            created_by
        };

        const newBroadcast = await Broadcast.create(broadcastData);

        res.status(201).json({
            success: true,
            data: newBroadcast
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get all broadcasts with pagination
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = 'desc' // desc for newest first, asc for oldest first
        } = req.query;

        // Get all broadcasts
        const broadcasts = await Broadcast.scan().exec();

        // Sort by creation date
        broadcasts.sort((a, b) => {
            const comparison = new Date(b.created_at) - new Date(a.created_at);
            return sort === 'desc' ? comparison : -comparison;
        });

        // Implement pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedBroadcasts = broadcasts.slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            count: broadcasts.length,
            data: paginatedBroadcasts,
            pagination: {
                total: broadcasts.length,
                current_page: parseInt(page),
                per_page: parseInt(limit),
                total_pages: Math.ceil(broadcasts.length / limit)
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get a single broadcast by ID
router.get('/:broadcast_id', async (req, res) => {
    try {
        const broadcast = await Broadcast.get(req.params.broadcast_id);
        if (!broadcast) {
            return res.status(404).json({
                success: false,
                error: 'Broadcast not found'
            });
        }

        res.status(200).json({
            success: true,
            data: broadcast
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update a broadcast (Admin/Operator only)
router.put('/:broadcast_id', async (req, res) => {
    try {
        const { title, description } = req.body;
        
        // Validate required fields
        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        const broadcast = await Broadcast.update(req.params.broadcast_id, {
            title,
            description,
            updated_at: new Date()
        });

        res.status(200).json({
            success: true,
            data: broadcast
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Delete a broadcast (Admin/Operator only)
router.delete('/:broadcast_id' ,async (req, res) => {
    try {
        await Broadcast.delete(req.params.broadcast_id);
        
        res.status(200).json({
            success: true,
            message: 'Broadcast deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

export default router; 