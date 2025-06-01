import React, { useState } from "react";
import { useNavigate } from "react-router";
import loginImg from "../assets/login_img.jpg";
import { api } from "./axiosConfig";

const ForgotPasswordScreen = () => {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpVerified, setOtpVerified] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [verificationId, setVerificationId] = useState(""); // Store verification ID
    const navigate = useNavigate();

    const validatePhoneNumber = (phone) => {
        const phoneRegex = /^\d{10}$/;
        return phoneRegex.test(phone);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");

        if (!validatePhoneNumber(phoneNumber)) {
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        try {
            setLoading(true);
            console.log('Sending OTP request for:', phoneNumber);

            const response = await api.post('/auth/sendOTP/moderator', {
                phone_number: phoneNumber
            });

            console.log('Send OTP Response:', response.data);

            if (response.data && response.data.verificationId) {
                setVerificationId(response.data.verificationId);
                setOtpSent(true);
                setError("");
                console.log('Verification ID received:', response.data.verificationId);
            } else {
                setError("Failed to send OTP. Please try again.");
                console.error('Invalid response format:', response.data);
            }
        } catch (err) {
            console.error("OTP sending failed:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await api.post('/auth/sendOTP/moderator', {
                phone_number: phoneNumber
            });

            if (response.data && response.data.verificationId) {
                setVerificationId(response.data.verificationId);
                setError("OTP resent successfully");
            } else {
                setError("Failed to resend OTP");
            }
        } catch (err) {
            console.error("Resending OTP failed:", err);
            setError(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");

        if (!otp || otp.length !== 4) {
            setError("Please enter a valid 4-digit OTP");
            return;
        }

        try {
            setLoading(true);
            console.log('Verifying OTP with:', {
                phone_number: phoneNumber,
                otp: otp,
                verificationId: verificationId
            });

            const response = await api.post(`/auth/verifyOTP/moderator`, {
                phone_number: phoneNumber,
                otp: otp,
                verificationId: verificationId
            });

            console.log('Verify OTP Response:', response.data);

            if (response.data && response.data.status) {
                setOtpVerified(true);
                setError("");
                console.log('OTP verified successfully');
            } else {
                setError("Invalid OTP. Please try again.");
                console.error('Verification failed:', response.data);
            }
        } catch (err) {
            console.error("OTP verification failed:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.message || "Failed to verify OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitNewPassword = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);
            console.log('Updating password for:', phoneNumber);

            const response = await api.post('/auth/updatePassword', {
                password: newPassword,
                phone_number: phoneNumber,
                verificationId: verificationId
            });

            console.log('Update Password Response:', response.data);

            if (response.data && response.data.success) {
                console.log('Password updated successfully');
                alert("Password updated successfully!");
                navigate("/login");
            } else {
                setError("Failed to update password");
                console.error('Update failed:', response.data);
            }
        } catch (err) {
            console.error("Password update failed:", err);
            console.error("Error response:", err.response?.data);
            setError(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    // Add error message display
    const ErrorMessage = ({ message }) => {
        if (!message) return null;
        return (
            <div className="text-red-500 text-sm mt-2">
                {message}
            </div>
        );
    };

    // Update the phone number input to restrict to 10 digits
    const handlePhoneNumberChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(value);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-7xl bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl overflow-hidden">
                {/* Form Side */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
                    <div className="w-full max-w-md space-y-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Forgot Password?
                            </h1>
                            <p className="mt-3 text-gray-500">
                                {otpVerified
                                    ? "Enter your new password below."
                                    : otpSent
                                        ? "Enter the OTP sent to your mobile number."
                                        : "Enter your registered mobile number to receive an OTP."}
                            </p>
                        </div>

                        {/* Form */}
                        {!otpVerified ? (
                            <form
                                onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
                                className="space-y-6 mt-8"
                            >
                                <div>
                                    <label
                                        htmlFor="phoneNumber"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Mobile Number
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="phoneNumber"
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={handlePhoneNumberChange}
                                            placeholder="Enter 10-digit mobile number"
                                            maxLength="10"
                                            pattern="\d{10}"
                                            className="block w-full px-4 py-3 rounded-xl border border-gray-200 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 transition-colors bg-gray-50 hover:bg-gray-100 focus:bg-white"
                                            disabled={otpSent || loading}
                                            required
                                        />
                                    </div>
                                </div>

                                {otpSent && (
                                    <>
                                        <div className="space-y-1">
                                            <label
                                                htmlFor="otp"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                OTP
                                            </label>
                                            <input
                                                id="otp"
                                                type="text"
                                                value={otp}
                                                onChange={(e) =>
                                                    setOtp(e.target.value)
                                                }
                                                placeholder="Enter the OTP"
                                                className="block w-full px-4 py-3 rounded-xl border border-gray-200 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 transition-colors bg-gray-50 hover:bg-gray-100 focus:bg-white"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                        >
                                            Resend OTP
                                        </button>
                                    </>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex justify-center py-3 px-4 border border-transparent 
                                             rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 
                                             to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                             focus:outline-none focus:ring-2 focus:ring-offset-2 
                                             focus:ring-blue-500 transition-all duration-200 transform 
                                             hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold
                                             ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Processing...' : otpSent ? "Verify OTP" : "Send OTP"}
                                    </button>
                                </div>
                                <ErrorMessage message={error} />
                            </form>
                        ) : (
                            <form
                                onSubmit={handleSubmitNewPassword}
                                className="space-y-6 mt-8"
                            >
                                <div>
                                    <label
                                        htmlFor="newPassword"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Create New Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="newPassword"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) =>
                                                setNewPassword(e.target.value)
                                            }
                                            placeholder="Enter new password"
                                            className="block w-full px-4 py-3 rounded-xl border border-gray-200 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 transition-colors bg-gray-50 hover:bg-gray-100 focus:bg-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Confirm New Password
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Confirm new password"
                                            className="block w-full px-4 py-3 rounded-xl border border-gray-200 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 transition-colors bg-gray-50 hover:bg-gray-100 focus:bg-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`w-full flex justify-center py-3 px-4 border border-transparent 
                                             rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 
                                             to-blue-700 hover:from-blue-700 hover:to-blue-800 
                                             focus:outline-none focus:ring-2 focus:ring-offset-2 
                                             focus:ring-blue-500 transition-all duration-200 transform 
                                             hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold
                                             ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {loading ? 'Processing...' : "Submit"}
                                    </button>
                                </div>
                                <ErrorMessage message={error} />
                            </form>
                        )}

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>

                {/* Image Side */}
                <div className="hidden lg:block w-1/2 relative">
                    <div className="absolute inset-0 transition-transform duration-300 hover:scale-105">
                        <img
                            src={loginImg}
                            alt="Login visual"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordScreen;
