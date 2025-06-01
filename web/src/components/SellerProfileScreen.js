import React, { useState, useEffect } from "react";
import { Plus, PenSquare, X } from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import ContentWrapper from "./layout/ContentWrapper";
import { useLocation, useNavigate } from "react-router";
import ctCake from "../assets/ct-cake.jpeg";
import ctnCake from "../assets/ctn-cake.jpeg";
import cottonCake from "../assets/cotton-cake-cattle-feed.jpg";
import { api } from "./axiosConfig";

const SellerProfile = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sellerId } = location.state || {};
    const [activeTab, setActiveTab] = useState("details");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [sellerData, setSellerData] = useState(null);
    const [formData, setFormData] = useState({
        fullName: "",
        companyName: "",
        gst: "",
        mobile: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
    });
    // Create a separate state for temporary edits
    const [tempFormData, setTempFormData] = useState({ ...formData });
    const [sellerProducts, setSellerProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [productsError, setProductsError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // Fetch seller details when component mounts
    useEffect(() => {
        const fetchSellerDetails = async () => {
            if (!sellerId) {
                setError("No seller ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("Fetching seller details for ID:", sellerId);
                const response = await api.get(`/user/${sellerId}`);
                console.log("Seller API Response:", response.data);

                if (response.data && response.data.data) {
                    const seller = response.data.data;
                    setSellerData(seller);
                    const initialFormData = {
                        fullName: seller.personal_details?.fullName || "",
                        companyName: seller.company_details?.company_name || "",
                        gst: seller.company_details?.gst_number || "",
                        mobile: seller.contact_details?.phone_number || "",
                        street:
                            seller.company_details?.company_address?.street ||
                            "",
                        city:
                            seller.company_details?.company_address?.city || "",
                        state:
                            seller.company_details?.company_address?.state ||
                            "",
                        zipCode:
                            seller.company_details?.company_address?.zip_code ||
                            "",
                    };
                    setFormData(initialFormData);
                    setTempFormData(initialFormData); // Initialize temp data with the same values
                    setError(null);
                } else {
                    throw new Error(
                        response.data.message ||
                            "Failed to fetch seller details"
                    );
                }
            } catch (err) {
                console.error("Error fetching seller:", err);
                setError("Failed to load seller details");
            } finally {
                setLoading(false);
            }
        };

        fetchSellerDetails();
    }, [sellerId]);

    useEffect(() => {
        const fetchSellerProducts = async () => {
            if (activeTab === "products" && sellerId) {
                setProductsLoading(true);
                try {
                    const response = await api.get(
                        `/product/seller/${sellerId}`
                    );
                    if (response.data.status === "success") {
                        console.log(response.data.data);
                        setSellerProducts(response.data.data);
                        setProductsError(null);
                    }
                } catch (error) {
                    console.error("Error fetching seller products:", error);
                    setProductsError("Failed to load seller's products");
                } finally {
                    setProductsLoading(false);
                }
            }
        };

        fetchSellerProducts();
    }, [activeTab, sellerId]);

    // GST Validation function
    const validateGST = (gst) => {
        // GST format: 2 digits state code + 10 digits PAN + 1 digit entity number + 1 digit check digit + Z
        const regex =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gst);
    };

    // Form validation function
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

            const response = await api.put(`/user/${sellerId}`, updateData);

            if (response.data.success) {
                setSellerData(response.data.data);
                // Update the main formData with the temporary values
                setFormData({ ...tempFormData });
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to update seller details:", error);
            setModalMessage("Failed to update seller details");
            setShowModal(true);
        }
    };

    const handleProductClick = (product) => {
        navigate("/view-seller-product", {
            state: {
                product: {
                    productCategory: product.productCategory,
                    seller: product.seller,
                    price: product.price,
                    subcategory: product.subcategory,
                    unit: product.unit,
                    createdAt: product.createdAt,
                    images: product.images,
                },
            },
        });
    };

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

    const handleAddProductClick = () => {
        //Save to Context
        navigate("/add-seller-product", { state: { sellerData: sellerData } });
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

    // Modal component for displaying validation errors
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

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-gray-600">
                            Loading seller details...
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
                                    { id: "details", label: "Seller Details" },
                                    {
                                        id: "products",
                                        label: "Seller Products",
                                    },
                                ].map((tab) => (
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
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    onClick={handleAddProductClick}
                                >
                                    <Plus className="h-6 w-6 text-black" />
                                </button>
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
                            </div>
                        </div>

                        {/* {activeTab === "details" && (
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
                                                value={formData.fullName}
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
                                                value={formData.companyName}
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
                                                GST (capital letters only)
                                            </label>
                                            <input
                                                type="text"
                                                name="gst"
                                                value={formData.gst}
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                                placeholder="Example: 22AAAAA0000A1Z5"
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
                                                Mobile number (10 digits)
                                            </label>
                                            <input
                                                type="text"
                                                name="mobile"
                                                value={formData.mobile}
                                                onChange={handleChange}
                                                readOnly={!isEditing}
                                                className={inputClassName(
                                                    isEditing
                                                )}
                                                maxLength={10}
                                                placeholder="10 digit mobile number"
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
                                                    value={formData.street}
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
                                                        value={formData.city}
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
                                                        value={formData.state}
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
                                                        ZIP Code (6 digits)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="zipCode"
                                                        value={formData.zipCode}
                                                        onChange={handleChange}
                                                        readOnly={!isEditing}
                                                        className={inputClassName(
                                                            isEditing
                                                        )}
                                                        maxLength={6}
                                                        placeholder="6 digit ZIP code"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="md:col-span-2 flex justify-end space-x-3">
                                        <button
                                            onClick={() => setIsEditing(false)}
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
                        )} */}
                        {activeTab === "details" && (
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
                                                placeholder="Example: 22AAAAA0000A1Z5"
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
                                                Mobile number (10 digits)
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
                                                maxLength={10}
                                                placeholder="10 digit mobile number"
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
                                                        ZIP Code (6 digits)
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
                                                        maxLength={6}
                                                        placeholder="6 digit ZIP code"
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

                        {activeTab === "products" && (
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                {productsLoading ? (
                                    <div className="flex justify-center items-center h-48">
                                        <p className="text-gray-500">
                                            Loading products...
                                        </p>
                                    </div>
                                ) : productsError ? (
                                    <div className="flex justify-center items-center h-48">
                                        <p className="text-red-500">
                                            {productsError}
                                        </p>
                                    </div>
                                ) : sellerProducts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-48 space-y-3">
                                        <p className="text-gray-500">
                                            No products found
                                        </p>
                                        <button
                                            onClick={handleAddProductClick}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Add New Product
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h2 className="text-lg font-semibold text-gray-900">
                                                All Products (
                                                {sellerProducts.length})
                                            </h2>
                                            <button
                                                onClick={handleAddProductClick}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <Plus className="h-5 w-5" />
                                                Add Product
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sellerProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() =>
                                                        navigate(
                                                            "/view-seller-product",
                                                            {
                                                                state: {
                                                                    productId:
                                                                        product.id,
                                                                },
                                                            }
                                                        )
                                                    }
                                                    className="group relative bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                                >
                                                    <div className="aspect-w-3 aspect-h-2">
                                                        {product.images ? (
                                                            <img
                                                                src={
                                                                    product
                                                                        .images[0]
                                                                } // Display first image
                                                                alt={
                                                                    product.name
                                                                }
                                                                className="w-full h-48 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                                                <p className="text-gray-400">
                                                                    No image
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-4 space-y-2">
                                                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                                            {product.name}
                                                        </h3>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-lg font-semibold text-blue-600">
                                                                ₹{product.price}
                                                            </p>
                                                            <span
                                                                className={`px-2 py-1 text-xs rounded-full ${
                                                                    product.status ===
                                                                    "active"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {product.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            <p>
                                                                {
                                                                    product.category
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    product.subcategory
                                                                }
                                                            </p>
                                                            <p>
                                                                {
                                                                    product
                                                                        .price_details
                                                                        .quantity
                                                                }{" "}
                                                                {
                                                                    product
                                                                        .price_details
                                                                        .unit
                                                                }
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Error Modal */}
            <Modal
                show={showModal}
                message={modalMessage}
                onClose={closeModal}
            />
        </div>
    );
};

export default function SellerProfileScreen() {
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
                <SellerProfile isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
