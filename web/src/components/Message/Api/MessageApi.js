import axios from 'axios';
import {api}  from '../../axiosConfig';

export const fetchChatList = async (userId) => {
    try {
        const response = await api.get(`/message/chatList/${userId}`);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

export const fetchMessages = async (senderId, receiverId, startMessage) => {
    try {
        const response = await api.get(`/message/getMessages/${senderId}/${receiverId}`,{
            params: {
                startMessage : startMessage,
                count: 10
            }
        });
        console.log("Response", response.data['data']);
        return response.data['data'];
    } catch (error) {
        console.error(error);
    }
}