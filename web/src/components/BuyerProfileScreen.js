import React, { useState, useEffect } from "react";
import { PenSquare, MessageCircle, X } from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import ContentWrapper from "./layout/ContentWrapper";
import { OrderHistory } from "./OrderHistoryScreen";
import { InterestedProducts } from "./InterestedProductsScreen";
import { useLocation } from "react-router";
import { api } from "./axiosConfig";

const BuyerProfile = ({ isSidebarOpen }) => {
    const location = useLocation();
    const { buyerId } = location.state || {};
    // const buyerId = id;
    // console.log(`buyerId: ${buyerId}`);
    const [activeTab, setActiveTab] = useState("buyer-details");
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = React.useState(false);
    const [error, setError] = useState(null);
    const [buyerData, setBuyerData] = useState(null);
    const [formData, setFormData] = React.useState({
        fullName: buyerData?.name || "",
        companyName: buyerData?.company || "",
        gst: buyerData?.gst || "",
        mobile: buyerData?.mobile || "",
        street: buyerData?.company_details?.company_address?.street || "",
        city: buyerData?.company_details?.company_address?.city || "",
        state: buyerData?.company_details?.company_address?.state || "",
        zipCode: buyerData?.company_details?.company_address?.pin_code || "",
    });
    const [tempFormData, setTempFormData] = useState({ ...formData });
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    useEffect(() => {
        async function fetchBuyerDetails() {
            // console.log(buyerData);
            if (buyerId) {
                try {
                    setLoading(true);
                    // console.log("Fetching buyer details for ID:", buyerId);
                    const response = await api.get(`/user/${buyerId}`);
                    // console.log("Buyer API Response:", response.data);

                    if (response.data && response.data.data) {
                        const buyer = response.data.data;
                        setBuyerData(buyer);
                        const initialFormData = {
                            fullName: buyer.personal_details?.fullName || "",
                            companyName:
                                buyer.company_details?.company_name || "",
                            gst: buyer.company_details?.gst_number || "",
                            mobile: buyer.contact_details?.phone_number || "",
                            street:
                                buyer.company_details?.company_address
                                    ?.street || "",
                            city:
                                buyer.company_details?.company_address?.city ||
                                "",
                            state:
                                buyer.company_details?.company_address?.state ||
                                "",
                            zipCode:
                                buyer.company_details?.company_address
                                    ?.zip_code || "",
                        };
                        setFormData(initialFormData);
                        setTempFormData(initialFormData); // Initialize temp data with the same values
                        setError(null);
                    } else {
                        throw new Error(
                            response.data.message ||
                                "Failed to fetch buyer details"
                        );
                    }
                } catch (err) {
                    console.error("Error fetching buyer:", err);
                    setError("Failed to load buyer details");
                } finally {
                    setLoading(false);
                }

                // const initialFormData = {
                //     fullName: buyerData?.name || "",
                //     companyName: buyerData?.company || "",
                //     gst: buyerData?.gst || "",
                //     mobile: buyerData?.mobile || "",
                //     street:
                //         buyerData?.company_details?.company_address?.street || "",
                //     city: buyerData?.company_details?.company_address?.city || "",
                //     state: buyerData?.company_details?.company_address?.state || "",
                //     zipCode:
                //         buyerData?.company_details?.company_address?.pin_code || "",
                // };
                // setFormData(initialFormData);
                // setTempFormData(initialFormData);
                // setError(null);
            } else {
                setError("No buyer ID provided");
                setLoading(false);
            }
        }
        fetchBuyerDetails();
    }, [buyerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Input validation based on field type
        switch (name) {
            case "mobile":
                // Allow only digits for mobile
                if (/^\d*$/.test(value)) {
                    setTempFormData({ ...tempFormData, [name]: value });
                }
                break;
            case "gst":
                // Allow only uppercase letters and digits for GST
                if (/^[A-Z0-9]*$/.test(value)) {
                    setTempFormData({ ...tempFormData, [name]: value });
                }
                break;
            case "zipCode":
                // Allow only digits for zip code
                if (/^\d*$/.test(value)) {
                    setTempFormData({ ...tempFormData, [name]: value });
                }
                break;
            default:
                setTempFormData({ ...tempFormData, [name]: value });
        }
    };

    const validateGST = (gst) => {
        // GST format: 2 digits state code + 10 digits PAN + 1 digit entity number + 1 digit check digit + Z
        const regex =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gst);
    };

    const validateForm = () => {
        // Mobile validation - should be exactly 10 digits
        if (!/^\d{10}$/.test(tempFormData.mobile)) {
            setModalMessage("Mobile number must be exactly 10 digits");
            setShowModal(true);
            return false;
        }

        // GST validation
        if (tempFormData.gst && !validateGST(tempFormData.gst)) {
            setModalMessage("Invalid GST number format");
            setShowModal(true);
            return false;
        }

        // ZIP Code validation - should be exactly 6 digits
        if (!/^\d{6}$/.test(tempFormData.zipCode)) {
            setModalMessage("ZIP Code must be exactly 6 digits");
            setShowModal(true);
            return false;
        }

        return true;
    };

    const handleSave = async () => {
        // Validate form before submitting
        if (!validateForm()) {
            return;
        }

        try {
            const updateData = {
                personal_details: {
                    fullName: tempFormData.fullName,
                },
                contact_details: {
                    phone_number: tempFormData.mobile,
                },
                company_details: {
                    company_name: tempFormData.companyName,
                    gst_number: tempFormData.gst,
                    company_address: {
                        street: tempFormData.street,
                        city: tempFormData.city,
                        state: tempFormData.state,
                        zip_code: tempFormData.zipCode,
                    },
                },
            };

            // console.log("BuyerData: " + buyerData);

            const response = await api.put(`/user/${buyerId}`, updateData);

            if (response.data.success) {
                setBuyerData(response.data.data);
                // Update the main formData with the temporary values
                setFormData({ ...tempFormData });
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update buyer details:", error);
            setModalMessage("Failed to update buyer details");
            setShowModal(true);
        }
    };

    const handleEdit = () => {
        // Reset tempFormData to current formData when entering edit mode
        setTempFormData({ ...formData });
        setIsEditing(true);
    };

    const handleCancel = () => {
        // Discard changes by not updating formData and just exit edit mode
        setTempFormData({ ...formData }); // Reset temp data to original
        setIsEditing(false);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalMessage("");
    };

    const containerClass = `transition-all duration-300 ease-in-out 
    ${isSidebarOpen ? "ml-64" : "ml-0"}
    mt-16 p-6`;

    const inputClassName = (isEditing) =>
        `mt-1 block w-full px-3 py-2 rounded-md text-gray-900 transition-all duration-200 ${
            isEditing
                ? "bg-white border-2 border-blue-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                : "bg-gray-50 border border-gray-200 focus:outline-none cursor-default"
        }`;

    const labelClassName = (isEditing) =>
        `text-sm font-medium transition-colors duration-200 ${
            isEditing ? "text-blue-600" : "text-gray-700"
        }`;

    const Modal = ({ show, message, onClose }) => {
        if (!show) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-red-600">
                            Validation Error
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700">{message}</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!buyerData) {
        return (
            <div className={containerClass}>
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <p className="text-gray-500">
                            No buyer data available.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-600">
                            Loading buyer details...
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-red-600">{error}</div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {[
                                    "buyer-details",
                                    "interested-products",
                                    "order-history",
                                ].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-md transition-colors ${
                                            activeTab === tab
                                                ? "bg-white shadow-sm text-black"
                                                : "text-gray-600 hover:text-gray-900"
                                        }`}
                                    >
                                        {tab
                                            .split("-")
                                            .map(
                                                (word) =>
                                                    word
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    word.slice(1)
                                            )
                                            .join(" ")}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={handleEdit}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                                    >
                                        <PenSquare className="h-6 w-6 text-black group-hover:text-blue-600 transition-colors" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group"
                                    >
                                        <X className="h-6 w-6 text-red-600 group-hover:text-red-700 transition-colors" />
                                    </button>
                                )}
                                <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                    <MessageCircle className="h-6 w-6 text-black" />
                                </button>
                            </div>
                        </div>

                        {activeTab === "buyer-details" && (
                            <div
                                className={`grid grid-cols-1 md:grid-cols-2 gap-6 relative ${
                                    isEditing ? "editing-mode" : ""
                                }`}
                            >
                                {isEditing && (
                                    <div className="absolute -top-4 left-0 right-0 bg-blue-50 text-blue-700 py-2 px-4 rounded-t-lg text-sm flex items-center justify-center">
                                        <PenSquare className="h-4 w-4 mr-2" />
                                        Editing Mode - Make changes to the
                                        fields below
                                    </div>
                                )}
                                <div
                                    className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ${
                                        isEditing ? "ring-2 ring-blue-100" : ""
                                    }`}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                className={labelClassName(
                                                    isEditing
                                                )}
                                            >
                                                Full name
                                            </label>
                                            <input
                                                type="text"
                                                name="fullName"
                                                value={
                                                    isEditing
                                                        ? tempFormData.fullName
                                                        : formData.fullName
                                                }
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className={labelClassName(
                                                    isEditing
                                                )}
                                            >
                                                Company name
                                            </label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                value={
                                                    isEditing
                                                        ? tempFormData.companyName
                                                        : formData.companyName
                                                }
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                className={labelClassName(
                                                    isEditing
                                                )}
                                            >
                                                GST
                                            </label>
                                            <input
                                                type="text"
                                                name="gst"
                                                value={
                                                    isEditing
                                                        ? tempFormData.gst
                                                        : formData.gst
                                                }
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                            />
                                            {isEditing && (
                                                <p className="text-xs text-gray-500 mt-1"></p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ${
                                        isEditing ? "ring-2 ring-blue-100" : ""
                                    }`}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                className={labelClassName(
                                                    isEditing
                                                )}
                                            >
                                                Mobile number
                                            </label>
                                            <input
                                                type="text"
                                                name="mobile"
                                                value={
                                                    isEditing
                                                        ? tempFormData.mobile
                                                        : formData.mobile
                                                }
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <h3
                                                className={labelClassName(
                                                    isEditing
                                                )}
                                            >
                                                Company Address
                                            </h3>
                                            <div>
                                                <label
                                                    className={labelClassName(
                                                        isEditing
                                                    )}
                                                >
                                                    Street
                                                </label>
                                                <input
                                                    type="text"
                                                    name="street"
                                                    value={
                                                        isEditing
                                                            ? tempFormData.street
                                                            : formData.street
                                                    }
                                                    onChange={handleChange}
                                                    readOnly={!isEditing}
                                                    className={inputClassName(
                                                        isEditing
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label
                                                        className={labelClassName(
                                                            isEditing
                                                        )}
                                                    >
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="city"
                                                        value={
                                                            isEditing
                                                                ? tempFormData.city
                                                                : formData.city
                                                        }
                                                        onChange={handleChange}
                                                        readOnly={!isEditing}
                                                        className={inputClassName(
                                                            isEditing
                                                        )}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className={labelClassName(
                                                            isEditing
                                                        )}
                                                    >
                                                        State
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="state"
                                                        value={
                                                            isEditing
                                                                ? tempFormData.state
                                                                : formData.state
                                                        }
                                                        onChange={handleChange}
                                                        readOnly={!isEditing}
                                                        className={inputClassName(
                                                            isEditing
                                                        )}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className={labelClassName(
                                                            isEditing
                                                        )}
                                                    >
                                                        ZIP Code
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="zipCode"
                                                        value={
                                                            isEditing
                                                                ? tempFormData.zipCode
                                                                : formData.zipCode
                                                        }
                                                        onChange={handleChange}
                                                        readOnly={!isEditing}
                                                        className={inputClassName(
                                                            isEditing
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="md:col-span-2 flex justify-end space-x-3">
                                        <button
                                            onClick={handleCancel}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <Modal
                            show={showModal}
                            message={modalMessage}
                            onClose={closeModal}
                        />

                        {activeTab === "interested-products" && (
                            <InterestedProducts buyerData={buyerData} />
                        )}
                        {activeTab === "order-history" && (
                            <OrderHistory buyerData={buyerData} />
                        )}
                    </>
                )}
            </div>
            <Modal
                show={showModal}
                message={modalMessage}
                onClose={closeModal}
            />
        </div>
    );
};

export default function BuyerProfileScreen() {
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
                <BuyerProfile isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
