import { X, Menu, Bell } from "lucide-react";
import { Link } from "react-router";
import UserMenu from "./UserMenu";

export default function NavigationBar({ toggleSidebar, isSidebarOpen }) {
    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
            <div className="flex items-center justify-between h-full pl-4 pr-6 ">
                {/* Left side - Menu button and Logo */}
                <div className="flex items-center space-x-4">
                    <button
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                        onClick={toggleSidebar}
                    >
                        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Marketplace
                    </span>
                </div>

                {/* Right side - Notifications and User Menu */}
                <div className="flex items-center space-x-2">
                    <Link to="/notifications">
                        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors relative">
                            <Bell size={22} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </Link>
                    <UserMenu />
                </div>
            </div>
        </nav>
    );
}
