import { SendHorizontal, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { fetchMessages } from "./Api/MessageApi";
import { useAuth } from "../../contexts/authContext";
import { sortMessages } from "./Utils/MessageUtil";
import { useSocket } from "../../contexts/SocketContext";

export default function SelectedChat({ selectedChat }) {

    const [message, setMessage] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const { user} = useAuth();
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const [loadedMsg, setLoadedMsg] = useState(0);
    const [noMoreMessages, setNoMoreMessages] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };

    useEffect(() => {
        const fetchInitialMessages = async () => {
            if (!selectedChat?.user_id) return;

            setChatMessages([]);
            setLoadedMsg(0);
            setNoMoreMessages(false);

            try {
                const response = await fetchMessages(user.userId, selectedChat.user_id, 0);
                if (response.length < 10) {
                    setNoMoreMessages(true);
                }
                setChatMessages(sortMessages(response));
                setLoadedMsg(10);
                scrollToBottom();
            } catch (exception) {
                // handle error
            }
        };

        fetchInitialMessages();
    }, [selectedChat]);

    useEffect(() => {
        const handlenewmessaage =(data) =>{
            if(socket){ 
                if (data.sender_id === selectedChat.user_id || data.receiver_id === selectedChat.user_id) {
                    setChatMessages((prevChatMessages) => sortMessages([
                        ...prevChatMessages,
                        {
                            message_body: data.content,
                            sender_id: data.sender_id,
                            receiver_id: data.receiver_id,
                            createdAt: data.createdAt, // Use the current date for the createdAt field
                            updatedAt: data.updatedAt, // Use the current date for the updatedAt field
                        },
                    ]));
                    scrollToBottom(); // Scroll to the bottom to show the new message
                }      
            }
        }
        socket.on('newprivateMessage', handlenewmessaage);
    
        return () => {
          socket.off('newprivateMessage', handlenewmessaage);
        };
    },[socket, selectedChat]);

    const fetchMoreMessages = async () => {
        if (noMoreMessages || loadingMore) return;

        setLoadingMore(true);
        try {
            const response = await fetchMessages(user.userId, selectedChat.user_id, loadedMsg);
            if (response.length < 10) {
                setNoMoreMessages(true);
            }
            setChatMessages(prev => sortMessages([...response, ...prev]));
            setLoadedMsg(prev => prev + 10);
        } catch (exception) {
            // handle error
        } finally {
            setLoadingMore(false);
        }
    };

    const handleScroll = () => {
        if (messagesContainerRef.current.scrollTop === 0) {
            fetchMoreMessages();
        }
    };
    
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && selectedChat) {
            const newMessage = {
                message_body: message.trim(),
                sender_id: user.userId,
                receiver_id: selectedChat.user_id,
                updatedAt: Math.floor(Date.now() / 1000),
                createdAt: Math.floor(Date.now() / 1000),
            };
            setChatMessages([...chatMessages, newMessage]);
            setMessage("");
            socket.emit('privateMessage', {
                content:message, 
                receiver_id: selectedChat.user_id,
                sender_id: user.userId,
                sentBy: 'moderator'
            });
            scrollToBottom();
        }
    }

    return (
        <div className="flex-1 flex flex-col bg-white">
                    {/* Chat Header */}
                    <div className="h-16 border-b border-gray-200 flex items-center px-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <User size={20} className="text-gray-500" />
                        </div>
                        <div className="ml-3">
                            <h2 className="font-medium">{selectedChat.name}</h2>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4"               
                      ref={messagesContainerRef}
                        onScroll={handleScroll}>
                        {chatMessages.map((msg, index) => (
                            <div key={index} className="mb-4">
                                <div
                                    className={`${
                                        msg.sender_id === user.userId
                                            ? "bg-blue-100 ml-auto"
                                            : "bg-gray-100"
                                    } rounded-lg p-3 max-w-md`}
                                >
                                    <p className="text-sm">{msg.message_body}</p>
                                    <span className="text-xs text-gray-500 mt-1 block">
                                    {new Date(msg.updatedAt * 1000).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-4 border-t border-gray-200"
                    >
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your message"
                                className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="submit"
                                className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <SendHorizontal size={20} />
                            </button>
                        </div>
                    </form>
                </div>
    )
}