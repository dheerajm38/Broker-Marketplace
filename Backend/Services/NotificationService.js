// File: notification-service.js
// Service to handle push notifications

import admin from "../Config/FirebaseConfig.js";

class NotificationService {
    /**
     * Send notification to a single device
     * @param {string} token - The FCM token of the target device
     * @param {object} notification - The notification payload
     * @param {object} data - Optional data payload
     * @returns {Promise} - The FCM response
     */
    async sendToDevice(token, notification, data = {}) {
        try {
            const message = {
                token,
                notification,
                data,
                android: {
                    priority: "high",
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                            badge: 1,
                        },
                    },
                },
            };
            console.log(token);
            console.log(notification);
            console.log(data);
            console.log("Notification msg to be send: " + message);
            const response = await admin.messaging().send(message);
            console.log("Successfully sent message:", response);
            return response;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    /**
     * Send notification to multiple devices
     * @param {Array} tokens - Array of FCM tokens
     * @param {object} notification - The notification payload
     * @param {object} data - Optional data payload
     * @returns {Promise} - The FCM response
     */
    async sendToMultipleDevices(tokens, notification, data = {}) {
        try {
            const message = {
                tokens,
                notification,
                data,
                android: {
                    priority: "high",
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().sendMulticast(message);
            console.log(
                `${response.successCount} messages were sent successfully`
            );

            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push({
                            token: tokens[idx],
                            error: resp.error,
                        });
                    }
                });
                console.log(
                    "List of tokens that caused failures:",
                    failedTokens
                );
            }

            return response;
        } catch (error) {
            console.error("Error sending messages:", error);
            throw error;
        }
    }

    /**
     * Send notification to devices subscribed to a topic
     * @param {string} topic - The topic name
     * @param {object} notification - The notification payload
     * @param {object} data - Optional data payload
     * @returns {Promise} - The FCM response
     */
    async sendToTopic(topic, notification, data = {}) {
        try {
            const message = {
                topic,
                notification,
                data,
                android: {
                    priority: "high",
                },
                apns: {
                    payload: {
                        aps: {
                            contentAvailable: true,
                            badge: 1,
                        },
                    },
                },
            };

            const response = await admin.messaging().send(message);
            console.log("Successfully sent message to topic:", response);
            return response;
        } catch (error) {
            console.error("Error sending message to topic:", error);
            throw error;
        }
    }

    /**
     * Subscribe a device to a topic
     * @param {string|Array} tokens - FCM token or array of tokens
     * @param {string} topic - The topic name
     * @returns {Promise} - The FCM response
     */
    async subscribeToTopic(tokens, topic) {
        try {
            const response = await admin
                .messaging()
                .subscribeToTopic(tokens, topic);
            console.log("Successfully subscribed to topic:", response);
            return response;
        } catch (error) {
            console.error("Error subscribing to topic:", error);
            throw error;
        }
    }

    /**
     * Unsubscribe a device from a topic
     * @param {string|Array} tokens - FCM token or array of tokens
     * @param {string} topic - The topic name
     * @returns {Promise} - The FCM response
     */
    async unsubscribeFromTopic(tokens, topic) {
        try {
            const response = await admin
                .messaging()
                .unsubscribeFromTopic(tokens, topic);
            console.log("Successfully unsubscribed from topic:", response);
            return response;
        } catch (error) {
            console.error("Error unsubscribing from topic:", error);
            throw error;
        }
    }
}

const notificationService = new NotificationService();

export default notificationService;
