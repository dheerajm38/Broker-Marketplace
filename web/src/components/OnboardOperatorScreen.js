import React, { useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { Eye, EyeOff } from "lucide-react";
import { api } from "./axiosConfig";
import { useAuth } from "../contexts/authContext";
import ContentWrapper from "./layout/ContentWrapper";

const OnboardOperator = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("basic-info");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        mobile: "",
        email: "",
        password: "",
        role: "Operator", // Default role
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Handle mobile number validation
        if (name === "mobile") {
            // Only allow digits and limit to 10 characters
            const digitValue = value.replace(/\D/g, "").slice(0, 10);
            setFormData({
                ...formData,
                [name]: digitValue,
            });
            return;
        }

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate mobile number
        if (formData.mobile.length !== 10) {
            alert("Mobile number must be exactly 10 digits");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // ... rest of your existing code
        } catch (error) {
            // ... existing error handling
        } finally {
            setLoading(false);
        }
    };

    const containerClass = `transition-all duration-300 ease-in-out 
        ${isSidebarOpen ? "ml-64" : "ml-0"}
        mt-16 p-6`;

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Full name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Ramesh Kumar"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Mobile number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="9876543210"
                                    pattern="[0-9]{10}"
                                    maxLength="10"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                                {formData.mobile.length > 0 &&
                                    formData.mobile.length < 10 && (
                                        <p className="mt-1 text-sm text-red-600">
                                            Mobile number must be 10 digits
                                        </p>
                                    )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="rameshftw@gmail.com"
                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Role
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                required
                            >
                                <option value="Operator">Operator</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200 ${
                                    loading
                                        ? "opacity-70 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {loading
                                    ? "Adding Operator..."
                                    : "Add Operator"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function OnboardOperatorScreen() {
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
                <OnboardOperator isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
