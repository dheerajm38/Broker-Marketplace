import { useState, useMemo, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { Search, User } from "lucide-react";
import { useSocket } from "../contexts/SocketContext";
import { fetchChatList } from "./Message/Api/MessageApi";
import { useAuth } from "../contexts/authContext";
import SelectedChat from "./Message/SelectedChat";
import ContentWrapper from "./layout/ContentWrapper";
import { MegaphoneIcon, X, SendHorizontal } from 'lucide-react';

const BroadcastChat = ({ messages = [], onSendBroadcast }) => {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendBroadcast(newMessage);
            setNewMessage("");
        }
    };

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center bg-white">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <MegaphoneIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                    <h2 className="font-semibold text-gray-900">Broadcast Messages</h2>
                    <p className="text-sm text-gray-500">Send messages to all users</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className="flex flex-col items-end">
                            <div className="max-w-[80%] bg-blue-600 text-white rounded-lg rounded-tr-none px-4 py-2 shadow-sm">
                                <p className="text-sm">{msg.content}</p>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 mr-1">
                                {new Date(msg.timestamp).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your broadcast message..."
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendHorizontal className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

const MessagesContent = ({ isSidebarOpen }) => {

    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [chatList, setChatList] = useState([]);
    const { user } = useAuth();
    const socket = useSocket();
    const [broadcastHistory, setBroadcastHistory] = useState([]);
    const [isBroadcastView, setIsBroadcastView] = useState(false);

    useEffect(() => {
        const fetchUserList = async () => {
            const response = await fetchChatList(user.userId);
            // console.log("RESS", response);
            console.log('Chat list', response['data']);
            setChatList(response['data']);
        }
        fetchUserList();
    }, [])

    useEffect(() => {
        if (selectedChat && socket) {
            socket.emit('joinPrivateRoom', selectedChat.user_id)
        }
    }, [selectedChat, socket]);

    useEffect(() => {
        if (socket) {
            socket.on('broadcastMessage', (message) => {
                console.log('Received broadcast:', message);
            });

            return () => {
                socket.off('broadcastMessage');
            };
        }
    }, [socket]);

    useEffect(() => {
        const fetchBroadcastHistory = async () => {
            try {
                const response = await api.get('/broadcast/history');
                if (response.data.success) {
                    setBroadcastHistory(response.data.messages);
                }
            } catch (error) {
                console.error('Error fetching broadcast history:', error);
            }
        };

        fetchBroadcastHistory();
    }, []);

    const filteredChats = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return chatList;

        return chatList.filter(
            (chat) =>
                chat.name.toLowerCase().includes(query) ||
                (chat.last_interaction || '').toLowerCase().includes(query)
        );
    }, [chatList, searchQuery]);

    const sortedChatList = useMemo(() => {
        return [...filteredChats].sort((a, b) => {
            const timestampA = new Date(a.timestamp).getTime();
            const timestampB = new Date(b.timestamp).getTime();
            return timestampB - timestampA; 
        });
    }, [filteredChats]);

    const truncateText = (text, maxLength = 30) => {
        return text.length > maxLength
            ? `${text.substring(0, maxLength)}...`
            : text;
    };


    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (
            selectedChat &&
            !filteredChats.some((chat) => chat.id === selectedChat.id)
        ) {
            setSelectedChat(null);
        }
    };

    const handleBroadcast = async (message) => {
        try {
            // API call will be integrated later
            console.log('Broadcasting message:', broadcastMessage);
            setBroadcastMessage('');
            // Show success notification here
        } catch (error) {
            console.error('Error sending broadcast:', error);
            alert('Failed to send broadcast message');
        }
    };

    return (
        <div className="h-full flex">
            <div
                className={`fixed top-16 ${isSidebarOpen ? "left-64" : "left-20"} right-0 bottom-0 transition-all duration-300 flex bg-gray-50`}
            >
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
                        <div className="relative flex-1">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search chats..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {
                            sortedChatList.length > 0 ? (
                                sortedChatList.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => setSelectedChat(chat)}
                                        className={`flex items-center h-20 px-4 cursor-pointer hover:bg-gray-50 ${selectedChat?.id === chat.id
                                            ? "bg-blue-50"
                                            : ""
                                            }`}
                                    >
                                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User size={20} className="text-gray-500" />
                                        </div>
                                        <div className="ml-3 flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-medium text-sm truncate">
                                                    {chat.name}
                                                </h3>
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate max-w-[180px]">
                                                {truncateText(chat.last_interaction)}
                                            </p>
                                        </div>
                                        {chat.unread && (
                                            <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-32 text-gray-500">
                                    No chats found
                                </div>
                            )
                        }
                    </div>
                </div>

                {isBroadcastView ? (
                    <BroadcastChat
                        messages={broadcastHistory}
                        onSendBroadcast={handleBroadcast}
                    />
                ) : selectedChat ? (
                    <SelectedChat key={selectedChat.id} selectedChat={selectedChat} />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <p className="text-gray-500">
                            Select a chat to start messaging
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function MessagesScreen() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative">
            <NavigationBar
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}

            />
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                //     const [message, setMessage] = useState("");

                //     const chats = [
                //         {
                //             id: 1,
                //             name: "Dhiraj Mittal",
                //             message: "Typing...",
                //             time: "5min ago",
                //             unread: true,
                //         },
                //         {
                //             id: 2,
                //             name: "Keyut Shah",
                //             message: "Tell more about wireframe...",
                //             time: "8:15 AM",
                //         },
                //         {
                //             id: 3,
                //             name: "Jayesh Abad",
                //             message: "Not yet read",
                //             time: "8:35 PM",
                //         },
                //         {
                //             id: 4,
                //             name: "Bharat Saini",
                //             message: "I need company logo",
                //             time: "9:05 PM",
                //         },
                //         {
                //             id: 5,
                //             name: "Jayant",
                //             message: "Dolor sit amet, co",
                //             time: "10:10 PM",
                //         },
                //         {
                //             id: 6,
                //             name: "Savan Patel",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "01:48 AM",
                //         },
                //         {
                //             id: 7,
                //             name: "Praveen Patil",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "02:17 AM",
                //         },
                //         {
                //             id: 8,
                //             name: "Ronak Sharma",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "Yesterday",
                //         },
                //     ];

                //     const handleSendMessage = (e) => {
                //         e.preventDefault();
                //         if (message.trim()) {
                //             // Handle sending message
                //             setMessage("");
                //         }
                //     };

                //     return (
                //         <div
                //             className={`fixed top-16 ${
                //                 isSidebarOpen ? "left-64" : "left-0"
                //             } right-0 bottom-0 transition-all duration-300 flex bg-gray-50`}
                //         >
                //             {/* Chat List */}
                //             <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                //                 <div className="p-4 border-b border-gray-200">
                //                     <div className="relative">
                //                         <Search
                //                             className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                //                             size={20}
                //                         />
                //                         <input
                //                             type="text"
                //                             placeholder="Search"
                //                             className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                //                         />
                //                     </div>
                //                 </div>
                //                 <div className="flex-1 overflow-y-auto">
                //                     {chats.map((chat) => (
                //                         <div
                //                             key={chat.id}
                //                             onClick={() => setSelectedChat(chat)}
                //                             className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                //                                 selectedChat?.id === chat.id ? "bg-blue-50" : ""
                //                             }`}
                //                         >
                //                             <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                //                                 <User size={20} className="text-gray-500" />
                //                             </div>
                //                             <div className="ml-3 flex-1">
                //                                 <div className="flex justify-between items-center">
                //                                     <h3 className="font-medium text-sm">
                //                                         {chat.name}
                //                                     </h3>
                //                                     <span className="text-xs text-gray-500">
                //                                         {chat.time}
                //                                     </span>
                //                                 </div>
                //                                 <p className="text-sm text-gray-500 truncate">
                //                                     {chat.message}
                //                                 </p>
                //                             </div>
                //                             {chat.unread && (
                //                                 <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                //                             )}
                //                         </div>
                //                     ))}
                //                 </div>
                //             </div>

                //             {/* Chat Area */}
                //             {selectedChat ? (
                //                 <div className="flex-1 flex flex-col bg-white">
                //                     {/* Chat Header */}
                //                     <div className="p-4 border-b border-gray-200 flex items-center">
                //                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                //                             <User size={20} className="text-gray-500" />
                //                         </div>
                //                         <div className="ml-3">
                //                             <h2 className="font-medium">{selectedChat.name}</h2>
                //                             <p className="text-sm text-gray-500">Online</p>
                //                         </div>
                //                     </div>

                //                     {/* Messages */}
                //                     <div className="flex-1 overflow-y-auto p-4">
                //                         {/* Sample messages */}
                //                         <div className="mb-4">
                //                             <div className="bg-blue-100 rounded-lg p-3 max-w-md ml-auto">
                //                                 <p className="text-sm">
                //                                     Dolor sit amet, consectetur adipiscing elit.
                //                                     Hendrerit vulputate viverra commodo
                //                                     tincidunt
                //                                 </p>
                //                             </div>
                //                         </div>
                //                         <div className="mb-4">
                //                             <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                //                                 <p className="text-sm">
                //                                     Can you send the file of Martins UX case
                //                                     study and the link to wireframe ?
                //                                 </p>
                //                             </div>
                //                         </div>
                //                         <div className="mb-4">
                //                             <div className="bg-blue-100 rounded-lg p-3 max-w-md ml-auto">
                //                                 <p className="text-sm">Yes, Here it is</p>
                //                             </div>
                //                         </div>
                //                     </div>

                //                     {/* Message Input */}
                //                     <form
                //                         onSubmit={handleSendMessage}
                //                         className="p-4 border-t border-gray-200"
                //                     >
                //                         <div className="flex items-center">
                //                             <input
                //                                 type="text"
                //                                 value={message}
                //                                 onChange={(e) => setMessage(e.target.value)}
                //                                 placeholder="Enter your message"
                //                                 className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                //                             />
                //                             <button
                //                                 type="submit"
                //                                 className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                //                             >
                //                                 <SendHorizontal size={20} />
                //                             </button>
                //                         </div>
                //                     </form>
                //                 </div>
                //             ) : (
                //                 <div className="flex-1 flex items-center justify-center bg-white">
                //                     <p className="text-gray-500">
                //                         Select a chat to start messaging
                //                     </p>
                //                 </div>
                //             )}
                //         </div>
                //     );
                // };

                // const MessagesContent = ({ isSidebarOpen }) => {
                //     const [selectedChat, setSelectedChat] = useState(null);
                //     const [message, setMessage] = useState("");

                //     const chats = [
                //         {
                //             id: 1,
                //             name: "Dhiraj Mittal",
                //             message: "Typing...",
                //             time: "5min ago",
                //             unread: true,
                //         },
                //         {
                //             id: 2,
                //             name: "Keyut Shah",
                //             message: "Tell more about wireframe...",
                //             time: "8:15 AM",
                //         },
                //         {
                //             id: 3,
                //             name: "Jayesh Abad",
                //             message: "Not yet read",
                //             time: "8:35 PM",
                //         },
                //         {
                //             id: 4,
                //             name: "Bharat Saini",
                //             message: "I need company logo",
                //             time: "9:05 PM",
                //         },
                //         {
                //             id: 5,
                //             name: "Jayant",
                //             message: "Dolor sit amet, co",
                //             time: "10:10 PM",
                //         },
                //         {
                //             id: 6,
                //             name: "Savan Patel",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "01:48 AM",
                //         },
                //         {
                //             id: 7,
                //             name: "Praveen Patil",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "02:17 AM",
                //         },
                //         {
                //             id: 8,
                //             name: "Ronak Sharma",
                //             message: "Dolor sit amet, consectetur adipiscing elit, urna at",
                //             time: "Yesterday",
                //         },
                //     ];

                //     const handleSendMessage = (e) => {
                //         e.preventDefault();
                //         if (message.trim()) {
                //             // Handle sending message
                //             setMessage("");
                //         }
                //     };

                //     return (
                //         <div
                //             className={`fixed top-16 ${
                //                 isSidebarOpen ? "left-64" : "left-0"
                //             } right-0 bottom-0 transition-all duration-300 flex bg-gray-50`}
                //         >
                //             {/* Chat List */}
                //             <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                //                 <div className="p-4 border-b border-gray-200">
                //                     <div className="relative">
                //                         <Search
                //                             className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                //                             size={20}
                //                         />
                //                         <input
                //                             type="text"
                //                             placeholder="Search"
                //                             className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                //                         />
                //                     </div>
                //                 </div>
                //                 <div className="flex-1 overflow-y-auto">
                //                     {chats.map((chat) => (
                //                         <div
                //                             key={chat.id}
                //                             onClick={() => setSelectedChat(chat)}
                //                             className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                //                                 selectedChat?.id === chat.id ? "bg-blue-50" : ""
                //                             }`}
                //                         >
                //                             <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                //                                 <User size={20} className="text-gray-500" />
                //                             </div>
                //                             <div className="ml-3 flex-1">
                //                                 <div className="flex justify-between items-center">
                //                                     <h3 className="font-medium text-sm">
                //                                         {chat.name}
                //                                     </h3>
                //                                     <span className="text-xs text-gray-500">
                //                                         {chat.time}
                //                                     </span>
                //                                 </div>
                //                                 <p className="text-sm text-gray-500 truncate">
                //                                     {chat.message}
                //                                 </p>
                //                             </div>
                //                             {chat.unread && (
                //                                 <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
                //                             )}
                //                         </div>
                //                     ))}
                //                 </div>
                //             </div>

                //             {/* Chat Area */}
                //             {selectedChat ? (
                //                 <div className="flex-1 flex flex-col bg-white">
                //                     {/* Chat Header */}
                //                     <div className="p-4 border-b border-gray-200 flex items-center">
                //                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                //                             <User size={20} className="text-gray-500" />
                //                         </div>
                //                         <div className="ml-3">
                //                             <h2 className="font-medium">{selectedChat.name}</h2>
                //                             <p className="text-sm text-gray-500">Online</p>
                //                         </div>
                //                     </div>

                //                     {/* Messages */}
                //                     <div className="flex-1 overflow-y-auto p-4">
                //                         {/* Sample messages */}
                //                         <div className="mb-4">
                //                             <div className="bg-blue-100 rounded-lg p-3 max-w-md ml-auto">
                //                                 <p className="text-sm">
                //                                     Dolor sit amet, consectetur adipiscing elit.
                //                                     Hendrerit vulputate viverra commodo
                //                                     tincidunt
                //                                 </p>
                //                             </div>
                //                         </div>
                //                         <div className="mb-4">
                //                             <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                //                                 <p className="text-sm">
                //                                     Can you send the file of Martins UX case
                //                                     study and the link to wireframe ?
                //                                 </p>
                //                             </div>
                //                         </div>
                //                         <div className="mb-4">
                //                             <div className="bg-blue-100 rounded-lg p-3 max-w-md ml-auto">
                //                                 <p className="text-sm">Yes, Here it is</p>
                //                             </div>
                //                         </div>
                //                     </div>

                //                     {/* Message Input */}
                //                     <form
                //                         onSubmit={handleSendMessage}
                //                         className="p-4 border-t border-gray-200"
                //                     >
                //                         <div className="flex items-center">
                //                             <input
                //                                 type="text"
                //                                 value={message}
                //                                 onChange={(e) => setMessage(e.target.value)}
                //                                 placeholder="Enter your message"
                //                                 className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                //                             />
                //                             <button
                //                                 type="submit"
                //                                 className="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                //                             >
                //                                 <SendHorizontal size={20} />
                //                             </button>
                //                         </div>
                //                     </form>
                //                 </div>
                //             ) : (
                //                 <div className="flex-1 flex items-center justify-center bg-white">
                //                     <p className="text-gray-500">
                //           </ContentWrapper>              Select a chat to start messaging
                //                     </p>
                //                 </div>
                //             )}
                //         </div>
                //     );
                // };
                <ContentWrapper isSidebarOpen={isSidebarOpen}>
                    <MessagesContent isSidebarOpen={isSidebarOpen} />
                </ContentWrapper>
            }</div>
    );
}
