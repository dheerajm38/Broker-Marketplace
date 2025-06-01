import React, { useState, useContext, useEffect } from "react";
import { Save, Lock, User } from "lucide-react";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { useAuth } from "../contexts/authContext";
import { useLocation } from "react-router";
import { api } from "./axiosConfig";
import ContentWrapper from "./layout/ContentWrapper";

const ProfileSection = ({ moderatorId }) => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        role: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchModeratorData = async () => {
            if (!moderatorId) return;

            setIsLoading(true);
            try {
                const response = await api.get(`/moderator/${moderatorId}`);
                const moderatorData = response.data;

                setFormData({
                    name: moderatorData.name || "",
                    email: moderatorData.email || "",
                    phone_number: moderatorData.phone_number || "",
                    role: moderatorData.role || "",
                });
            } catch (error) {
                console.error("Failed to fetch moderator data:", error);
                setSaveError(
                    "Failed to load profile information. Please refresh the page."
                );

                // Clear error message after 3 seconds
                setTimeout(() => {
                    setSaveError("");
                }, 3000);
            } finally {
                setIsLoading(false);
            }
        };

        fetchModeratorData();
    }, [moderatorId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaveSuccess(false);
        setSaveError("");

        try {
            setIsLoading(true);
            await api.put(`/moderator/${moderatorId}`, formData);

            setSaveSuccess(true);
            setIsEditing(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSaveSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setSaveError("Failed to update profile. Please try again.");

            // Clear error message after 3 seconds
            setTimeout(() => {
                setSaveError("");
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <User className="h-5 w-5 mr-2 text-gray-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Profile Information
                        </h2>
                    </div>
                    <button
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => setIsEditing(!isEditing)}
                        disabled={isLoading}
                    >
                        {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                </div>

                {isLoading && (
                    <div className="p-3 mb-4 bg-blue-100 text-blue-700 rounded-md">
                        {isEditing
                            ? "Updating profile..."
                            : "Loading profile data..."}
                    </div>
                )}

                {saveSuccess && (
                    <div className="p-3 mb-4 bg-green-100 text-green-700 rounded-md">
                        Profile updated successfully!
                    </div>
                )}

                {saveError && (
                    <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
                        {saveError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={!isEditing || isLoading}
                                className={`w-full p-2 border rounded-md ${
                                    !isEditing ? "bg-gray-100" : "bg-white"
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={true}
                                className={`w-full p-2 border rounded-md ${
                                    !isEditing ? "bg-gray-100" : "bg-white"
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="text"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                disabled={true}
                                className={`w-full p-2 border rounded-md ${
                                    !isEditing ? "bg-gray-100" : "bg-white"
                                }`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role
                            </label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                disabled={true}
                                className="w-full p-2 border rounded-md bg-gray-100"
                            />
                        </div>
                    </div>

                    {isEditing && (
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                                disabled={isLoading}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

const Settings = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    console.log("user", user);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            {error ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            ) : (
                <ProfileSection moderatorId={user?.details.moderator_id} />
            )}
        </div>
    );
};

export default function SettingsScreen() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

    if (!user) {
        return <div>Loading...</div>;
    }

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
                <Settings />
            </ContentWrapper>
        </div>
    );
}
