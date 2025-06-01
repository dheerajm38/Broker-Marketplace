import React from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../contexts/authContext";
import {
    LayoutDashboard,
    Users,
    TicketCheck,
    Store,
    ShoppingBag,
    MessageSquare,
    Package
} from "lucide-react";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: "Dashboard", path: "/home", icon: LayoutDashboard },
        { label: "Operators", path: "/operators", icon: Users, allowedRoles: ["Admin"] },
        { label: "Products", path: "/products", icon: Package },
        { label: "Tickets", path: "/tickets", icon: TicketCheck },
        { label: "Sellers", path: "/sellers", icon: Store },
        { label: "Buyers", path: "/buyers", icon: ShoppingBag },
        { label: "Messages", path: "/messages", icon: MessageSquare }
    ];

    return (
        <aside
            className={`
                fixed top-16 left-0 h-[calc(100vh-4rem)]
                bg-white border-r border-gray-200
                transition-all duration-300 ease-in-out z-40
                ${isSidebarOpen ? "w-64" : "w-20"}
            `}
            onMouseEnter={() => setIsSidebarOpen(true)}
            onMouseLeave={() => setIsSidebarOpen(false)}
        >
            <div className="flex flex-col h-full py-6">
                <nav className="flex-1">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            if (!item.allowedRoles || item.allowedRoles.includes(user?.role)) {
                                const Icon = item.icon;
                                return (
                                    <li key={item.label}>
                                        <button
                                            onClick={() => navigate(item.path)}
                                            className={`
                                                w-full flex items-center px-4 py-2 
                                                rounded-lg text-gray-600 
                                                hover:bg-gray-50 hover:text-blue-600 
                                                transition-all duration-300 ease-in-out
                                                ${location.pathname === item.path ? "bg-blue-50 text-blue-600" : ""}
                                            `}
                                        >
                                            <div className={`
                                                flex items-center justify-center
                                                min-w-[40px] w-10
                                                transition-all duration-300 ease-in-out
                                            `}>
                                                <Icon
                                                    size={20}
                                                    className="transform-gpu transition-transform duration-300 ease-in-out"
                                                />
                                            </div>
                                            <span className={`
                                                transform-gpu
                                                transition-all duration-300 ease-in-out
                                                ${isSidebarOpen
                                                    ? "opacity-100 translate-x-0 ml-3"
                                                    : "opacity-0 -translate-x-10 w-0 ml-0"
                                                }
                                            `}>
                                                {item.label}
                                            </span>
                                        </button>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
