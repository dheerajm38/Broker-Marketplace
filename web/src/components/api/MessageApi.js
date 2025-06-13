import axios from "axios";

export const fetchChatList = async (userId) => {
    try {
        console.log("User userId", userId);
        const response = await axios.get(
            `http://13.203.197.179/message/chatList/${userId}`
        );
        console.log("Response data", response.data);
        return response.data;
    } catch (error) {
        console.error(error);
    }
};

export const fetchMessages = async (senderId, receiverId) => {
    try {
        const response = await axios.get(
            `http://13.203.197.179/message/getMessages/${senderId}/${receiverId}`
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};

export const fetchMessagesSender = async (
    senderId,
    receiverId,
    messageStart
) => {
    try {
        const response = await axios.get(
            `http://13.203.197.179/message/getMessages/${senderId}/${receiverId}`,
            {
                params: {
                    startMessage: messageStart,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
};
