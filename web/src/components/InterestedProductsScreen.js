import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { useNavigate } from "react-router";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from "./axiosConfig";

const InterestedProducts = ({ isSidebarOpen, buyerData }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const itemsPerPage = 10;
    console.log(buyerData);

    useEffect(() => {
        const fetchTickets = async () => {
            if (buyerData && buyerData.user_id) {
                try {
                    setLoading(true);
                    const payload = {
                        buyer_id: buyerData.user_id,
                        statuses: ["Open"],
                    };
                    // console.log(payload);
                    // Fetch tickets with status "Open" for this buyer
                    const response = await api.post(`/ticket/buyer`, payload);

                    if (response.data && response.data.success) {
                        // Transform the ticket data to match our component's expected format
                        // console.log(response.data);
                        const transformedProducts = response.data.data.map(
                            (ticket) => ({
                                id: ticket.ticket_id,
                                product:
                                    ticket.product_name || "Unknown Product",
                                price: ticket.price || 0,
                                ticketId: ticket.ticket_id,
                                ticket: ticket,
                            })
                        );

                        setProducts(transformedProducts);
                    } else {
                        setError("Failed to fetch tickets");
                    }
                } catch (err) {
                    console.error("Error fetching tickets:", err);
                    setError(
                        "Error fetching tickets: " +
                            (err.message || "Unknown error")
                    );
                } finally {
                    setLoading(false);
                }
            } else {
                setError("Buyer data is missing or incomplete");
                setLoading(false);
            }
        };

        fetchTickets();
    }, [buyerData]);

    // Pagination logic
    const filteredProducts = products;
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const getCurrentItems = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredProducts.slice(start, end);
    };

    const nextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const previousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleTicketClick = (product) => {
        // console.log(product.ticket);
        navigate(`/ticket-info`, { state: { ticketData: product.ticket } });
    };

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-500">Loading products...</p>
                        </div>
                    ) : error ? (
                        <div className="py-16 text-center">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-500">
                                No interested products found
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto relative">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                                Product
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                                                Ticket Id
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {getCurrentItems().map((product) => (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {product.product}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.price.toFixed(1)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button
                                                        onClick={() =>
                                                            handleTicketClick(
                                                                product
                                                            )
                                                        }
                                                        className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                                    >
                                                        {product.ticketId}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing{" "}
                                    {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                    {Math.min(
                                        currentPage * itemsPerPage,
                                        filteredProducts.length
                                    )}{" "}
                                    of {filteredProducts.length} entries
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
        </div>
    );
};

export { InterestedProducts };

export default function InterestedProductsScreen() {
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
                <InterestedProducts isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
