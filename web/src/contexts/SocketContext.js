import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./authContext";

const SocketContext = createContext();

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const { user, isAuthenticated, loading } = useAuth();
    console.log("User ", user);
    useEffect(() => {
        const newSocket = io("http://localhost:8000", {
            query: {
                userId: user.userId,
                token: localStorage.getItem("token"),
            },
        });
        setSocket(newSocket);
        newSocket.on("connect", () => {
            console.log("WebSocket connected");
        });

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}
