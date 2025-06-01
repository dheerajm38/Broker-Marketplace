import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/authContext"; // Adjust the import path if needed

export default function SignOut() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            await logout(); // Ensure you await logout if it's an async operation
            navigate("/login"); // Redirect to /login after logout
        };

        performLogout(); // Trigger the logout and redirect process
    }, [logout, navigate]); // Only re-run when logout or navigate change

    return null; // Return nothing because the redirection happens after logout
}
