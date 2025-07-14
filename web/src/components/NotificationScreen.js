import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    Bell,
    Ticket,
    UserPlus,
    ChevronRight,
    Clock,
    Check,
    X,
    AlertCircle,
} from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from "./axiosConfig";
import { useAuth } from "../contexts/authContext";

const getNotificationIcon = (type) => {
    switch (type) {
        case "BUYER_REQUEST":
            return <UserPlus className="h-5 w-5 text-blue-600" />;
        case "TICKET_GENERATION":
            return <Ticket className="h-5 w-5 text-green-600" />;
        default:
            return <Bell className="h-5 w-5 text-gray-600" />;
    }
};

const NotificationContent = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user.role === "Admin";

    const [selectedNotification, setSelectedNotification] = useState(null);
    const [activeFilter, setActiveFilter] = useState("all");
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total_pages: 1,
        total: 0,
        has_next: false,
        has_previous: false,
    });

    // Fetch notifications from the API
    const fetchNotifications = async () => {
        try {
            setLoading(true);

            // Build query parameters
            let queryParams = {
                page: pagination.current_page,
                limit: pagination.per_page,
            };

            // Add type filter if not 'all'
            if (activeFilter !== "all") {
                queryParams.type = activeFilter;
            }

            // For operators, always exclude BUYER_REQUEST type
            if (!isAdmin && activeFilter === "all") {
                queryParams.exclude_type = "BUYER_REQUEST";
            }

            const response = await api.get("/notification/", {
                params: queryParams,
            });

            if (response.data.success) {
                // If user is operator, filter out BUYER_REQUEST notifications
                let filteredData = response.data.data;
                if (!isAdmin) {
                    filteredData = filteredData.filter(
                        (notification) => notification.type !== "BUYER_REQUEST"
                    );
                }

                setNotifications(filteredData);
                setPagination(response.data.pagination);

                // If we had a selected notification, try to find it in the new data
                if (selectedNotification) {
                    const updatedSelectedNotification = filteredData.find(
                        (notification) =>
                            notification.id === selectedNotification.id
                    );
                    setSelectedNotification(
                        updatedSelectedNotification || null
                    );
                }
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch notifications when component mounts or filters change
    useEffect(() => {
        fetchNotifications();
    }, [activeFilter, pagination.current_page]);

    // Reset selected notification when role changes
    useEffect(() => {
        setSelectedNotification(null);

        // Reset filter to 'all' if operator was on BUYER_REQUEST
        if (!isAdmin && activeFilter === "BUYER_REQUEST") {
            setActiveFilter("all");
        }
    }, [isAdmin]);

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "just now";
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const filteredNotifications = useMemo(() => {
        return notifications;
    }, [notifications]);

    const handleTicketClick = (notification) => {
        const ticketData = {
            id: notification.message.ticketDetails.ticket_id,
            title: `Ticket for ${notification.message.ticketDetails.product_name}`,
            status: notification.message.ticketDetails.status,
            description: `Ticket generated for ${notification.message.ticketDetails.price_details.quantity} ${notification.message.ticketDetails.price_details.unit} of ${notification.message.ticketDetails.product_name}`,
            createdAt: notification.createdAt.split("T")[0], // Format date to YYYY-MM-DD
            buyerName:
                notification.message.ticketDetails.buyer_details.buyer_name,
            productInterested: notification.message.ticketDetails.productName,
            price: String(notification.message.ticketDetails.price),
            sellerName: "Pending Assignment", // Or get from notification if available
        };

        navigate("/ticket-info", {
            state: { ticketData },
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) {
            setPagination((prev) => ({
                ...prev,
                current_page: newPage,
            }));
        }
    };

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="flex justify-center gap-6 p-6">
                        {/* Left Panel - Notifications List */}
                        <div className="w-1/2 flex-shrink-0">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold">
                                    Notifications
                                </h2>
                                <div className="flex gap-2">
                                    <FilterButton
                                        active={activeFilter === "all"}
                                        onClick={() => setActiveFilter("all")}
                                    >
                                        All
                                    </FilterButton>

                                    {/* Only show BUYER_REQUEST tab for Admin */}
                                    {isAdmin && (
                                        <FilterButton
                                            active={
                                                activeFilter === "BUYER_REQUEST"
                                            }
                                            onClick={() =>
                                                setActiveFilter("BUYER_REQUEST")
                                            }
                                        >
                                            Buyer Requests
                                        </FilterButton>
                                    )}

                                    <FilterButton
                                        active={
                                            activeFilter === "TICKET_GENERATION"
                                        }
                                        onClick={() =>
                                            setActiveFilter("TICKET_GENERATION")
                                        }
                                    >
                                        Tickets
                                    </FilterButton>
                                </div>
                            </div>

                            <div className="overflow-y-auto h-[70vh] space-y-4 pr-4">
                                {loading ? (
                                    <div className="flex justify-center items-center h-full">
                                        <p>Loading notifications...</p>
                                    </div>
                                ) : filteredNotifications.length === 0 ? (
                                    <div className="flex justify-center items-center h-full">
                                        <p>No notifications found</p>
                                    </div>
                                ) : (
                                    <>
                                        {filteredNotifications.map(
                                            (notification) => (
                                                <NotificationCard
                                                    key={notification.id}
                                                    notification={notification}
                                                    isSelected={
                                                        selectedNotification?.id ===
                                                        notification.id
                                                    }
                                                    onClick={() =>
                                                        setSelectedNotification(
                                                            notification
                                                        )
                                                    }
                                                    getTimeAgo={getTimeAgo}
                                                    getNotificationIcon={
                                                        getNotificationIcon
                                                    }
                                                />
                                            )
                                        )}

                                        {/* Pagination Controls */}
                                        {pagination.total_pages > 1 && (
                                            <div className="flex justify-center items-center gap-2 mt-4 pt-2 border-t border-gray-200">
                                                <button
                                                    onClick={() =>
                                                        handlePageChange(
                                                            pagination.current_page -
                                                            1
                                                        )
                                                    }
                                                    disabled={
                                                        !pagination.has_previous
                                                    }
                                                    className={`px-3 py-1 rounded ${!pagination.has_previous
                                                            ? "bg-gray-100 text-gray-400"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                        }`}
                                                >
                                                    Previous
                                                </button>
                                                <span className="text-sm">
                                                    Page{" "}
                                                    {pagination.current_page} of{" "}
                                                    {pagination.total_pages}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handlePageChange(
                                                            pagination.current_page +
                                                            1
                                                        )
                                                    }
                                                    disabled={
                                                        !pagination.has_next
                                                    }
                                                    className={`px-3 py-1 rounded ${!pagination.has_next
                                                            ? "bg-gray-100 text-gray-400"
                                                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                                        }`}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Notification Details */}
                        <div className="w-1/2">
                            {selectedNotification ? (
                                <NotificationDetail
                                    notification={selectedNotification}
                                    getTimeAgo={getTimeAgo}
                                    onTicketClick={handleTicketClick}
                                    getNotificationIcon={getNotificationIcon}
                                    refreshNotifications={fetchNotifications}
                                />
                            ) : (
                                <EmptyState />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Subcomponents
const FilterButton = ({ active, children, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 ${active
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
    >
        {children}
    </button>
);

const NotificationCard = ({
    notification,
    isSelected,
    onClick,
    getTimeAgo,
    getNotificationIcon,
}) => {
    const getPreviewText = () => {
        if (notification.type === "BUYER_REQUEST") {
            const buyer = notification.message.buyer;
            return `${buyer.personalDetails.fullName} from ${buyer.companyDetails.companyName}`;
        } else {
            return `Ticket for ${notification.message.ticketDetails.product_name}`;
        }
    };

    return (
        <button
            onClick={onClick}
            className={`block w-full text-left p-4 rounded-lg transition-all duration-200 relative
                ${isSelected
                    ? "bg-white border border-gray-200 shadow-md"
                    : "bg-transparent hover:bg-gray-50"
                }
                ${!notification.isRead ? "pl-6" : "pl-4"}
            `}
        >
            {!notification.isRead && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-blue-500 rounded-r-full" />
            )}
            <div className="flex gap-3">
                <div
                    className={`flex-shrink-0 rounded-full p-2 ${notification.type === "BUYER_REQUEST"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                >
                    {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <p
                            className={`font-medium line-clamp-1 ${isSelected ? "text-blue-600" : "text-gray-800"
                                }`}
                        >
                            {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap ml-2">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(notification.createdAt)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">
                        {getPreviewText()}
                    </p>
                </div>
            </div>
            {isSelected && (
                <div className="absolute inset-y-0 right-0 w-1 bg-blue-500 rounded-l-full" />
            )}
        </button>
    );
};

const NotificationDetail = ({
    notification,
    getTimeAgo,
    onTicketClick,
    getNotificationIcon,
    refreshNotifications,
}) => (
    <div className="p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200 min-h-[70vh]">
        <div className="flex items-center gap-3 mb-6">
            {getNotificationIcon(notification.type)}
            <h3 className="text-xl font-bold text-gray-800">
                {notification.title}
            </h3>
        </div>

        {notification.type === "BUYER_REQUEST" ? (
            <BuyerRequestDetail
                notification={notification}
                refreshNotifications={refreshNotifications}
            />
        ) : (
            <TicketDetail
                notification={notification}
                onTicketClick={onTicketClick}
            />
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {getTimeAgo(notification.createdAt)}
            </span>
        </div>
    </div>
);

const BuyerRequestDetail = ({ notification, refreshNotifications }) => {
    const { user } = useAuth();
    const [processing, setProcessing] = useState(false);
    // Per-notification status and message
    const [actionStatusMap, setActionStatusMap] = useState({});
    const [statusMessageMap, setStatusMessageMap] = useState({});
    const [selectedOperator, setSelectedOperator] = useState("");
    const [operators, setOperators] = useState([]);
    const [loadingOperators, setLoadingOperators] = useState(false);

    const buyer = notification.message.buyer;
    console.log(notification.message);
    const requestId = notification.message.requestId;
    const requestStatus = notification.message.status;

    const fetchOperators = async () => {
        try {
            setLoadingOperators(true);
            const response = await api.get(`/moderator/role/Operator`);
            console.log(response);
            setOperators(response.data);
        } catch (error) {
            console.error("Error fetching operators:", error);
            setOperators([]);
        } finally {
            setLoadingOperators(false);
        }
    };

    // Fetch operators when component mounts
    useEffect(() => {
        if (
            user.role === "Admin" &&
            notification.message.status === "pending"
        ) {
            fetchOperators();
        }
    }, [user.role, notification.message.status]);

    const handleAcceptRequest = async () => {
        // If no operator is selected, do not proceed further
        if (!selectedOperator) {
            setActionStatusMap((prev) => ({ ...prev, [notification.id]: "error" }));
            setStatusMessageMap((prev) => ({ ...prev, [notification.id]: "Please select an operator before accepting the request." }));
            return;
        }
        try {
            setProcessing(true);
            // Clear previous status for this notification
            setActionStatusMap((prev) => ({ ...prev, [notification.id]: null }));
            setStatusMessageMap((prev) => ({ ...prev, [notification.id]: "" }));

            console.log('Notification', notification);
            const payload = {
                decision: "accepted",
                admin_id: user.userId,
                assigned_operator: selectedOperator, // Pass selected operator ID
                notification_id: notification.id
            };
            console.log("admin decision api to be called", payload);
            console.log(`/onboarding/admin-decision/${requestId}`);
            const response = await api.put(
                `/onboarding/admin-decision/${requestId}`,
                payload
            );
            console.log(response);

            if (response.data.success) {
                setActionStatusMap((prev) => ({ ...prev, [notification.id]: "success" }));
                setStatusMessageMap((prev) => ({ ...prev, [notification.id]: "Buyer request accepted successfully" }));
                // Refresh the notifications list after successful action
                setTimeout(() => {
                    refreshNotifications();
                }, 2000);
            } else {
                setActionStatusMap((prev) => ({ ...prev, [notification.id]: "error" }));
                setStatusMessageMap((prev) => ({ ...prev, [notification.id]: response.data.message || "Failed to accept request" }));
            }
        } catch (error) {
            setActionStatusMap((prev) => ({ ...prev, [notification.id]: "error" }));
            setStatusMessageMap((prev) => ({ ...prev, [notification.id]: error.response?.data?.message || "Error processing request" }));
            console.error("Error accepting buyer request:", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectRequest = async () => {
        try {
            setProcessing(true);
            setActionStatusMap((prev) => ({ ...prev, [notification.id]: null }));
            setStatusMessageMap((prev) => ({ ...prev, [notification.id]: "" }));
            console.log('Notification', notification);
            console.log("USER", user);
            const payload = {
                decision: "rejected",
                admin_id: user.userId,
                notification_id: notification.id
            };

            const response = await api.put(
                `/onboarding/admin-decision/${requestId}`,
                payload
            );

            if (response.data.success) {
                setActionStatusMap((prev) => ({ ...prev, [notification.id]: "success" }));
                setStatusMessageMap((prev) => ({ ...prev, [notification.id]: "Buyer request rejected successfully" }));
                // Refresh the notifications list after successful action
                setTimeout(() => {
                    refreshNotifications();
                }, 2000);
            } else {
                setActionStatusMap((prev) => ({ ...prev, [notification.id]: "error" }));
                setStatusMessageMap((prev) => ({ ...prev, [notification.id]: response.data.message || "Failed to reject request" }));
            }
        } catch (error) {
            setActionStatusMap((prev) => ({ ...prev, [notification.id]: "error" }));
            setStatusMessageMap((prev) => ({ ...prev, [notification.id]: error.response?.data?.message || "Error processing request" }));
            console.error("Error rejecting buyer request:", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <DetailField
                    label="Name"
                    value={buyer.personalDetails.fullName}
                />
                <DetailField
                    label="Phone"
                    value={buyer.contactDetails.phoneNumber}
                />
                <DetailField
                    label="Company"
                    value={buyer.companyDetails.companyName}
                />
                <DetailField
                    label="GST No"
                    value={buyer.companyDetails.gstNumber}
                />
                <DetailField
                    label="Address"
                    value={buyer.companyDetails.companyAddress.street}
                />
                <DetailField
                    label="City"
                    value={buyer.companyDetails.companyAddress.city}
                />
                <DetailField
                    label="State"
                    value={buyer.companyDetails.companyAddress.state}
                />
                <DetailField
                    label="ZIP Code"
                    value={buyer.companyDetails.companyAddress.zip_code}
                />
                <DetailField
                    label="Request Status"
                    value={notification.message.status}
                />
                <DetailField
                    label="Request Type"
                    value={notification.message.requestType}
                />
            </div>

            {user.role === "Admin" && (
                <>
                    {requestStatus === "pending" ? (
                        <>
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assign Operator (Optional)
                                </label>
                                {loadingOperators ? (
                                    <div className="flex items-center justify-center p-2 border border-gray-300 rounded-md">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                        <span className="ml-2 text-sm text-gray-500">
                                            Loading operators...
                                        </span>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedOperator}
                                        onChange={(e) => setSelectedOperator(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select an operator</option>
                                        {operators.map((operator) => (
                                            <option
                                                key={operator.moderator_id}
                                                value={operator.moderator_id}
                                            >
                                                {operator.name || operator.email || operator.moderator_id}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex justify-center gap-4 mt-6">
                                <button
                                    onClick={handleAcceptRequest}
                                    disabled={processing}
                                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 
                                        transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <Check className="h-5 w-5" />
                                    Accept Request
                                </button>

                                <button
                                    onClick={handleRejectRequest}
                                    disabled={processing}
                                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                                        transition-colors duration-200 shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <X className="h-5 w-5" />
                                    Reject Request
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-center gap-2 text-gray-700">
                                <AlertCircle className="h-5 w-5" />
                                <span>
                                    This request has already been {requestStatus.toLowerCase()}
                                </span>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Status message display */}
            {actionStatusMap[notification.id] && (
                <div
                    className={`mt-4 p-3 rounded-md ${actionStatusMap[notification.id] === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        {actionStatusMap[notification.id] === "success" ? (
                            <Check className="h-5 w-5" />
                        ) : (
                            <AlertCircle className="h-5 w-5" />
                        )}
                        {statusMessageMap[notification.id]}
                    </div>
                </div>
            )}

            {processing && (
                <div className="flex justify-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            )}
        </div>
    );
};

const TicketDetail = ({ notification, onTicketClick }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <DetailField
                    label="Ticket ID"
                    value={notification.message.ticketDetails.ticket_id}
                />
                <DetailField
                    label="Product"
                    value={notification.message.ticketDetails.product_name}
                />
                <DetailField
                    label="Quantity"
                    value={`${notification.message.ticketDetails.price_details.quantity} ${notification.message.ticketDetails.price_details.unit}`}
                />
                <DetailField
                    label="Price"
                    value={`₹${notification.message.ticketDetails.price}`}
                />
                <DetailField
                    label="Buyer"
                    value={
                        notification.message.ticketDetails.buyer_details
                            .buyer_name
                    }
                />
                <DetailField
                    label="Status"
                    value={notification.message.ticketDetails.status}
                />
            </div>

            <button
                onClick={() => onTicketClick(notification)}
                className="w-full mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                      transition-colors duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
                View Complete Details
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
};

const DetailField = ({ label, value }) => (
    <div className="space-y-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
    </div>
);

const EmptyState = () => (
    <div
        className="flex flex-col items-center justify-center min-h-[70vh] 
                  bg-gray-50 rounded-lg border border-gray-200 text-gray-500"
    >
        <Bell className="h-12 w-12 text-gray-400 mb-4" />
        <p>Select a notification to view details</p>
    </div>
);

// Main component export
export default function NotificationScreen() {
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
                <NotificationContent isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
