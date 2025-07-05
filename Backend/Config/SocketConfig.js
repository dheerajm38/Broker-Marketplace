import { Server } from "socket.io";
import { generatePrivateRoomId } from '../Utils/MessagingUtils.js';
import { createMessage, updateChatHistory } from '../Services/MessageService.js';

export const socketConfig = (server) => {
    const io = new Server(server,{
        cors: {
            origin: ["http://localhost:1234", "https://3546-2402-a00-401-4bd2-f433-7f15-3514-66ee.ngrok-free.app" ,"https://api.dhirajmittal.com"], // have to add mobile app url here
            allowedHeaders: ["my-custom-header"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('a user connect', socket.userId);

        socket.on('joinPrivateRoom',async (otherUserId) => {
            const roomId = generatePrivateRoomId(socket.userId, otherUserId);
            await socket.join(roomId);
            console.log('joined room', roomId);
        });
    
        socket.on('privateMessage', async (data) => {
            // Async call to save message in DB
            console.log('received private message', data.content, data.receiver_id, data.sentBy);
            try{
                await createMessage(data.content, data.sender_id, data.receiver_id);
                if(data.sentBy === 'user'){
                    console.log('updating chat history for emp',data);

                    await updateChatHistory({ empID: data.receiver_id, userID: data.sender_id, lastInteraction: data.content, readStatus: 'unread' });
                } else {
                    await updateChatHistory({ empID: data.sender_id, userID: data.receiver_id, lastInteraction: data.content, readStatus: 'unread' });
                }
            } catch (error) {
                console.error('Error saving message:', error);
            }
            console.log('socket.rooms', socket.rooms);
            //Emit to the room   
            const roomId = generatePrivateRoomId(socket.userId, data.receiver_id);
            socket.to(roomId).emit('newprivateMessage', data);
            // socket.emit('newprivateMessage', data);
            console.log('emitted private message', data.content, data , roomId);
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    }); 

    //Socket middleware
    io.use((socket, next) => {
        const token = socket.handshake.query.token;
        const userId = socket.handshake.query.userId;
        
        // Verify token and set userId
    // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    //   if (err) {
    //     console.error('Error verifying token:', err);
    //   } else {
    //     if (decoded.id === userId) {
        socket.userId = userId;
    //       console.log('Token verified successfully. User ID set:', userId);
        next();
    //     } else {
    //       console.error('Invalid user ID. Token verification failed.');
    //     }
    //   }
    // });
    });
}
