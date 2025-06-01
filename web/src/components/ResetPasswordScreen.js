import React, { useState } from "react";
import loginImg from "../assets/login_img.jpg";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = ({ isSidebarOpen }) => {
    const [passwords, setPasswords] = useState({
        password: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        password: false,
        confirmPassword: false,
    });
    const [error, setError] = useState("");

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError("");
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (passwords.password !== passwords.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (passwords.password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        try {
            const response = await axios.post(
                "/user/reset-password",
                { newPassword: passwords.password },
                { withCredentials: true }
            );
            console.log("Password reset successful:", response.data);
        } catch (err) {
            console.error("Password reset failed:", err);
            setError("Failed to reset password. Please try again.");
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="container">
                <div className="form-side">
                    <div className="form-wrapper">
                        <div className="header">
                            <h1>Reset Password</h1>
                            <p>Please enter your new password below.</p>
                        </div>

                        <form onSubmit={handleResetPassword} className="form">
                            <div className="input-group">
                                <label htmlFor="password" className="label">
                                    New Password
                                </label>
                                <div
                                    className="password-input-wrapper"
                                    style={{ position: "relative" }}
                                >
                                    <input
                                        id="password"
                                        type={
                                            showPasswords.password
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        value={passwords.password}
                                        onChange={handlePasswordChange}
                                        placeholder="Enter your new password"
                                        className="input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            togglePasswordVisibility("password")
                                        }
                                        className="eye-button"
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {showPasswords.password ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="input-group">
                                <label
                                    htmlFor="confirmPassword"
                                    className="label"
                                >
                                    Confirm Password
                                </label>
                                <div
                                    className="password-input-wrapper"
                                    style={{ position: "relative" }}
                                >
                                    <input
                                        id="confirmPassword"
                                        type={
                                            showPasswords.confirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        value={passwords.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm your new password"
                                        className="input"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            togglePasswordVisibility(
                                                "confirmPassword"
                                            )
                                        }
                                        className="eye-button"
                                        style={{
                                            position: "absolute",
                                            right: "10px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {showPasswords.confirmPassword ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div
                                    className="error-message"
                                    style={{
                                        color: "red",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <button type="submit" className="action-button">
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>

                <div className="image-side">
                    <img
                        src={loginImg}
                        alt="Monstera plant leaves"
                        className="background-image"
                    />
                </div>
            </div>
        </div>
    );
};

export default function ResetPasswordScreen() {
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
                <ResetPassword isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
