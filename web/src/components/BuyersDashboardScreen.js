import React, { useState, useEffect } from "react";
import {
    Search,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router";
import { api } from "./axiosConfig";
import ContentWrapper from "./layout/ContentWrapper";

const BuyersDashboard = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const [buyers, setBuyers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingBuyer, setEditingBuyer] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [operators, setOperators] = useState([]);

    useEffect(() => {
        const fetchOperators = async () => {
            try {
                const response = await api.get("/moderator/role/Operator"); // Assuming you have this endpoint
                debugger;
                setOperators(response.data || []);
            } catch (err) {
                console.error("Error fetching operators:", err);
            }
        };
        const fetchBuyers = async () => {
            try {
                const response = await api.get("/user/role/buyer");
                console.log(response);
                const data = response.data;
                console.log(data);
                console.log(typeof data);

                // Transform the data to include operator information
                const transformedData = data.data.map((buyer) => ({
                    id: buyer.user_id,
                    name: buyer.personal_details.fullName,
                    mobile: buyer.contact_details.phone_number,
                    company: buyer.company_details.company_name,
                    gst: buyer.company_details.gst_number || "N/A",
                    // Add operator information
                    assignedOperator: buyer.assigned_operator_details
                        ? {
                              moderator_id:
                                  buyer.assigned_operator_details.moderator_id,
                              name: buyer.assigned_operator_details.name,
                              email: buyer.assigned_operator_details.email,
                              phone_number:
                                  buyer.assigned_operator_details.phone_number,
                              role: buyer.assigned_operator_details.role,
                          }
                        : null,
                    // Keep original assigned_operator ID for reference
                    assignedOperatorId: buyer.assigned_operator,
                }));

                setBuyers(transformedData);
                setError(null);
            } catch (err) {
                setError("Failed to load buyers. Please try again later.");
                console.error("Error fetching buyers:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBuyers();
        fetchOperators(); // I am putting these two calls synchronously, how high I am ?
    }, []);

    const handleBuyerClick = (buyer) => {
        console.log(buyer);
        navigate(`/buyer-profile`, { state: { buyerId: buyer.id } });
    };

    const handleOperatorClick = (operator) => {
        navigate(`/operator-profile`, { state: { operatorData: operator } });
    };

    // Pagination settings
    const itemsPerPage = 5;

    // Filter buyers based on search (including operator name)
    const filteredBuyers = buyers.filter(
        (buyer) =>
            buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            buyer.mobile.includes(searchQuery) ||
            buyer.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            buyer.gst.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (buyer.assignedOperator &&
                buyer.assignedOperator.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);

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
        return filteredBuyers.slice(startIndex, startIndex + itemsPerPage);
    };

    const handleEdit = async (buyer) => {
        setEditingBuyer({
            ...buyer,
            assignedOperatorId: buyer.assignedOperatorId || "", // Include the operator ID for editing
        });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
        setFormErrors({});
    };

    const handleDelete = async (buyerId) => {
        if (window.confirm("Are you sure you want to delete this buyer?")) {
            try {
                const response = await api.delete(`/user/${buyerId}`);

                setBuyers(buyers.filter((b) => b.id !== buyerId));
                setActiveDropdown(null);
            } catch (err) {
                console.error("Error deleting buyer:", err);
                alert("Failed to delete buyer. Please try again.");
            }
        }
    };

    // Validation functions
    const validateForm = () => {
        const errors = {};

        if (!editingBuyer.name.trim()) {
            errors.name = "Name is required";
        }

        if (!editingBuyer.mobile.trim()) {
            errors.mobile = "Mobile number is required";
        } else if (editingBuyer.mobile.length !== 10) {
            errors.mobile = "Mobile number must be exactly 10 digits";
        }

        if (!editingBuyer.company.trim()) {
            errors.company = "Company name is required";
        }

        if (editingBuyer.gst!=null && editingBuyer.gst!='N/A' &&editingBuyer.gst.length !== 15) {
            errors.gst = "GST number must be exactly 15 characters";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle mobile number input - only digits, max 10
    const handleMobileChange = (e) => {
        const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
        if (value.length <= 10) {
            setEditingBuyer({
                ...editingBuyer,
                mobile: value,
            });
        }
    };

    // Handle GST number input - auto capitalize and max 15 chars
    const handleGSTChange = (e) => {
        const value = e.target.value.toUpperCase(); // Auto capitalize
        if (value.length <= 15) {
            setEditingBuyer({
                ...editingBuyer,
                gst: value,
            });
        }
    };

    // Save edited buyer
    const handleSaveEdit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const response = await api.put(`/user/${editingBuyer.id}`, {
                personal_details: {
                    fullName: editingBuyer.name,
                },
                contact_details: {
                    phone_number: editingBuyer.mobile,
                },
                company_details: {
                    company_name: editingBuyer.company,
                    gst_number: editingBuyer.gst,
                },
                assigned_operator: editingBuyer.assignedOperatorId || "", // Add this line
            });

            // Update the local state with the new data
            const updatedBuyer = {
                ...editingBuyer,
                assignedOperator: editingBuyer.assignedOperatorId
                    ? operators.find(
                          (op) =>
                              op.moderator_id ===
                              editingBuyer.assignedOperatorId
                      )
                    : null,
            };

            setBuyers(
                buyers.map((b) => (b.id === editingBuyer.id ? updatedBuyer : b))
            );
            setIsEditModalOpen(false);
            setEditingBuyer(null);
            setFormErrors({});
        } catch (err) {
            console.error("Error updating buyer:", err);
            alert("Failed to update buyer. Please try again.");
        }
    };

    const handleActionClick = (buyerId, event) => {
        if (event) {
            event.stopPropagation();
        }
        setActiveDropdown(activeDropdown === buyerId ? null : buyerId);
    };

    const handleNavigation = (path) => {
        if (path === "/login") {
            // Handle sign out logic here if needed
            // For example: clearAuth(), logout(), etc.
        }
        navigate(path);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    if (loading) {
        return (
            <div className="h-full">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-600">Loading buyers...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full">
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
                            placeholder="Search Buyers..."
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
                        onClick={() => handleNavigation("/onboard-buyer")}
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
                                        Buyer Name
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned Operator
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {getCurrentItems().map((buyer) => (
                                    <tr
                                        key={buyer.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <button
                                                onClick={() =>
                                                    handleBuyerClick(buyer)
                                                }
                                                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                            >
                                                {buyer.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {buyer.mobile}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {buyer.company}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {buyer.gst}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {buyer.assignedOperator ? (
                                                <button
                                                    onClick={() =>
                                                        handleOperatorClick(
                                                            buyer.assignedOperator
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                                >
                                                    {
                                                        buyer.assignedOperator
                                                            .name
                                                    }
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 italic">
                                                    Not Assigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                            <div className="relative inline-block">
                                                <button
                                                    onClick={(e) =>
                                                        handleActionClick(
                                                            buyer.id,
                                                            e
                                                        )
                                                    }
                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                >
                                                    <MoreVertical className="h-5 w-5 text-gray-500" />
                                                </button>

                                                {activeDropdown ===
                                                    buyer.id && (
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
                                                                        buyer
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        buyer.id
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
                                filteredBuyers.length
                            )}{" "}
                            of {filteredBuyers.length} entries
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
                            Edit Buyer
                        </h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBuyer.name}
                                        onChange={(e) =>
                                            setEditingBuyer({
                                                ...editingBuyer,
                                                name: e.target.value,
                                            })
                                        }
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.name
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter full name"
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mobile{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBuyer.mobile}
                                        onChange={handleMobileChange}
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.mobile
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter 10-digit mobile number"
                                        maxLength="10"
                                    />
                                    {formErrors.mobile && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.mobile}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Company{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBuyer.company}
                                        onChange={(e) =>
                                            setEditingBuyer({
                                                ...editingBuyer,
                                                company: e.target.value,
                                            })
                                        }
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.company
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter company name"
                                    />
                                    {formErrors.company && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.company}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        GST Number{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={editingBuyer.gst}
                                        onChange={handleGSTChange}
                                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.gst
                                                ? "border-red-500"
                                                : "border-gray-300"
                                        }`}
                                        placeholder="Enter 15-character GST number"
                                        maxLength="15"
                                    />
                                    {formErrors.gst && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.gst}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Assigned Operator
                                    </label>
                                    <select
                                        value={
                                            editingBuyer.assignedOperatorId ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            setEditingBuyer({
                                                ...editingBuyer,
                                                assignedOperatorId:
                                                    e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">
                                            Select an operator (Optional)
                                        </option>
                                        {operators.map((operator) => (
                                            <option
                                                key={operator.moderator_id}
                                                value={operator.moderator_id}
                                            >
                                                {operator.name} -{" "}
                                                {operator.email}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.assignedOperatorId && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {formErrors.assignedOperatorId}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setFormErrors({});
                                    }}
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
                    //
                </div>
            )}
        </div>
    );
};

const BuyersDashboardScreen = () => {
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
                <BuyersDashboard isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
};

export default BuyersDashboardScreen;
