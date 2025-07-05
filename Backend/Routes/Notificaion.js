import express from 'express';
import notificationService from '../Services/NotificationService.js';

const router = express.Router();

// Middleware to validate request
const validateNotificationRequest = (req, res, next) => {
  const { token, title, body } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Device token is required' });
  }
  
  if (!title || !body) {
    return res.status(400).json({ error: 'Notification title and body are required' });
  }
  
  next();
};

// Send notification to a single device
router.post('/send', validateNotificationRequest, async (req, res) => {
  try {
    const { token, title, body, data = {} } = req.body;
    
    const notification = {
      title,
      body
    };
    
    const response = await notificationService.sendToDevice(token, notification, data);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error in /send endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send notification to multiple devices
router.post('/send-multiple', async (req, res) => {
  try {
    const { tokens, title, body, data = {} } = req.body;
    
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Array of device tokens is required' });
    }
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Notification title and body are required' });
    }
    
    const notification = {
      title,
      body
    };
    
    const response = await notificationService.sendToMultipleDevices(tokens, notification, data);
    res.status(200).json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      response 
    });
  } catch (error) {
    console.error('Error in /send-multiple endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send notification to a topic
router.post('/send-topic', async (req, res) => {
  try {
    const { topic, title, body, data = {} } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Notification title and body are required' });
    }
    
    const notification = {
      title,
      body
    };
    
    const response = await notificationService.sendToTopic(topic, notification, data);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error in /send-topic endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subscribe devices to a topic
router.post('/subscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;
    
    if (!tokens) {
      return res.status(400).json({ error: 'Device token(s) are required' });
    }
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    
    const response = await notificationService.subscribeToTopic(tokens, topic);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error in /subscribe endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unsubscribe devices from a topic
router.post('/unsubscribe', async (req, res) => {
  try {
    const { tokens, topic } = req.body;
    
    if (!tokens) {
      return res.status(400).json({ error: 'Device token(s) are required' });
    }
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic name is required' });
    }
    
    const response = await notificationService.unsubscribeFromTopic(tokens, topic);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('Error in /unsubscribe endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;