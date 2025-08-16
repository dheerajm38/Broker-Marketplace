import { api } from "../axiosConfig";

// Get all broadcasts with pagination
export const fetchBroadcasts = async (page = 1, limit = 10, sort = 'desc') => {
    try {
        const response = await api.get(`/broadcast?page=${page}&limit=${limit}&sort=${sort}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching broadcasts:', error);
        throw error;
    }
};

// Get a single broadcast by ID
export const fetchBroadcastById = async (broadcastId) => {
    try {
        const response = await api.get(`/broadcast/${broadcastId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching broadcast:', error);
        throw error;
    }
};

// Create a new broadcast
export const createBroadcast = async (broadcastData) => {
    try {
        const response = await api.post('/broadcast/create', broadcastData);
        return response.data;
    } catch (error) {
        console.error('Error creating broadcast:', error);
        throw error;
    }
};

// Update a broadcast
export const updateBroadcast = async (broadcastId, broadcastData) => {
    try {
        const response = await api.put(`/broadcast/${broadcastId}`, broadcastData);
        return response.data;
    } catch (error) {
        console.error('Error updating broadcast:', error);
        throw error;
    }
};

// Delete a broadcast
export const deleteBroadcast = async (broadcastId) => {
    try {
        const response = await api.delete(`/broadcast/${broadcastId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting broadcast:', error);
        throw error;
    }
};
