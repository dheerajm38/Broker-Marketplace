import React, { useState } from "react";
import { useNavigate } from "react-router";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { PenSquare } from "lucide-react";
import { registerBuyerOrSeller } from "../utils/buyerApi";
import { useAuth } from "../contexts/authContext";
import ContentWrapper from "./layout/ContentWrapper";

const OnboardSeller = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("basic-info");
    const [formData, setFormData] = useState({
        fullName: "",
        mobile: "",
        companyName: "",
        companyAddress: "",
        pan: "",
        gst: "",
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

    const validateGST = (gst) => {
        // GST format: 2 digits state code + 10 digits PAN + 1 digit entity number + 1 digit check digit + Z
        const regex =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gst);
    };

    const handleGstChange = (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

        // Limit GST to 15 characters (Indian GST format)
        if (value.length > 15) {
            value = value.slice(0, 15);
        }

        setFormData((prev) => ({
            ...prev,
            gst: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.mobile.length !== 10) {
            alert("Mobile number must be exactly 10 digits");
            return;
        }

        // Validate GST
        if (formData.gst && !validateGST(formData.gst)) {
            alert(
                "Please enter a valid GST number in the format: 22ABCDE1234F1Z5"
            );
            return;
        }
        try {
            const role = "seller";
            const formattedData = {
                personal_details: {
                    fullName: formData.fullName,
                    // You can add other fields like date_of_birth and pan_number if necessary
                },
                contact_details: {
                    phone_number: formData.mobile, // or pan_number if required
                    // email: formData.email, // Add email if available
                },
                company_details: {
                    company_name: formData.companyName,
                    gst_number: formData.gst,
                    company_address: {
                        street: formData.street,
                        city: formData.city,
                        state: formData.state,
                        zip_code: formData.zipCode,
                    },
                },
                role: role, // Set role (buyer or seller)
                created_by: user.role, // Replace with the actual user who is creating this data
                assigned_operator: "", // For seller, this has to be empty
            };
            console.log(formattedData);
            const response = await registerBuyerOrSeller(role, formattedData);
            navigate("/sellers");
        } catch (error) {
            alert(
                "Error Occurred - not able to save: " +
                    error.response.data.message
            );
            console.error("Error during registration:", error);
        }
        // navigate("/buyers");
    };

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {[{ id: "basic-info", label: "Basic Info" }].map(
                            (tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        activeTab === tab.id
                                            ? "bg-white shadow-sm text-black"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Form */}
                {activeTab === "basic-info" && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
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
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Company name
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="ABC Corp"
                                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        GST
                                    </label>
                                    <input
                                        type="text"
                                        name="gst"
                                        value={formData.gst}
                                        onChange={handleGstChange}
                                        placeholder="22ABCDE1234F1Z5"
                                        maxLength="15"
                                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        required
                                    />
                                    {formData.gst.length > 0 &&
                                        !validateGST(formData.gst) && (
                                            <p className="mt-1 text-sm text-red-600">
                                                Please enter a valid GST number
                                                (15 characters)
                                            </p>
                                        )}
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    Address Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Street Address
                                        </label>
                                        <input
                                            type="text"
                                            name="street"
                                            value={formData.street}
                                            onChange={handleChange}
                                            placeholder="123, Main Street"
                                            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            placeholder="Mumbai"
                                            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            State
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleChange}
                                            placeholder="Maharashtra"
                                            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            ZIP Code
                                        </label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleChange}
                                            placeholder="400001"
                                            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
                                >
                                    Add Seller
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function OnboardSellerScreen() {
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
                <OnboardSeller isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
