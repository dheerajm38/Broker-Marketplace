import React, { useState, useEffect } from "react";
import { PenSquare, X } from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import { useLocation } from "react-router";
import { useNavigate } from "react-router";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from "./axiosConfig"; // Import the configured axios instance

const TicketInfo = ({ isSidebarOpen }) => {
    const location = useLocation();
    const { ticketData } = location.state || {};
    const [isEditing, setIsEditing] = useState(false);

    // Initialize formData with default values
    const [formData, setFormData] = useState({
        ticketId: "",
        title: "",
        status: "",
        description: "",
        createdAt: "",
        buyerDetails: {
            companyName: "",
            city: "",
            buyerName: "",
            contactNumber: "",
        },
        sellerDetails: {
            companyName: "",
            city: "",
            sellerName: "",
            contactNumber: "",
        },
        productId: "",
        productName: "",
        priceDetails: {
            unit: "",
            quantity: 0,
        },
        price: 0,
        resolveTimestamp: null,
    });

    // Function to fetch ticket details
    const fetchTicketDetails = async (ticketId) => {
        try {
            const response = await api.get(`/ticket/${ticketId}`);
            if (response.data.success) {
                setFormData({
                    ticketId: response.data.data?.ticket_id,
                    title: response.data.data?.title,
                    status: response.data.data?.status,
                    description: response.data.data?.description,
                    createdAt: response.data.data?.createdAt,
                    buyerDetails: {
                        companyName:
                            response.data.data?.buyer_details?.company_name,
                        city: response.data.data?.buyer_details?.city,
                        buyerName:
                            response.data.data?.buyer_details?.buyer_name,
                        contactNumber:
                            response.data.data?.buyer_details
                                ?.buyer_contact_number,
                    },
                    sellerDetails: {
                        companyName:
                            response.data.data?.seller_details?.company_name,
                        city: response.data.data?.seller_details?.city,
                        sellerName:
                            response.data.data?.seller_details?.seller_name,
                        contactNumber:
                            response.data.data?.seller_details
                                ?.seller_contact_number,
                    },
                    productId: response.data.data?.product_id,
                    productName: response.data.data?.product_name,
                    priceDetails: {
                        unit: response.data.data?.price_details?.unit,
                        quantity: response.data.data?.price_details?.quantity,
                    },
                    price: response.data.data?.price,
                    resolveTimestamp: response.data.data?.resolve_timestamp,
                });
            }
        } catch (error) {
            console.error("Error fetching ticket details:", error);
        }
    };

    // Initial fetch on component mount
    useEffect(() => {
        if (ticketData?.id) {
            fetchTicketDetails(ticketData.id);
        }
    }, [ticketData]);

    // Add state to track modified fields
    const [modifiedFields, setModifiedFields] = useState(new Set());

    // Update handleChange to track modified fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setModifiedFields((prev) => new Set(prev).add(name));
    };

    // Update handleSave to use different API endpoints based on modified fields
    const handleSave = async () => {
        try {
            const modifiedData = Array.from(modifiedFields).reduce(
                (acc, field) => {
                    acc[field] = formData[field];
                    return acc;
                },
                {}
            );

            let response;

            // If only status is modified, use the status update endpoint
            if (modifiedFields.size === 1 && modifiedFields.has("status")) {
                response = await api.put(
                    `/ticket/${formData.ticketId}/status`,
                    {
                        status: formData.status,
                        description: formData.description,
                    }
                );
            } else {
                // Use the general update endpoint for other field combinations
                response = await api.put(
                    `/ticket/${formData.ticketId}`,
                    modifiedData
                );
            }

            if (response.data.success) {
                // Update local state with response data
                setFormData((prev) => ({
                    ...prev,
                    ...response.data.data,
                }));

                // Clear modified fields
                setModifiedFields(new Set());

                // Show success alert
                // alert('Ticket updated successfully');

                // Exit edit mode
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
            alert(
                "Failed to update ticket: " +
                    (error.response?.data?.message || error.message)
            );
        }
    };

    // Add confirmation before saving
    const handleSaveClick = () => {
        if (modifiedFields.size === 0) {
            alert("No changes to save");
            return;
        }

        handleSave();
    };

    // Add editableFields array to specify which fields can be edited
    const editableFields = ["status", "description"];

    // Update the input field class based on whether it's editable
    const getInputClass = (fieldName) => {
        const baseClass = "mt-1 block w-full px-3 py-2 border rounded-md";
        if (isEditing && editableFields.includes(fieldName)) {
            return `${baseClass} border-2 border-blue-500 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500`;
        }
        return `${baseClass} bg-gray-50 border-gray-200`;
    };

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Ticket Details
                    </h2>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        {isEditing ? (
                            <>
                                <X size={20} />
                                <span>Cancel</span>
                            </>
                        ) : (
                            <>
                                <PenSquare size={20} />
                                <span>Edit</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        {/* Basic Info Section */}
                        <h3 className="text-lg font-semibold mb-4">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Ticket ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.ticketId}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className={getInputClass("status")}
                                >
                                    <option value="Acknowledged_by_Operator">
                                        Acknowledge
                                    </option>
                                    <option value="InProgress">
                                        In Progress
                                    </option>
                                    <option value="Deal_Complete">
                                        Complete
                                    </option>
                                    <option value="Deal_Cancel">Cancel</option>
                                </select>
                            </div>
                        </div>

                        {/* Buyer Details Section */}
                        <h3 className="text-lg font-semibold mb-4 mt-6">
                            Buyer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.buyerDetails.companyName}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.buyerDetails.city}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Buyer Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.buyerDetails.buyerName}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.buyerDetails.contactNumber}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Seller Details Section */}
                        <h3 className="text-lg font-semibold mb-4 mt-6">
                            Seller Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.sellerDetails.companyName}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    City
                                </label>
                                <input
                                    type="text"
                                    value={formData.sellerDetails.city}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Seller Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.sellerDetails.sellerName}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Contact Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.sellerDetails.contactNumber}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Product Details Section */}
                        <h3 className="text-lg font-semibold mb-4 mt-6">
                            Product Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Product ID
                                </label>
                                <input
                                    type="text"
                                    value={formData.productId}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div> */}
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.productName}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Unit
                                </label>
                                <input
                                    type="text"
                                    value={formData.priceDetails.unit}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={formData.priceDetails.quantity}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    value={formData.price}
                                    readOnly
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                />
                            </div>
                        </div>

                        {/* Additional Details */}
                        <h3 className="text-lg font-semibold mb-4 mt-6">
                            Additional Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    readOnly={!isEditing}
                                    rows={4}
                                    className={getInputClass("description")}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Created At
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.createdAt}
                                        readOnly
                                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                    />
                                </div>
                                {formData.resolveTimestamp && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">
                                            Resolved At
                                        </label>
                                        <input
                                            type="text"
                                            value={new Date(
                                                formData.resolveTimestamp
                                            ).toLocaleString()}
                                            readOnly
                                            className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveClick}
                                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function TicketInfoScreen() {
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
                <TicketInfo isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
