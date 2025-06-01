import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    Search,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Plus,
} from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import { api } from "./axiosConfig";
import ContentWrapper from "./layout/ContentWrapper";

const OperatorsDashboard = ({ isSidebarOpen }) => {
    const navigate = useNavigate();

    // State management
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingOperator, setEditingOperator] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Fetch operators from backend
    useEffect(() => {
        const fetchOperators = async () => {
            try {
                setLoading(true);
                const response = await api.get("/moderator/all");
                setOperators(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching operators:", err);
                setError("Failed to load operators. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOperators();
    }, []);

    // Pagination settings
    const itemsPerPage = 5;

    // Filter operators based on search
    const filteredOperators = operators.filter(
        (operator) =>
            operator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            operator.phone_number.includes(searchQuery) ||
            operator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            operator.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredOperators.length / itemsPerPage);

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
        return filteredOperators.slice(startIndex, startIndex + itemsPerPage);
    };

    const handleEdit = (operator) => {
        setEditingOperator({ ...operator });
        setIsEditModalOpen(true);
        setActiveDropdown(null);
    };

    const handleDelete = async (operatorId) => {
        if (window.confirm("Are you sure you want to delete this operator?")) {
            try {
                await api.delete(`/moderator/${operatorId}`);
                // Update local state after successful deletion
                setOperators(
                    operators.filter((o) => o.moderator_id !== operatorId)
                );
                setActiveDropdown(null);
            } catch (err) {
                console.error("Error deleting operator:", err);
                alert("Failed to delete operator");
            }
        }
    };

    const handleOperatorClick = (operator) => {
        navigate(`/operator-profile`, { state: { operatorData: operator } });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            // Make a PUT request to update the operator
            await api.put(`/moderator/${editingOperator.moderator_id}`, {
                name: editingOperator.name,
                email: editingOperator.email,
                phone: editingOperator.phone_number,
                role: editingOperator.role,
            });

            // Update local state after successful update
            setOperators(
                operators.map((o) =>
                    o.moderator_id === editingOperator.moderator_id
                        ? editingOperator
                        : o
                )
            );
            setIsEditModalOpen(false);
            setEditingOperator(null);
        } catch (err) {
            console.error("Error updating operator:", err);
            alert("Failed to update operator");
        }
    };

    const handleActionClick = (operatorId, event) => {
        if (event) {
            event.stopPropagation();
        }
        setActiveDropdown(activeDropdown === operatorId ? null : operatorId);
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

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Search Bar and Add Operator Button */}
                <div className="flex justify-between items-center mb-6">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search operators..."
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
                        onClick={() => handleNavigation("/onboard-operator")}
                        className="ml-4 p-1 hover:bg-gray-100 rounded-full"
                        title="Add New Operator"
                    >
                        <Plus className="h-6 w-6 text-black" />
                    </button>
                </div>

                {/* Loading and Error States */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-500">Loading operators...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Table */}
                {!loading && !error && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {operators.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-gray-500">
                                    No operators found.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto relative">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Operator Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mobile
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {getCurrentItems().map(
                                                (operator) => (
                                                    <tr
                                                        key={
                                                            operator.moderator_id
                                                        }
                                                        className="hover:bg-gray-50"
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            <button
                                                                onClick={() =>
                                                                    handleOperatorClick(
                                                                        operator
                                                                    )
                                                                }
                                                                className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                                            >
                                                                {operator.name}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {
                                                                operator.phone_number
                                                            }
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {operator.email}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {operator.role}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                                            <div className="relative inline-block">
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        handleActionClick(
                                                                            operator.moderator_id,
                                                                            e
                                                                        )
                                                                    }
                                                                    className="p-1 rounded-full hover:bg-gray-100"
                                                                >
                                                                    <MoreVertical className="h-5 w-5 text-gray-500" />
                                                                </button>

                                                                {activeDropdown ===
                                                                    operator.moderator_id && (
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
                                                                                        operator
                                                                                    )
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                                                                                onClick={() =>
                                                                                    handleDelete(
                                                                                        operator.moderator_id
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
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {filteredOperators.length > itemsPerPage && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                        <div className="text-sm text-gray-500">
                                            Showing{" "}
                                            {(currentPage - 1) * itemsPerPage +
                                                1}{" "}
                                            to{" "}
                                            {Math.min(
                                                currentPage * itemsPerPage,
                                                filteredOperators.length
                                            )}{" "}
                                            of {filteredOperators.length}{" "}
                                            entries
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
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">
                            Edit Operator
                        </h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingOperator.name || ""}
                                        onChange={(e) =>
                                            setEditingOperator({
                                                ...editingOperator,
                                                name: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Mobile
                                    </label>
                                    <input
                                        type="tel"
                                        value={
                                            editingOperator.phone_number || ""
                                        }
                                        onChange={(e) =>
                                            setEditingOperator({
                                                ...editingOperator,
                                                phone: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={editingOperator.email || ""}
                                        onChange={(e) =>
                                            setEditingOperator({
                                                ...editingOperator,
                                                email: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Role
                                    </label>
                                    <select
                                        value={editingOperator.role || ""}
                                        onChange={(e) =>
                                            setEditingOperator({
                                                ...editingOperator,
                                                role: e.target.value,
                                            })
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="Admin">Admin</option>
                                        <option value="Operator">
                                            Operator
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingOperator(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

const OperatorsContent = ({ isSidebarOpen }) => {
    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <OperatorsDashboard isSidebarOpen={isSidebarOpen} />
            </div>
        </div>
    );
};

export default function OperatorsDashboardScreen() {
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
                <OperatorsDashboard isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
