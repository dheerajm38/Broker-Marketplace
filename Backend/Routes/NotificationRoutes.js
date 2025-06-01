import express from 'express';
import { Notification } from '../Model/Models.js';
import { authMiddleware } from '../Middleware/AuthMiddleware.js';

const router = express.Router();

// Get notifications with pagination and specific filters
// add middleware later on
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            type,
            isRead
        } = req.query;

        // Initialize scan operation
        let scanOperation = Notification.scan();

        // Apply type filter if provided and valid
        if (type) {
            const validTypes = ['BUYER_REQUEST', 'TICKET_PRICE_UPDATE', 'TICKET_GENERATION'];
            if (validTypes.includes(type)) {
                scanOperation = scanOperation.where('type').eq(type);
            }
        }

        // Apply read/unread filter if provided
        if (isRead !== undefined) {
            scanOperation = scanOperation.where('isRead').eq(isRead === 'true');
        }

        // Execute scan
        let notifications = await scanOperation.exec();

        // Sort by creation date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = notifications.length;

        // Paginate results
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        // Prepare pagination metadata
        const pagination = {
            total,
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total_pages: Math.ceil(total / limit),
            has_next: endIndex < total,
            has_previous: startIndex > 0
        };

        return res.status(200).json({
            success: true,
            message: "Notifications retrieved successfully",
            data: paginatedNotifications,
            pagination
        });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

// Get notifications for a specific recipient with filters
router.get('/recipient/:recipientId', async (req, res) => {
    try {
        const { recipientId } = req.params;
        const {
            page = 1,
            limit = 10,
            type,
            isRead
        } = req.query;

        let scanOperation = Notification.scan('recipientId').eq(recipientId);

        // Apply type filter if provided and valid
        if (type) {
            const validTypes = ['BUYER_REQUEST', 'TICKET_PRICE_UPDATE', 'TICKET_GENERATION'];
            if (validTypes.includes(type)) {
                scanOperation = scanOperation.where('type').eq(type);
            }
        }

        // Apply read/unread filter if provided
        if (isRead !== undefined) {
            scanOperation = scanOperation.where('isRead').eq(isRead === 'true');
        }

        const notifications = await scanOperation.exec();

        // Sort by creation date (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        const pagination = {
            total: notifications.length,
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total_pages: Math.ceil(notifications.length / limit),
            has_next: endIndex < notifications.length,
            has_previous: startIndex > 0
        };

        return res.status(200).json({
            success: true,
            message: "Recipient notifications retrieved successfully",
            data: paginatedNotifications,
            pagination
        });

    } catch (error) {
        console.error("Error fetching recipient notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

// Get unread notification count for a recipient
router.get('/unread-count/:recipientId', async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { type } = req.query;

        let scanOperation = Notification.scan('recipientId')
            .eq(recipientId)
            .where('isRead')
            .eq(false);

        // Apply type filter if provided and valid
        if (type) {
            const validTypes = ['BUYER_REQUEST', 'TICKET_PRICE_UPDATE', 'TICKET_GENERATION'];
            if (validTypes.includes(type)) {
                scanOperation = scanOperation.where('type').eq(type);
            }
        }

        const unreadNotifications = await scanOperation.exec();

        return res.status(200).json({
            success: true,
            message: "Unread notification count retrieved successfully",
            count: unreadNotifications.length
        });

    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

// Mark a single notification as read
router.patch('/mark-read/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.get({ id: notificationId });
        console.log("Notification", notification);
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        // Update notification
        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read successfully"
        });

    } catch (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

// Mark all notifications as read for a recipient
router.patch('/mark-all-read/:recipientId', async (req, res) => {
    try {
        const { recipientId } = req.params;
        const { type } = req.query; // Optional: filter by type

        let scanOperation = Notification.scan('recipientId')
            .eq(recipientId)
            .where('isRead')
            .eq(false);

        if (type) {
            scanOperation = scanOperation.where('type').eq(type);
        }

        const unreadNotifications = await scanOperation.exec();

        if (unreadNotifications.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No unread notifications found",
                count: 0
            });
        }

        // Update all unread notifications
        await Promise.all(
            unreadNotifications.map(async (notification) => {
                notification.isRead = true;
                await notification.save();  // Save each notification
            })
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read successfully",
            count: unreadNotifications.length
        });

    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});


// Delete a notification
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.get({ id: notificationId });
        if (!notification) {
            return res.status(404).json({   
                success: false,
                message: "Notification not found"
            });
        }

        await Notification.delete({ id: notificationId });

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});

export default router; 