import React, { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { useNavigate } from "react-router";
import { api } from "./axiosConfig";
import ContentWrapper from "./layout/ContentWrapper";

const SellersDashboard = ({ isSidebarOpen }) => {
    const navigate = useNavigate();

    // State management
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingSeller, setEditingSeller] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch sellers from API
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                const response = await api.get("/user/role/seller"); // Use API endpoint with seller role
                console.log(response);
                const data = response.data;

                // Transform the data to match the expected format
                const transformedData = data.data.map((seller) => ({
                    id: seller.user_id,
                    name: seller.personal_details.fullName,
                    mobile: seller.contact_details.phone_number,
                    company: seller.company_details.company_name,
                    gst: seller.company_details.gst_number || "N/A",
                    address: seller.company_details.company_address || "N/A",
                }));

                setSellers(transformedData);
                setError(null);
            } catch (err) {
                setError("Failed to load sellers. Please try again later.");
                console.error("Error fetching sellers:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSellers();
    }, []);

    // Pagination settings
    const itemsPerPage = 5;

    // Filter sellers based on search
    const filteredSellers = sellers.filter(
        (seller) =>
            seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.mobile.includes(searchQuery) ||
            seller.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            seller.gst.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredSellers.length / itemsPerPage);

    // Pagination handlers
    const previousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Get current page items
    const getCurrentItems = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSellers.slice(startIndex, startIndex + itemsPerPage);
    };

    // Edit seller data
    const handleEdit = (seller) => {
        setEditingSeller({ ...seller });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
    };

    // Delete seller data
    const handleDelete = async (sellerId) => {
        if (window.confirm("Are you sure you want to delete this seller?")) {
            try {
                const response = await api.delete(`/user/${sellerId}`);
                setSellers(sellers.filter((s) => s.id !== sellerId));
                setActiveDropdown(null);
            } catch (err) {
                console.error("Error deleting seller:", err);
                alert("Failed to delete seller. Please try again.");
            }
        }
    };

    // Save edited seller
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/user/${editingSeller.id}`, {
                personal_details: {
                    fullName: editingSeller.name,
                },
                contact_details: {
                    phone_number: editingSeller.mobile,
                },
                company_details: {
                    company_name: editingSeller.company,
                    gst_number: editingSeller.gst,
                },
            });

            setSellers(
                sellers.map((s) =>
                    s.id === editingSeller.id ? editingSeller : s
                )
            );
            setIsEditModalOpen(false);
            setEditingSeller(null);
        } catch (err) {
            console.error("Error updating seller:", err);
            alert("Failed to update seller. Please try again.");
        }
    };

    const handleSellerClick = (seller) => {
        console.log("Seller clicked:", seller);
        navigate(`/seller-profile`, { state: { sellerId: seller.id } });
    };

    const handleActionClick = (sellerId, event) => {
        if (event) {
            event.stopPropagation();
        }
        setActiveDropdown(activeDropdown === sellerId ? null : sellerId);
    };

    const handleNavigation = (path) => {
        navigate(path);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    const containerClass = `transition-all duration-300 ease-in-out 
        ${isSidebarOpen ? "ml-64" : "ml-0"}
        mt-16 p-6`;

    // Loading state
    if (loading) {
        return (
            <div className={containerClass}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading sellers...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={containerClass}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-red-600">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Search Bar */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search sellers..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                        onClick={() => handleNavigation("/onboard-seller")}
                        className="ml-4 p-1 hover:bg-gray-100 rounded-full"
                    >
                        <Plus className="h-6 w-6 text-black" />
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto relative">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Seller Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Mobile
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        GST No
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                        {/*
                                        //Actions button  bug to be fixed yet where dropdown gets hidden 
                                        by table bottom bar for the last displayed seller
                                       */}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentItems().map((seller) => (
                                    <tr
                                        key={seller.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <button
                                                onClick={() =>
                                                    handleSellerClick(seller)
                                                }
                                                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                            >
                                                {seller.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {seller.mobile}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {seller.company}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {seller.gst}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) =>
                                                        handleActionClick(
                                                            seller.id,
                                                            e
                                                        )
                                                    }
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <MoreVertical className="h-5 w-5 text-gray-500" />
                                                </button>

                                                {activeDropdown ===
                                                    seller.id && (
                                                    <div
                                                        className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                                                        style={{
                                                            zIndex: 1000,
                                                            position:
                                                                "absolute",
                                                            transform:
                                                                "translateY(-90%)",
                                                            top: "80%",
                                                            right: "2rem",
                                                        }}
                                                    >
                                                        <div className="py-1">
                                                            <button
                                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        seller
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        seller.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                            {Math.min(
                                currentPage * itemsPerPage,
                                filteredSellers.length
                            )}{" "}
                            of {filteredSellers.length} entries
                        </div>
                        <div className="flex items-center space-x-4">
                            <ChevronLeft
                                className={`h-5 w-5 cursor-pointer ${
                                    currentPage === 1
                                        ? "text-gray-300"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                                onClick={previousPage}
                            />
                            <ChevronRight
                                className={`h-5 w-5 cursor-pointer ${
                                    currentPage === totalPages
                                        ? "text-gray-300"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                                onClick={nextPage}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            Edit Seller
                        </h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSeller.name}
                                        onChange={(e) =>
                                            setEditingSeller({
                                                ...editingSeller,
                                                name: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mobile
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSeller.mobile}
                                        onChange={(e) =>
                                            setEditingSeller({
                                                ...editingSeller,
                                                mobile: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSeller.company}
                                        onChange={(e) =>
                                            setEditingSeller({
                                                ...editingSeller,
                                                company: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        GST
                                    </label>
                                    <input
                                        type="text"
                                        value={editingSeller.gst}
                                        onChange={(e) =>
                                            setEditingSeller({
                                                ...editingSeller,
                                                gst: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const SellersDashboardScreen = () => {
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
                <SellersDashboard isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
};

export default SellersDashboardScreen;
