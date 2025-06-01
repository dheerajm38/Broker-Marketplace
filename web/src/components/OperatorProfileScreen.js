import React, { useState, useEffect } from "react";
import { PenSquare } from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router";
import { useAuth } from "../contexts/authContext";
import { api } from "./axiosConfig";
import ContentWrapper from "./layout/ContentWrapper";

const MainContent = ({ isSidebarOpen }) => {
    const location = useLocation();
    const { user } = useAuth();
    const { operatorData } = location.state || {};
    const [isEditing, setIsEditing] = useState(false);
    const [mobileError, setMobileError] = useState(""); // ✅ added for error display

    const [formData, setFormData] = useState({
        name: operatorData?.name || "",
        mobile: operatorData?.phone_number || "",
        email: operatorData?.email || "",
        role: operatorData?.role || "",
    });

    useEffect(() => {
        if (operatorData) {
            setFormData({
                name: operatorData?.name || "",
                mobile: operatorData?.phone_number || "",
                email: operatorData?.email || "",
                role: operatorData?.role || "Operator",
            });
        }
    }, [operatorData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "mobile") {
            const digitsOnly = value.replace(/\D/g, ""); // ✅ remove non-digit characters
            setFormData({ ...formData, [name]: digitsOnly });
            setMobileError(""); // ✅ reset error on change
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const validateForm = () => {
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(formData.mobile)) {
            setMobileError("Mobile number must be exactly 10 digits.");
            alert("Mobile number must be exactly 10 digits."); // ✅ modal-like alert
            return false;
        }
        return true;
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!validateForm()) return; // ✅ validation check before saving

        try {
            await api.put(`/moderator/${operatorData.moderator_id}`, {
                name: formData.name,
                email: formData.email,
                phone: formData.mobile,
                role: formData.role,
            });

            setFormData({ ...formData });
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating operator:", err);
            alert("Failed to update operator");
        }
    };

    return (
        <div className="h-full">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Operator Details
                    </h2>
                    <button
                        onClick={handleEdit}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <PenSquare size={20} />
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Full name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                readOnly={!isEditing}
                                className={`mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 ${
                                    isEditing
                                        ? "focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        : "focus:outline-none"
                                }`}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Mobile number
                            </label>
                            <input
                                type="text"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                readOnly={!isEditing}
                                className={`mt-1 block w-full px-3 py-2 bg-gray-50 border ${
                                    mobileError
                                        ? "border-red-500"
                                        : "border-gray-200"
                                } rounded-md text-gray-900 ${
                                    isEditing
                                        ? "focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        : "focus:outline-none"
                                }`}
                            />
                            {mobileError && (
                                <p className="text-red-500 text-sm mt-1">
                                    {mobileError}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                readOnly={true}
                                className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Role
                            </label>
                            {isEditing ? (
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                >
                                    <option value="Operator">Operator</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.role}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none"
                                />
                            )}
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
                            >
                                Save Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function OperatorProfile() {
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
                <MainContent isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
