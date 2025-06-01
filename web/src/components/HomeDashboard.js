import React, { useState, useEffect } from "react";

import "../global.css";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from "./axiosConfig";

import { BarChart2, MessageCircle } from "lucide-react";

import { Link, useNavigate } from "react-router";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

import {
    Users,
    UserCircle,
    Store,
    CheckCircle,
    Package,
    TrendingUp,
    Ticket,
} from "lucide-react";
import { useAuth } from "../contexts/authContext";

const DashboardContent = ({ isSidebarOpen }) => {
    const [tokenError, setTokenError] = useState(null);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Helper function to get icon component
    const getIcon = (iconName) => {
        const icons = {
            Users: Users,
            UserCircle: UserCircle,
            Store: Store,
            CheckCircle: CheckCircle,
            Package: Package,
            TrendingUp: TrendingUp,
            Ticket: Ticket,
        };
        const IconComponent = icons[iconName];
        return IconComponent ? <IconComponent size={24} /> : null;
    };

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await api.get("/dashboard/details");
                setDashboardData(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data");
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Dynamic stats based on API data
    const dynamicStats = dashboardData
        ? [
              {
                  id: 1,
                  title: "New Buyer Access Requests",
                  value: dashboardData.onboardingRequestsCount.toString(),
                  bgColor: "bg-blue-50/50",
                  iconBgColor: "bg-blue-100/80",
                  iconColor: "text-blue-600",
                  icon: "Users",
                  route: "/notifications?filter=buyer-request", // TODO: make the filter work
              },
              {
                  id: 2,
                  title: "Total Buyers",
                  value: dashboardData.buyersCount.toString(),
                  bgColor: "bg-emerald-50/50",
                  iconBgColor: "bg-emerald-100/80",
                  iconColor: "text-emerald-600",
                  icon: "UserCircle",
                  route: "/buyers",
              },
              {
                  id: 3,
                  title: "Total Sellers",
                  value: dashboardData.sellersCount.toString(),
                  bgColor: "bg-indigo-50/50",
                  iconBgColor: "bg-indigo-100/80",
                  iconColor: "text-indigo-600",
                  icon: "Store",
                  route: "/sellers",
              },
              {
                  id: 4,
                  title: "Deals Completed Today",
                  value: dashboardData.ticketsCompletedToday.toString(),
                  bgColor: "bg-amber-50/50",
                  iconBgColor: "bg-amber-100/80",
                  iconColor: "text-amber-600",
                  icon: "CheckCircle",
                  route: "/tickets?filter=completed", //todo: make the filter work
              },
              {
                  id: 5,
                  title: "Total Active Products",
                  value: dashboardData.activeProductsCount.toString(),
                  bgColor: "bg-rose-50/50",
                  iconBgColor: "bg-rose-100/80",
                  iconColor: "text-rose-600",
                  icon: "Package",
                  route: "/products",
              },
              {
                  id: 6,
                  title: "Total Tickets Open",
                  value: dashboardData.ticketsOpenedToday.toString(),
                  bgColor: "bg-violet-50/50",
                  iconBgColor: "bg-violet-100/80",
                  iconColor: "text-violet-600",
                  icon: "Ticket",
                  route: "/tickets",
              },
          ]
        : [];

    // useEffect(() => {
    //     // Track if the effect has already run to prevent duplicates
    //     let isEffectActive = true;
    //     let messageUnsubscribe = null;

    //     const requestPermissionAndToken = async () => {
    //         try {
    //             // Check if service workers are supported
    //             if ("serviceWorker" in navigator) {
    //                 // Register the service worker - but only once
    //                 const registration = await navigator.serviceWorker.register(
    //                     new URL(
    //                         "../../public/firebase-messaging-sw.js",
    //                         import.meta.url
    //                     ),
    //                     { scope: "/" } // Specify the scope explicitly
    //                 );

    //                 // Wait for the service worker to be fully activated
    //                 await navigator.serviceWorker.ready;

    //                 // Use a named listener function so we can remove it if needed
    //                 const messageListener = (event) => {
    //                     console.log(
    //                         "Received message from service worker:",
    //                         event.data
    //                     );
    //                 };

    //                 // Remove any existing listeners before adding a new one
    //                 navigator.serviceWorker.removeEventListener(
    //                     "message",
    //                     messageListener
    //                 );
    //                 navigator.serviceWorker.addEventListener(
    //                     "message",
    //                     messageListener
    //                 );

    //                 console.log(
    //                     "Service Worker registered successfully:",
    //                     registration.scope
    //                 );

    //                 // Request notification permission
    //                 const permission = await Notification.requestPermission();
    //                 console.log("Notification permission:", permission);

    //                 if (permission === "granted") {
    //                     // Get FCM token
    //                     const currentToken = await getToken(messaging, {
    //                         vapidKey:
    //                             "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
    //                     });

    //                     if (currentToken) {
    //                         console.log("Token:", currentToken);

    //                         // Use user from auth context instead of local storage
    //                         if (user && user.userId) {
    //                             // Check if token has changed (assuming fcm_token is stored in user.details)
    //                             if (user.details.fcm_token !== currentToken) {
    //                                 // Update token in backend
    //                                 await updateModeratorFcmToken(
    //                                     user.userId,
    //                                     currentToken
    //                                 );
    //                             }
    //                         } else {
    //                             console.log(
    //                                 "User not logged in, FCM token not saved"
    //                             );
    //                         }
    //                     } else {
    //                         console.log("No registration token available.");
    //                         setTokenError("No registration token available");
    //                     }
    //                 } else {
    //                     console.log("Notification permission denied");
    //                     setTokenError("Notification permission denied");
    //                 }
    //             } else {
    //                 console.error(
    //                     "Service workers are not supported in this browser"
    //                 );
    //                 setTokenError("Service workers not supported");
    //             }
    //         } catch (err) {
    //             console.error(
    //                 "An error occurred while setting up notifications:",
    //                 err
    //             );
    //             setTokenError(err.message);
    //         }
    //     };

    //     // Function to update FCM token in backend
    //     const updateModeratorFcmToken = async (moderatorId, fcmToken) => {
    //         try {
    //             // Get auth token from localStorage
    //             const accessToken = localStorage.getItem("accessToken");

    //             // Use the api instance from axiosConfig
    //             console.log(accessToken);
    //             const response = await api.put(`/moderator/${moderatorId}`, {
    //                 fcm_token: fcmToken,
    //             });

    //             console.log("FCM token updated successfully in backend");
    //             return response.data;
    //         } catch (error) {
    //             console.error("Error updating FCM token:", error);
    //             throw error;
    //         }
    //     };

    //     // Improved foreground message handler that prevents duplicates
    //     const handleForegroundMessage = (payload) => {
    //         // Use a unique ID for each notification to prevent duplicates
    //         const notificationId =
    //             payload.data?.notificationId || Date.now().toString();

    //         console.log(
    //             "Received foreground message:",
    //             payload,
    //             "ID:",
    //             notificationId
    //         );

    //         // Check if we've already processed this notification
    //         if (
    //             window.processedNotifications &&
    //             window.processedNotifications.includes(notificationId)
    //         ) {
    //             console.log("Skipping duplicate notification:", notificationId);
    //             return;
    //         }

    //         // Track processed notifications
    //         if (!window.processedNotifications) {
    //             window.processedNotifications = [];
    //         }
    //         window.processedNotifications.push(notificationId);

    //         // Limit the size of the processed array to prevent memory growth
    //         if (window.processedNotifications.length > 50) {
    //             window.processedNotifications =
    //                 window.processedNotifications.slice(-50);
    //         }

    //         // Make sure we have notification data
    //         const notificationData = payload.notification || {};
    //         const title = notificationData.title || "New Notification";
    //         const body = notificationData.body || "";
    //         const image =
    //             notificationData.image || "/path/to/your/default-icon.png";

    //         // Check if notification is supported and permission granted
    //         if (!("Notification" in window)) {
    //             console.error("Notifications not supported in this browser");
    //             return;
    //         }

    //         if (Notification.permission === "granted") {
    //             // Use only service worker to display notification
    //             if ("serviceWorker" in navigator) {
    //                 navigator.serviceWorker.ready
    //                     .then((registration) => {
    //                         console.log(
    //                             "Service Worker ready, showing notification"
    //                         );
    //                         return registration.showNotification(title, {
    //                             body: body,
    //                             icon: image,
    //                             tag: notificationId, // Adding a tag helps deduplicate notifications
    //                             data: payload.data,
    //                             requireInteraction: true,
    //                             actions: [
    //                                 {
    //                                     action: "view",
    //                                     title: "View",
    //                                 },
    //                             ],
    //                         });
    //                     })
    //                     .then(() => {
    //                         console.log(
    //                             "Notification successfully shown, ID:",
    //                             notificationId
    //                         );
    //                     })
    //                     .catch((error) => {
    //                         console.error(
    //                             "Failed to show notification:",
    //                             error
    //                         );
    //                     });
    //             } else {
    //                 console.error(
    //                     "Service Worker not supported in this browser"
    //                 );
    //             }
    //         } else {
    //             console.log("Notification permission not granted");
    //         }
    //     };

    //     // Set up token monitor
    //     const monitorToken = () => {
    //         let previousToken = "";

    //         // Function to check and update token
    //         const checkToken = async () => {
    //             try {
    //                 // Use user from auth context instead of localStorage
    //                 if (user && user.userId) {
    //                     const newToken = await getToken(messaging, {
    //                         vapidKey:
    //                             "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
    //                     });

    //                     // If we have a new token and it's different from previous
    //                     if (newToken && newToken !== previousToken) {
    //                         previousToken = newToken;

    //                         // If token changed from what's stored for the user
    //                         if (newToken !== user.details.fcm_token) {
    //                             await updateModeratorFcmToken(
    //                                 user.userId,
    //                                 newToken
    //                             );
    //                             console.log("FCM token updated");
    //                         }
    //                     }
    //                 }
    //             } catch (error) {
    //                 console.error("Error checking token:", error);
    //             }
    //         };

    //         // Initial check
    //         checkToken();

    //         // Setup periodic token check (every 24 hours)
    //         const tokenCheckInterval = setInterval(
    //             checkToken,
    //             24 * 60 * 60 * 1000
    //         );

    //         // Listen for messaging visibility change
    //         const visibilityHandler = () => {
    //             if (document.visibilityState === "visible") {
    //                 checkToken();
    //             }
    //         };

    //         document.addEventListener("visibilitychange", visibilityHandler);

    //         return () => {
    //             clearInterval(tokenCheckInterval);
    //             document.removeEventListener(
    //                 "visibilitychange",
    //                 visibilityHandler
    //             );
    //         };
    //     };

    //     // Only run if user is authenticated and this effect hasn't run yet
    //     if (user && isEffectActive) {
    //         // Request permission and token
    //         requestPermissionAndToken();

    //         // Set up message listener - store reference for cleanup
    //         messageUnsubscribe = onMessage(messaging, handleForegroundMessage);

    //         // Setup token monitoring
    //         const cleanupTokenMonitor = monitorToken();

    //         // Cleanup subscriptions when component unmounts
    //         return () => {
    //             isEffectActive = false;
    //             if (messageUnsubscribe) {
    //                 messageUnsubscribe();
    //             }
    //             cleanupTokenMonitor();

    //             // Clean up service worker event listener if possible
    //             if (navigator.serviceWorker.controller) {
    //                 const messageListener = (event) => {
    //                     console.log(
    //                         "Received message from service worker:",
    //                         event.data
    //                     );
    //                 };
    //                 navigator.serviceWorker.removeEventListener(
    //                     "message",
    //                     messageListener
    //                 );
    //             }
    //         };
    //     }
    // }, [user]); // Only depend on user to prevent multiple re-renders // Add user as a dependency

    // useEffect(() => {
    //     const requestPermissionAndToken = async () => {
    //         try {
    //             // Check if service workers are supported
    //             if ("serviceWorker" in navigator) {
    //                 // Register the service worker
    //                 const registration = await navigator.serviceWorker.register(
    //                     new URL(
    //                         "../../public/firebase-messaging-sw.js",
    //                         import.meta.url
    //                     )
    //                 );
    //                 navigator.serviceWorker.addEventListener(
    //                     "message",
    //                     (event) => {
    //                         console.log(
    //                             "Received message from service worker:",
    //                             event.data
    //                         );
    //                     }
    //                 );
    //                 console.log(
    //                     "Service Worker registered successfully:",
    //                     registration.scope
    //                 );

    //                 // Request notification permission
    //                 const permission = await Notification.requestPermission();
    //                 console.log(permission);

    //                 if (permission === "granted") {
    //                     // Get FCM token
    //                     const currentToken = await getToken(messaging, {
    //                         vapidKey:
    //                             "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
    //                     });

    //                     if (currentToken) {
    //                         console.log("Token:", currentToken);

    //                         // Use user from auth context instead of local storage
    //                         if (user && user.userId) {
    //                             // Check if token has changed (assuming fcm_token is stored in user.details)
    //                             if (user.details.fcm_token !== currentToken) {
    //                                 // Update token in backend
    //                                 await updateModeratorFcmToken(
    //                                     user.userId,
    //                                     currentToken
    //                                 );
    //                             }
    //                         } else {
    //                             console.log(
    //                                 "User not logged in, FCM token not saved"
    //                             );
    //                         }
    //                     } else {
    //                         console.log("No registration token available.");
    //                         setTokenError("No registration token available");
    //                     }
    //                 } else {
    //                     console.log("Notification permission denied");
    //                     setTokenError("Notification permission denied");
    //                 }
    //             } else {
    //                 console.error(
    //                     "Service workers are not supported in this browser"
    //                 );
    //                 setTokenError("Service workers not supported");
    //             }
    //         } catch (err) {
    //             console.error(
    //                 "An error occurred while setting up notifications:",
    //                 err
    //             );
    //             setTokenError(err.message);
    //         }
    //     };

    //     // Function to update FCM token in backend
    //     const updateModeratorFcmToken = async (moderatorId, fcmToken) => {
    //         try {
    //             // Get auth token from localStorage
    //             const accessToken = localStorage.getItem("accessToken");

    //             // Use the api instance from axiosConfig
    //             console.log(accessToken);
    //             const response = await api.put(`/moderator/${moderatorId}`, {
    //                 fcm_token: fcmToken,
    //             });

    //             console.log("FCM token updated successfully in backend");
    //             return response.data;
    //         } catch (error) {
    //             console.error("Error updating FCM token:", error);
    //             throw error;
    //         }
    //     };

    //     // Updated foreground message handler using Notification API directly
    //     const handleForegroundMessage = (payload) => {
    //         console.log("Received foreground message:", payload);

    //         // Skip if payload is missing or has no notification
    //         if (!payload || !payload.notification) {
    //             console.log("Invalid notification payload:", payload);
    //             return;
    //         }

    //         const notificationTitle =
    //             payload.notification.title || "New Notification";
    //         const notificationOptions = {
    //             body: payload.notification.body || "",
    //             icon: payload.notification.image || "/icon.png",
    //             data: payload.data || {},
    //             tag: payload.data?.id || Date.now().toString(), // Use a tag to prevent duplicate notifications
    //         };

    //         // Check if notification is supported
    //         if (!("Notification" in window)) {
    //             console.error("Notifications not supported in this browser");
    //             return;
    //         }

    //         // Check if we have permission
    //         if (Notification.permission === "granted") {
    //             try {
    //                 // Create a notification using the Notification API
    //                 const notification = new Notification(
    //                     notificationTitle,
    //                     notificationOptions
    //                 );

    //                 // Handle notification click
    //                 notification.onclick = function (event) {
    //                     event.preventDefault();

    //                     // If there's a click_action URL in the payload, open it
    //                     if (payload.notification.click_action) {
    //                         window.open(
    //                             payload.notification.click_action,
    //                             "_blank"
    //                         );
    //                     } else if (payload.data && payload.data.url) {
    //                         window.open(payload.data.url, "_blank");
    //                     }

    //                     notification.close();
    //                 };

    //                 console.log(
    //                     "Notification displayed successfully using Notification API"
    //                 );
    //             } catch (error) {
    //                 console.error("Error showing notification:", error);
    //             }
    //         } else {
    //             console.log("Notification permission not granted");
    //         }
    //     };

    //     // Set up token monitor
    //     const monitorToken = () => {
    //         let previousToken = "";

    //         // Function to check and update token
    //         const checkToken = async () => {
    //             try {
    //                 // Use user from auth context instead of localStorage
    //                 if (user && user.userId) {
    //                     const newToken = await getToken(messaging, {
    //                         vapidKey:
    //                             "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
    //                     });

    //                     // If we have a new token and it's different from previous
    //                     if (newToken && newToken !== previousToken) {
    //                         previousToken = newToken;

    //                         // If token changed from what's stored for the user
    //                         if (newToken !== user.details.fcm_token) {
    //                             await updateModeratorFcmToken(
    //                                 user.userId,
    //                                 newToken
    //                             );
    //                             console.log("FCM token updated");
    //                         }
    //                     }
    //                 }
    //             } catch (error) {
    //                 console.error("Error checking token:", error);
    //             }
    //         };

    //         // Initial check
    //         checkToken();

    //         // Setup periodic token check (every 24 hours)
    //         const tokenCheckInterval = setInterval(
    //             checkToken,
    //             24 * 60 * 60 * 1000
    //         );

    //         // Listen for messaging visibility change
    //         const visibilityHandler = () => {
    //             if (document.visibilityState === "visible") {
    //                 checkToken();
    //             }
    //         };

    //         document.addEventListener("visibilitychange", visibilityHandler);

    //         return () => {
    //             clearInterval(tokenCheckInterval);
    //             document.removeEventListener(
    //                 "visibilitychange",
    //                 visibilityHandler
    //             );
    //         };
    //     };

    //     // Only run if user is authenticated
    //     if (user) {
    //         // Request permission and token
    //         requestPermissionAndToken();

    //         // Set up message listener
    //         const unsubscribeMessage = onMessage(
    //             messaging,
    //             handleForegroundMessage
    //         );

    //         // Setup token monitoring
    //         const cleanupTokenMonitor = monitorToken();

    //         // Cleanup subscriptions when component unmounts
    //         return () => {
    //             unsubscribeMessage();
    //             cleanupTokenMonitor();
    //         };
    //     }
    // }, [user]); // Only depend on user to prevent duplicate effect execution, this useEffect worked well  as expected for a while

    useEffect(() => {
        // Keep track of notification IDs to prevent duplicates
        const processedNotifications = new Set();

        const requestPermissionAndToken = async () => {
            try {
                // Check if service workers are supported
                if ("serviceWorker" in navigator) {
                    // Register the service worker
                    const registration = await navigator.serviceWorker.register(
                        new URL(
                            "../../public/firebase-messaging-sw.js",
                            import.meta.url
                        )
                    );
                    navigator.serviceWorker.addEventListener(
                        "message",
                        (event) => {
                            console.log(
                                "Received message from service worker:",
                                event.data
                            );
                        }
                    );
                    console.log(
                        "Service Worker registered successfully:",
                        registration.scope
                    );

                    // Request notification permission
                    const permission = await Notification.requestPermission();
                    console.log("Permission status:", permission);

                    if (permission === "granted") {
                        // Get FCM token
                        const currentToken = await getToken(messaging, {
                            vapidKey:
                                "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
                        });

                        if (currentToken) {
                            console.log("Token:", currentToken);

                            // Use user from auth context instead of local storage
                            if (user && user.userId) {
                                // Check if token has changed (assuming fcm_token is stored in user.details)
                                if (user.details.fcm_token !== currentToken) {
                                    // Update token in backend
                                    await updateModeratorFcmToken(
                                        user.userId,
                                        currentToken
                                    );
                                }
                            } else {
                                console.log(
                                    "User not logged in, FCM token not saved"
                                );
                            }
                        } else {
                            console.log("No registration token available.");
                            setTokenError("No registration token available");
                        }
                    } else {
                        console.log("Notification permission denied");
                        setTokenError("Notification permission denied");
                    }
                } else {
                    console.error(
                        "Service workers are not supported in this browser"
                    );
                    setTokenError("Service workers not supported");
                }
            } catch (err) {
                console.error(
                    "An error occurred while setting up notifications:",
                    err
                );
                setTokenError(err.message);
            }
        };

        // Function to update FCM token in backend
        const updateModeratorFcmToken = async (moderatorId, fcmToken) => {
            try {
                // Get auth token from localStorage
                const accessToken = localStorage.getItem("accessToken");

                // Use the api instance from axiosConfig
                console.log(accessToken);
                const response = await api.put(`/moderator/${moderatorId}`, {
                    fcm_token: fcmToken,
                });

                console.log("FCM token updated successfully in backend");
                return response.data;
            } catch (error) {
                console.error("Error updating FCM token:", error);
                throw error;
            }
        };

        // Improved foreground message handler with retry logic
        const handleForegroundMessage = (payload) => {
            console.log("Received foreground message:", payload);

            // Generate a notification ID from the payload
            const notificationId =
                payload.data?.notificationId ||
                payload.messageId ||
                `notification-${Date.now()}`;

            // Check for duplicates
            if (processedNotifications.has(notificationId)) {
                console.log("Skipping duplicate notification:", notificationId);
                return;
            }

            // Add to processed list
            processedNotifications.add(notificationId);

            // Keep the set size manageable
            if (processedNotifications.size > 50) {
                const iterator = processedNotifications.values();
                processedNotifications.delete(iterator.next().value);
            }

            // Skip if payload is missing or has no notification
            if (!payload || !payload.notification) {
                console.log("Invalid notification payload:", payload);
                return;
            }

            const notificationTitle =
                payload.notification.title || "New Notification";
            const notificationOptions = {
                body: payload.notification.body || "",
                icon: payload.notification.image || "/icon.png",
                data: payload.data || {},
                tag: notificationId, // Use a tag to prevent duplicate notifications
                requireInteraction: true, // Keep notification visible until user interaction
            };

            // Check if notification is supported
            if (!("Notification" in window)) {
                console.error("Notifications not supported in this browser");
                return;
            }

            // Ensure permission is granted
            if (Notification.permission === "granted") {
                // Try to create notification with retry
                showNotificationWithRetry(
                    notificationTitle,
                    notificationOptions,
                    payload
                );
            } else if (Notification.permission !== "denied") {
                // If permission isn't explicitly denied, we can ask
                Notification.requestPermission().then((permission) => {
                    if (permission === "granted") {
                        showNotificationWithRetry(
                            notificationTitle,
                            notificationOptions,
                            payload
                        );
                    }
                });
            } else {
                console.log("Notification permission denied");
            }
        };

        // Function to show notification with retry logic
        const showNotificationWithRetry = (
            title,
            options,
            payload,
            retryCount = 0
        ) => {
            try {
                // Create a notification using the Notification API
                const notification = new Notification(title, options);

                // Handle notification click
                notification.onclick = function (event) {
                    event.preventDefault();

                    // Try to find a URL to open
                    const url =
                        payload.notification.click_action ||
                        payload.data?.url ||
                        "/";

                    window.open(url, "_blank");
                    notification.close();
                };

                console.log(
                    "Notification displayed successfully using Notification API"
                );

                // This helps ensure the notification is visible
                setTimeout(() => {
                    if (notification.onshow) {
                        notification.onshow();
                    }
                }, 200);
            } catch (error) {
                console.error("Error showing notification:", error);

                // Retry with fallback to service worker if available
                if (retryCount < 1 && "serviceWorker" in navigator) {
                    console.log("Retrying with service worker...");
                    navigator.serviceWorker.ready.then((registration) => {
                        registration
                            .showNotification(title, options)
                            .then(() =>
                                console.log(
                                    "Notification shown via service worker"
                                )
                            )
                            .catch((err) =>
                                console.error(
                                    "Service worker notification failed:",
                                    err
                                )
                            );
                    });
                } else if (retryCount < 2) {
                    // One more retry with slight delay
                    console.log("Retrying notification display...");
                    setTimeout(() => {
                        showNotificationWithRetry(
                            title,
                            options,
                            payload,
                            retryCount + 1
                        );
                    }, 500);
                }
            }
        };

        // Set up token monitor
        const monitorToken = () => {
            let previousToken = "";

            // Function to check and update token
            const checkToken = async () => {
                try {
                    // Use user from auth context instead of localStorage
                    if (user && user.userId) {
                        const newToken = await getToken(messaging, {
                            vapidKey:
                                "BCvYXQyZYBeIGBVt5-H2LzA7WtuULcGmX2NH5RnKn3F0BOr-Hd9h4xPczBJiliGDS2zv1jHAy0mJZc3wEZkXOCY",
                        });

                        // If we have a new token and it's different from previous
                        if (newToken && newToken !== previousToken) {
                            previousToken = newToken;

                            // If token changed from what's stored for the user
                            if (newToken !== user.details.fcm_token) {
                                await updateModeratorFcmToken(
                                    user.userId,
                                    newToken
                                );
                                console.log("FCM token updated");
                            }
                        }
                    }
                } catch (error) {
                    console.error("Error checking token:", error);
                }
            };

            // Initial check
            checkToken();

            // Setup periodic token check (every 24 hours)
            const tokenCheckInterval = setInterval(
                checkToken,
                24 * 60 * 60 * 1000
            );

            // Listen for messaging visibility change
            const visibilityHandler = () => {
                if (document.visibilityState === "visible") {
                    checkToken();
                }
            };

            document.addEventListener("visibilitychange", visibilityHandler);

            return () => {
                clearInterval(tokenCheckInterval);
                document.removeEventListener(
                    "visibilitychange",
                    visibilityHandler
                );
            };
        };

        // Only run if user is authenticated
        if (user) {
            // Request permission and token
            requestPermissionAndToken();

            // Set up message listener
            const unsubscribeMessage = onMessage(
                messaging,
                handleForegroundMessage
            );

            // Setup token monitoring
            const cleanupTokenMonitor = monitorToken();

            // Cleanup subscriptions when component unmounts
            return () => {
                unsubscribeMessage();
                cleanupTokenMonitor();
                // Clear the processed notifications set
                processedNotifications.clear();
            };
        }
    }, [user]);

    // Display loading state
    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Loading dashboard data...</p>
            </div>
        );
    }

    // Display error state
    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">
                    <p>Error: {error}</p>
                    <button
                        className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard Overview
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Get a bird's eye view of your marketplace performance
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {dashboardData &&
                        dynamicStats.map((stat) => (
                            <div
                                key={stat.id}
                                onClick={() =>
                                    stat.route && navigate(stat.route)
                                }
                                className={`${
                                    stat.bgColor
                                } rounded-xl p-6 shadow-sm hover:shadow-md 
                                      transition-all duration-200 transform hover:-translate-y-1 
                                      ${stat.route ? "cursor-pointer" : ""}`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`p-3 rounded-lg ${stat.iconBgColor}`}
                                    >
                                        <span className={stat.iconColor}>
                                            {getIcon(stat.icon)}
                                        </span>
                                    </div>
                                    {/* Removed the percentage change display as requested */}
                                </div>
                                <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                                    {stat.value}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {stat.title}
                                </p>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

const HomeDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative">
            <NavigationBar
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
            />
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <ContentWrapper isSidebarOpen={isSidebarOpen}>
                <DashboardContent isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
};

export default HomeDashboard;
