// // authContext.js
// import { createContext, useContext, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(() => {
//         // Initialize user state from localStorage on mount
//         const savedUser = localStorage.getItem('user');
//         return savedUser ? JSON.parse(savedUser) : null;
//     });
//     const [loading, setLoading] = useState(false);
//     const navigate = useNavigate();

//     // Verify token only when necessary (e.g., on initial load or token refresh)
//     const verifyToken = useCallback(async () => {
//         const token = localStorage.getItem('authToken');
//         if (!token) {
//             setUser(null);
//             return false;
//         }

//         try {
//             const response = await fetch('/api/verify-token', {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             if (response.ok) {
//                 const userData = await response.json();
//                 setUser(userData);
//                 localStorage.setItem('user', JSON.stringify(userData));
//                 return true;
//             } else {
//                 handleLogout();
//                 return false;
//             }
//         } catch (error) {
//             console.error('Token verification failed:', error);
//             handleLogout();
//             return false;
//         }
//     }, []);

//     const handleLogin = async (credentials) => {
//         setLoading(true);
//         try {
//             const response = await fetch('/api/login', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(credentials),
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 // Store both token and user data
//                 localStorage.setItem('authToken', data.token);
//                 localStorage.setItem('user', JSON.stringify(data.user));
//                 setUser(data.user);
//                 navigate('/home');
//                 return true;
//             }
//             return false;
//         } catch (error) {
//             console.error('Login failed:', error);
//             return false;
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('authToken');
//         localStorage.removeItem('user');
//         setUser(null);
//         navigate('/login');
//     };

//     // Token refresh logic - call this when token is about to expire
//     const refreshToken = async () => {
//         const token = localStorage.getItem('authToken');
//         if (!token) return false;

//         try {
//             const response = await fetch('/api/refresh-token', {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });

//             if (response.ok) {
//                 const data = await response.json();
//                 localStorage.setItem('authToken', data.token);
//                 return true;
//             } else {
//                 handleLogout();
//                 return false;
//             }
//         } catch (error) {
//             console.error('Token refresh failed:', error);
//             handleLogout();
//             return false;
//         }
//     };

//     const value = {
//         user,
//         loading,
//         login: handleLogin,
//         logout: handleLogout,
//         refreshToken,
//         verifyToken,
//         isAuthenticated: !!user,
//         hasRole: (role) => user?.roles?.includes(role) || false,
//     };

//     return (
//         <AuthContext.Provider value={value}>
//             {children}
//         </AuthContext.Provider>
//     );
// };

// // Custom hook for using auth context
// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error('useAuth must be used within an AuthProvider');
//     }
//     return context;
// };

// src/auth/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../components/axiosConfig";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    console.log("Auth provider rendering");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("useEffect from authContext first line");
        const initializeAuth = () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                const decoded = parseJwt(token);
                console.log(decoded);
                // debugger;
                if (decoded) {
                    setUser({
                        userId: decoded.user.moderator_id,
                        role: decoded.user.role,
                        details: decoded.user,
                        // userId: 'dbe5a68f-cd55-4606-a25e-9a2b6a04d0b2',
                        // role: decoded.role,
                    });
                    console.log(decoded.user);
                    api.defaults.headers.common[
                        "Authorization"
                    ] = `Bearer ${token}`;
                }
                console.log(decoded.user);
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post("/auth/login", { email, password });
            const { accessToken } = response.data;

            console.log(accessToken);

            localStorage.setItem("accessToken", accessToken);
            api.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${accessToken}`;

            const decoded = parseJwt(accessToken);
            setUser({
                userId: decoded.user.moderator_id,
                role: decoded.user.role,
                details: decoded.user,
            });
            console.log("user setting done");

            return true;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = () => {
        // call to backend logout pending
        localStorage.removeItem("accessToken");
        delete api.defaults.headers.common["Authorization"];
        setUser(null);
    };

    const parseJwt = (token) => {
        try {
            return JSON.parse(atob(token.split(".")[1]));
        } catch (e) {
            return null;
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, loading, login, logout, isAuthenticated: !!user }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
