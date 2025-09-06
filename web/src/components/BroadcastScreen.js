import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Edit, 
    Trash2, 
    Eye, 
    X, 
    Save, 
    Calendar,
    User,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { useAuth } from '../contexts/authContext';
import { 
    fetchBroadcasts, 
    createBroadcast, 
    updateBroadcast, 
    deleteBroadcast 
} from './api/BroadcastApi';
import Sidebar from './Sidebar';
import NavigationBar from './NavigationBar';

// Modal component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <X size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default function BroadcastScreen() {
    const { user } = useAuth();
    const [broadcasts, setBroadcasts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedBroadcast, setSelectedBroadcast] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});

    // Check if user has permission to manage broadcasts
    const canManageBroadcasts = user?.role === 'Admin' || user?.role === 'Operator';

    useEffect(() => {
        loadBroadcasts();
    }, [currentPage]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const loadBroadcasts = async () => {
        try {
            setLoading(true);
            const response = await fetchBroadcasts(currentPage, 10, 'desc');
            setBroadcasts(response.data);
            setTotalPages(response.pagination.total_pages);
            setError(null);
        } catch (err) {
            setError('Failed to load broadcasts');
            console.error('Error loading broadcasts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBroadcast = async () => {
        try {
            setFormErrors({});
            
            // Validation
            const errors = {};
            if (!formData.title.trim()) errors.title = 'Title is required';
            if (!formData.description.trim()) errors.description = 'Description is required';
            
            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                return;
            }

            await createBroadcast(formData);
            setShowCreateModal(false);
            setFormData({ title: '', description: '' });
            loadBroadcasts();
        } catch (err) {
            setError('Failed to create broadcast');
            console.error('Error creating broadcast:', err);
        }
    };

    const handleUpdateBroadcast = async () => {
        try {
            setFormErrors({});
            
            // Validation
            const errors = {};
            if (!formData.title.trim()) errors.title = 'Title is required';
            if (!formData.description.trim()) errors.description = 'Description is required';
            
            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                return;
            }

            await updateBroadcast(selectedBroadcast.broadcast_id, formData);
            setShowEditModal(false);
            setSelectedBroadcast(null);
            setFormData({ title: '', description: '' });
            loadBroadcasts();
        } catch (err) {
            setError('Failed to update broadcast');
            console.error('Error updating broadcast:', err);
        }
    };

    const handleDeleteBroadcast = async () => {
        try {
            await deleteBroadcast(selectedBroadcast.broadcast_id);
            setShowDeleteModal(false);
            setSelectedBroadcast(null);
            loadBroadcasts();
        } catch (err) {
            setError('Failed to delete broadcast');
            console.error('Error deleting broadcast:', err);
        }
    };

    const openEditModal = (broadcast) => {
        setSelectedBroadcast(broadcast);
        setFormData({
            title: broadcast.title,
            description: broadcast.description
        });
        setShowEditModal(true);
    };

    const openViewModal = (broadcast) => {
        setSelectedBroadcast(broadcast);
        setShowViewModal(true);
    };

    const openDeleteModal = (broadcast) => {
        setSelectedBroadcast(broadcast);
        setShowDeleteModal(true);
    };

    const formatDate = (dateString) => {
        console.log("date string value is ",dateString);
        try {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <NavigationBar 
                isSidebarOpen={isSidebarOpen} 
                setIsSidebarOpen={setIsSidebarOpen} 
            />
            <div className="flex flex-1 pt-16 overflow-hidden">
                <Sidebar 
                    isSidebarOpen={isSidebarOpen} 
                    setIsSidebarOpen={setIsSidebarOpen} 
                />
                <main className={`flex-1 overflow-y-auto ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'} transition-all duration-300`}>
                    <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Broadcasts</h1>
                    <p className="text-gray-600 mt-1">Manage system-wide announcements and notifications</p>
                </div>
                {canManageBroadcasts && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        New Broadcast
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <div className="grid gap-4">
                        {broadcasts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <AlertCircle size={48} className="mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No broadcasts found</h3>
                                <p className="text-gray-500">No broadcast messages have been created yet.</p>
                            </div>
                        ) : (
                            broadcasts.map((broadcast) => {
                                console.log('Broadcast:', broadcast);
                                return (
                                    <div
                                        key={broadcast.broadcast_id}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-800">
                                                        {broadcast.title}
                                                    </h3>

                                                </div>
                                                <p className="text-gray-600 mb-3 line-clamp-2">
                                                    {broadcast.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={16} />
                                                        {formatDate(broadcast.createdAt)}
                                                    </div>
                                                    {broadcast.updatedAt && broadcast.updatedAt !== broadcast.createdAt && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock size={16} />
                                                            Updated: {formatDate(broadcast.updatedAt)}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <User size={16} />
                                                        ID: {broadcast.created_by}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => openViewModal(broadcast)}
                                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {canManageBroadcasts && (
                                                    <>
                                                        <button
                                                            onClick={() => openEditModal(broadcast)}
                                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Edit broadcast"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(broadcast)}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete broadcast"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-6">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-2 text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Broadcast Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setFormData({ title: '', description: '' });
                    setFormErrors({});
                }}
                title="Create New Broadcast"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter broadcast title"
                        />
                        {formErrors.title && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter broadcast description"
                        />
                        {formErrors.description && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setShowCreateModal(false);
                                setFormData({ title: '', description: '' });
                                setFormErrors({});
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateBroadcast}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Save size={16} />
                            Create Broadcast
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Broadcast Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedBroadcast(null);
                    setFormData({ title: '', description: '' });
                    setFormErrors({});
                }}
                title="Edit Broadcast"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.title ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter broadcast title"
                        />
                        {formErrors.title && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                formErrors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter broadcast description"
                        />
                        {formErrors.description && (
                            <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setShowEditModal(false);
                                setSelectedBroadcast(null);
                                setFormData({ title: '', description: '' });
                                setFormErrors({});
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateBroadcast}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Save size={16} />
                            Update Broadcast
                        </button>
                    </div>
                </div>
            </Modal>

            {/* View Broadcast Modal */}
            <Modal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedBroadcast(null);
                }}
                title="Broadcast Details"
            >
                {selectedBroadcast && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title
                            </label>
                            <p className="text-gray-900 font-medium">{selectedBroadcast.title}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <p className="text-gray-900 whitespace-pre-wrap">{selectedBroadcast.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created
                                </label>
                                <p className="text-gray-600 text-sm">{formatDate(selectedBroadcast.created_at)}</p>
                            </div>
                            {selectedBroadcast.updated_at && selectedBroadcast.updated_at !== selectedBroadcast.created_at && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Updated
                                    </label>
                                    <p className="text-gray-600 text-sm">{formatDate(selectedBroadcast.updated_at)}</p>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Created By
                                </label>
                                <p className="text-gray-600 text-sm">{selectedBroadcast.created_by}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Broadcast ID
                                </label>
                                <p className="text-gray-600 text-sm font-mono">{selectedBroadcast.broadcast_id}</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => {
                                    setShowViewModal(false);
                                    setSelectedBroadcast(null);
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setSelectedBroadcast(null);
                }}
                title="Delete Broadcast"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="text-red-600" size={24} />
                        <div>
                            <h3 className="font-medium text-red-800">Are you sure?</h3>
                            <p className="text-red-600 text-sm">
                                This action cannot be undone. This will permanently delete the broadcast.
                            </p>
                        </div>
                    </div>
                    {selectedBroadcast && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-800 mb-1">{selectedBroadcast.title}</p>
                            <p className="text-gray-600 text-sm">{selectedBroadcast.description}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            onClick={() => {
                                setShowDeleteModal(false);
                                setSelectedBroadcast(null);
                            }}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteBroadcast}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                            <Trash2 size={16} />
                            Delete Broadcast
                        </button>
                    </div>
                </div>
            </Modal>
                    </div>
                </main>
            </div>
        </div>
    );
}