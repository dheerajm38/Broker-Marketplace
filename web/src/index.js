import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Navigate } from "react-router";
// import Sidebar from "./components/Sidebar";
import LoginScreen from "./components/LoginScreen";
import ForgotPassword from "./components/ForgotPasswordScreen";
import HomeDashboard from "./components/HomeDashboard";
import MessagesScreen from "./components/MessagesScreen";
//import BuyerProfileScreen from "./components/BuyerProfileScreen";
import BuyersDashboardScreen from "./components/BuyersDashboardScreen";
import SellerProfileScreen from "./components/SellerProfileScreen";
import SellersDashboardScreen from "./components/SellersDashboardScreen";
import Settings from "./components/Settings";
import OperatorsDashboardScreen from "./components/OperatorsDashboardScreen";
import OnboardOperatorScreen from "./components/OnboardOperatorScreen";
import BuyerProfileScreen from "./components/BuyerProfileScreen";
import AddSellerProductScreen from "./components/AddSellerProductScreen";
import InterestedProductsScreen from "./components/InterestedProductsScreen";
import OrderHistoryScreen from "./components/OrderHistoryScreen";
import OnboardBuyerScreen from "./components/OnboardBuyerScreen";
import OnboardSellerScreen from "./components/OnboardSellerScreen";
import ProductsScreen from "./components/ProductsScreen";
import ViewProductScreen from "./components/ViewSellerProductScreen";
import TicketingScreen from "./components/TicketingScreen";
import NotificationScreen from "./components/NotificationScreen";
import TicketInfoScreen from "./components/TicketInfoScreen";
import OperatorProfile from "./components/OperatorProfileScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";
import { SocketProvider } from "./contexts/SocketContext";
import { AuthProvider } from "./contexts/authContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SignOut from "./components/SignOut";
import ViewSellerProductScreen from './components/ViewSellerProductScreen';

const router = createBrowserRouter([
    {
        path: "/login",
        element: <LoginScreen />,
    },
    {
        path: "/forgot-password",
        element: <ForgotPassword />,
    },
    {
        path: "/reset-password",
        element: <ResetPasswordScreen />,
    },
    {
        path: "/home",
        element: (
            <ProtectedRoute>
                <HomeDashboard />
            </ProtectedRoute>
        ),
    },
    {
        path: "/operators",
        element: (
            <ProtectedRoute requiredRoles={["Admin"]}>
                <OperatorsDashboardScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/onboard-operator",
        element: (
            <ProtectedRoute requiredRoles={["Admin"]}>
                <OnboardOperatorScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/operator-profile",
        element: (
            <ProtectedRoute requiredRoles={["Admin"]}>
                <OperatorProfile />
            </ProtectedRoute>
        ),
    },
    {
        path: "/products",
        element: (
            <ProtectedRoute>
                <ProductsScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/messages",
        element: (
            <ProtectedRoute>
                <SocketProvider>
                    <MessagesScreen />
                </SocketProvider>
            </ProtectedRoute>
        ),
    },
    {
        path: "/buyers",
        element: (
            <ProtectedRoute>
                <BuyersDashboardScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/buyer-profile",
        element: (
            <ProtectedRoute>
                <BuyerProfileScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/onboard-buyer",
        element: (
            <ProtectedRoute>
                <OnboardBuyerScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/interested-products",
        element: (
            <ProtectedRoute>
                <InterestedProductsScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/orders",
        element: (
            <ProtectedRoute>
                <OrderHistoryScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/sellers",
        element: (
            <ProtectedRoute>
                <SellersDashboardScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/onboard-seller",
        element: (
            <ProtectedRoute>
                <OnboardSellerScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/seller-profile",
        element: (
            <ProtectedRoute>
                <SellerProfileScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/add-seller-product",
        element: (
            <ProtectedRoute>
                <AddSellerProductScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/view-seller-product",
        element: (
            <ProtectedRoute>
                <ViewProductScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/tickets",
        element: (
            <ProtectedRoute>
                <TicketingScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/ticket-info",
        element: (
            <ProtectedRoute>
                <TicketInfoScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/settings",
        element: (
            <ProtectedRoute>
                <Settings />
            </ProtectedRoute>
        ),
    },
    {
        path: "/notifications",
        element: (
            <ProtectedRoute>
                <NotificationScreen />
            </ProtectedRoute>
        ),
    },
    {
        path: "/sign-out",
        element: <SignOut />,
    },
    {
        path: "*",
        element: <h1>404 - Page Not Found</h1>,
    },
    {
        path: "/",
        element: <Navigate to="/login" replace />,
    },
]);

// if (typeof window !== "undefined") {
//     // Check if we're running in the browser.
//     checkAuthToken();
//     loadDataFromLocalStorage();
// }

const App = () => {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
};

// TODO: Don't forget to use strict mode while development
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
