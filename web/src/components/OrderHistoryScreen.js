import React, { useState, useEffect } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    MessageSquare,
    PenSquare,
    MessageCircle,
} from "lucide-react";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { useNavigate } from "react-router";
import { api } from "./axiosConfig";

const OrderHistory = ({ isSidebarOpen, buyerData }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;

    // Fetch tickets from backend
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setIsLoading(true);
                // Assuming buyer_id is stored in localStorage or context
                // You should replace "37334" with actual buyer_id from your auth system
                const requestBody = {
                    buyer_id: buyerData.user_id,
                    statuses: ["InProgress", "Rejected", "Accepted"],
                };

                const response = await api.post("/ticket/buyer", requestBody);

                console.log(response.data);

                // Transform the ticket data to match the orders format
                const transformedData = response.data.data.map((ticket) => ({
                    id: ticket.ticket_id || Math.random().toString(),
                    product: ticket.product_name || "Unknown Product",
                    price: parseFloat(ticket.price) || 0.0,
                    ticketId: ticket.ticket_id,
                    status: ticket.status,
                }));

                setOrders(transformedData);
                setError(null);
            } catch (err) {
                console.error("Error fetching tickets:", err);
                setError("Failed to load tickets. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTickets();
    }, []); // Empty dependency array means this effect runs once on mount

    // Pagination logic
    const filteredOrders = orders;
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const getCurrentItems = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredOrders.slice(start, end);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const previousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case "accepted":
            case "completed":
                return "text-green-600";
            case "rejected":
            case "canceled":
                return "text-red-600";
            case "inprogress":
                return "text-yellow-600";
            default:
                return "text-gray-600";
        }
    };

    const handleTicketClick = (order) => {
        navigate(`/ticket-info`, { state: { ticketData: order } });
    };

    if (isLoading) {
        return <div className="text-center py-10">Loading tickets...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-600">{error}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No tickets found
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto relative">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ticket Id
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getCurrentItems().map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {order.product}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.price.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() =>
                                                        handleTicketClick(order)
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                                >
                                                    {order.ticketId}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={getStatusColor(
                                                        order.status
                                                    )}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing {(currentPage - 1) * itemsPerPage + 1}{" "}
                                to{" "}
                                {Math.min(
                                    currentPage * itemsPerPage,
                                    filteredOrders.length
                                )}{" "}
                                of {filteredOrders.length} entries
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
                    </>
                )}
            </div>
        </div>
    );
};

export { OrderHistory };

export default function OrderHistoryScreen() {
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
                <OrderHistory isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
