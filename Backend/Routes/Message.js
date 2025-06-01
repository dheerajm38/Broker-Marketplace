import express from 'express';
import { ChatHistory, Message } from '../Model/Models.js';
import { User } from '../Model/Models.js';
import { Moderator } from '../Model/Models.js';
import { createChatHistory } from '../Services/MessageService.js';

const router = express.Router();

// Route to handle POST request to add a message
router.post('/create', async (req, res) => {
    try {
        const { content, sender, receiver } = req.body;
        const newMessage = new Message({
            message_body : content,
            sender_id : sender,
            receiver_id: receiver,
            timestamp: new Date()
        });
        await newMessage.save();
        const chatHistory = await ChatHistory.scan()
        res.status(201).json({ message: 'Message added successfully', data: newMessage });
    } catch (error) {
        res.status(500).json({ message: 'Error adding message', error });
    }
});

// Route to handle GET request to fetch all messages for a specific sender and receiver
router.get('/getMessages/:senderID/:receiverID', async (req, res) => {
    try {
        const sender_id = req.params.senderID;
        const receiver_id = req.params.receiverID;
        const startCount = parseInt(req.query.startMessage);
        const count = parseInt(req.query.count);
        const messages = await Message.scan()
            .filter('sender_id').eq(sender_id).and().filter('receiver_id').eq(receiver_id)
            .or()
            .filter('sender_id').eq(receiver_id).and().filter('receiver_id').eq(sender_id)
            .exec();
        
       
        const sortedMessages = messages.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        const slicedMessages = sortedMessages.slice(startCount, startCount + count);
        
        if(slicedMessages.length === 0) {
            
        }
        res.status(200).json({ message: 'Messages fetched successfully', data: slicedMessages });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages', error });
    }
});

router.get('/chatList/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log("inside the chat list user id ",userId); 
        const chatHistoryList = await ChatHistory.scan('emp_id').eq(userId).exec();
            console.log("ChatHistoryList = ", chatHistoryList);
        if(chatHistoryList.length > 0){
            const chatList = chatHistoryList.map(chatHistory => ({
                user_id :chatHistory.user_id,
                chatHistory_id: chatHistory.chatHistory_id,
                last_interaction: chatHistory.last_interaction,
                read_status: chatHistory.read_status,
                timestamp: chatHistory.updatedAt
               })
            );
            const chatUserList = chatList.map(chatHistory => chatHistory.user_id);
            console.log("chat user list ",chatUserList);
            const userList = await User.scan()
                                .filter('user_id')
                                .in(chatUserList).exec();
            console.log("UserList = ", userList);
            const userNames = userList.map(user => ({ id: user.user_id, name: user.personal_details['fullName'] }));
            let createResponse = [];
            for(let i = 0; i < chatList.length; i++){
                const chat = chatList[i];
                const userId = chat.user_id;
                const lastInteraction = chat.last_interaction;
                const readStatus = chat.read_status;
                const contact = userNames.find(user => user.id === userId);
                if(contact){
                    createResponse.push({
                        user_id: userId,
                        name: contact.name,
                        last_interaction: lastInteraction,
                        read_status: readStatus,
                        timestamp: chat.timestamp
                    });
                }
            }
            console.log("CreateResponse =", createResponse);
            res.status(200).json({ message: 'Chat list fetched successfully', data: createResponse });
        } else {
            res.status(200).json({ message: 'No chat history found', data: [] });
        }
        
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error fetching chat list', error });
    }

});

router.post('/createChatHistory', async (req, res) => {
    try {
        await createChatHistory(req.body);
        res.status(201).json({ message: 'Chat history added successfully' });
    } catch (error) {
    }
});

export default router;