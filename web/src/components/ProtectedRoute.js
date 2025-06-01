import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/authContext";

export const ProtectedRoute = ({ children, requiredRoles = [] }) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>; // Or your loading component
    }

    if (!isAuthenticated) {
        // Redirect to login and save the attempted URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has required roles (if any specified)
    if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        console.log(user.role + " is not allowed");
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

// export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
//     const { user } = useAuth();
//     const location = useLocation();

//     if (!user) {
//         return <Navigate to="/login" state={{ from: location }} replace />;
//     }

//     if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
//         return <Navigate to="/unauthorized" replace />;
//     }

//     return children;
// };
