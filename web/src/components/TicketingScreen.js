import React, { useState, useEffect, useMemo } from "react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from './axiosConfig';

const getStatusColorClass = (status) => {
    switch (status) {
        case 'InProgress':
            return 'bg-yellow-100 text-yellow-800';
        case 'Acknowledged_by_Operator':
            return 'bg-blue-100 text-blue-800';
        case 'Deal_Complete':
            return 'bg-green-100 text-green-800';
        case 'Deal_Cancel':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
const getStatusName = (status) => { 
    switch (status) {
        case 'InProgress':
            return 'Open';
        case 'Acknowledged_by_Operator':
            return 'In Progress';
        case 'Deal_Complete':
            return 'Accepted';  
        case 'Deal_Cancel':
            return 'Rejected';
        default:
            return status;
    }
};

const TicketingContent = ({ isSidebarOpen }) => {
    const [tickets, setTickets] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;
    const navigate = useNavigate();

    // Fetch tickets on component mount
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await api.post('/ticket/operator', {
                    page: currentPage,
                    limit: itemsPerPage
                });

                if (response.data.success) {
                    setTickets(response.data.data);
                    setError(null);
                } else {
                    setError("Failed to fetch tickets");
                }
            } catch (err) {
                console.error("Error fetching tickets:", err);
                setError("Failed to load tickets");
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [currentPage]);

    const filteredTickets = useMemo(
        () =>
            tickets.filter((ticket) => {
                // Check if ticket exists and has required properties
                if (!ticket) return false;

                const ticketIdMatch = ticket.ticket_id ?
                    ticket.ticket_id.toString().toLowerCase().includes(searchTerm.toLowerCase()) :
                    false;

                const productNameMatch = ticket.product_name ?
                    ticket.product_name.toLowerCase().includes(searchTerm.toLowerCase()) :
                    false;

                const buyerNameMatch = ticket.buyer_details?.buyer_name ?
                    ticket.buyer_details.buyer_name.toLowerCase().includes(searchTerm.toLowerCase()) :
                    false;

                const sellerNameMatch = ticket.seller_details?.seller_name ?
                    ticket.seller_details.seller_name.toLowerCase().includes(searchTerm.toLowerCase()) :
                    false;

                return (
                    (statusFilter === "All" || ticket.status === statusFilter) &&
                    (ticketIdMatch || productNameMatch || buyerNameMatch || sellerNameMatch)
                );
            }),
        [tickets, statusFilter, searchTerm]
    );

    const handleTicketClick = (ticket) => {
        navigate(`/ticket-info`, {
            state: {
                ticketData: {
                    id: ticket.ticket_id,
                    title: `Ticket for ${ticket.product_name}`,
                    status: ticket.status,
                    description: ticket.description,
                    createdAt: new Date(ticket.createdAt).toLocaleDateString(),
                    buyerName: ticket.buyer_details?.buyer_name,
                    productInterested: ticket.product_name,
                    sellerName: ticket.seller_details?.seller_name || "Pending Assignment"
                }
            }
        });
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">Loading tickets...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Search and Filter Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-grow max-w-md">
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg ml-4">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-gray-700 outline-none"
                        >
                            <option value="All">All Tickets</option>
                            <option value="InProgress">Open</option>
                            <option value="Acknowledged_by_Operator">In Progress</option>
                            <option value="Deal_Complete">Accepted</option>
                            <option value="Deal_Cancel">Rejected</option>
                        </select>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 font-medium">Ticket ID</th>
                                <th className="px-6 py-3 font-medium">Product Name</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Created At</th>
                                <th className="px-6 py-3 font-medium">Buyer Name</th>
                                <th className="px-6 py-3 font-medium">Seller Name</th>
                                <th className="px-6 py-3 font-medium">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr
                                    key={ticket.ticket_id}
                                    className="bg-white border-b hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <button
                                            onClick={() => handleTicketClick(ticket)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                        >
                                            {ticket.ticket_id}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">{ticket.product_name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColorClass(ticket.status)}`}>
                                            {getStatusName(ticket.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(ticket.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">{ticket.buyer_details?.buyer_name}</td>
                                    <td className="px-6 py-4">{ticket.seller_details?.seller_name}</td>
                                    <td className="px-6 py-4">₹{ticket.price}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex justify-between items-center px-6 py-4 bg-white border-t">
                        <div className="text-sm text-gray-700">
                            Page {currentPage}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={filteredTickets.length < itemsPerPage}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function TicketingScreen() {
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
                <TicketingContent isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
