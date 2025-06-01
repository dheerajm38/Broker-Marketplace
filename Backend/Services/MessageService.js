import { ChatHistory, Message } from '../Model/Models.js';

export const createMessage = async (content, sender, receiver, ) => {
    try{
        const newMessage = new Message({
            message_body : content,
            sender_id : sender,
            receiver_id: receiver
        });
        await newMessage.save();
        console.log("New message created", newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        throw error;
    }
}

export const createChatHistory = async (data) => {
    try{
        const newChatHistory = new ChatHistory({
            emp_id : data.empID,
            user_id : data.userID,
            last_interaction : data.lastInteraction
        });
        console.log('New chat history created', newChatHistory);
        await newChatHistory.save();
        console.log('New chat history created', newChatHistory);
    } catch (error) {
        throw error;
    }
}

export const updateChatHistory = async (data) => {
    try{
        console.log('Updating chat history', data);
        const existingChatHistory = await ChatHistory.scan()
  .filter('emp_id').eq(data.empID)
  .filter('user_id').eq(data.userID)
  .exec();

            console.log('Existing chat history', existingChatHistory);
        if(existingChatHistory.count > 0) {
            console.log('Existing chat history', existingChatHistory);
            const chatHistoryId = existingChatHistory[0].chatHistory_id;

            await ChatHistory.update(
                { chatHistory_id: chatHistoryId },
                { last_interaction: data.lastInteraction, read_status: data.readStatus });
        } else {
            await createChatHistory(data);
        }
     }
    catch(error){
        throw error;
    }
}