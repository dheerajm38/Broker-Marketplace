import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
    Search, Plus, ChevronLeft, ChevronRight,
    Edit2, Trash2, X, Check, ArrowBigUp, ArrowBigDown, Eye
} from "lucide-react";
import NavigationBar from "./NavigationBar";
import Sidebar from "./Sidebar";
import ContentWrapper from "./layout/ContentWrapper";
import { api } from "./axiosConfig";

const ProductsContent = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("products");
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [newCategory, setNewCategory] = useState({ name: "", subcategories: [] });
    const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
    const [newSubcategory, setNewSubcategory] = useState({ name: "", description: "", categoryId: "" });
    const [isEditingSubcategory, setIsEditingSubcategory] = useState(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/product/all/user", {
                params: {
                    pageNumber: currentPage,
                    pageSize: itemsPerPage
                }
            });

            const { data, metadata } = response.data;
            setProducts(data);
            setTotalPages(metadata.totalPages);
            setTotalItems(metadata.totalItems);
            setError(null);
        } catch (err) {
            setError("Failed to load products. Please try again later.");
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get("/category/categories-with-subcategories");
            const categoriesData = response.data.data.map(category => ({
                id: category.category_id,
                name: category.name,
                description: category.description,
                subcategories: category.subcategories.map(sub => ({
                    id: sub.sub_category_id,
                    name: sub.name,
                    description: sub.description
                }))
            }));
            setCategories(categoriesData);
            setError(null);
        } catch (err) {
            setError("Failed to load categories. Please try again later.");
            console.error("Error fetching categories:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(
        (product) =>
            product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.seller?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProductEdit = (productId) => {
        navigate('/view-seller-product', {
            state: { productId }
        });
    };

    const handleSellerClick = (sellerId) => {
        console.log("Navigating to seller profile with ID:", sellerId);
        navigate('/seller-profile', {
            state: { sellerId: sellerId }
        });
    };

    const handleAddCategory = async () => {
        try {
            await api.post("/category/create", {
                name: newCategory.name,
                description: newCategory.description // Add description
            });
            await fetchCategories();
            setShowCategoryModal(false);
            // Reset the form
            setNewCategory({ name: "", description: "", subcategories: [] });
        } catch (err) {
            console.error("Error adding category:", err);
            alert("Failed to add category");
        }
    };

    const handleUpdateCategory = async () => {
        try {
            await api.put(`/category/update/${editingCategory.id}`, {
                name: editingCategory.name,
                description: editingCategory.description
            });
            await fetchCategories();
            setShowCategoryModal(false);
            setEditingCategory(null);
        } catch (err) {
            console.error("Error updating category:", err);
            alert("Failed to update category");
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await api.delete(`/category/delete/${categoryId}`);
                await fetchCategories();
            } catch (err) {
                console.error("Error deleting category:", err);
                alert("Failed to delete category");
            }
        }
    };

    const handleAddSubcategory = async (categoryId, subcategoryName) => {
        try {
            await api.post("/subcategory/create", {
                category_id: categoryId,
                name: subcategoryName
            });
            await fetchCategories();
        } catch (err) {
            console.error("Error adding subcategory:", err);
            alert("Failed to add subcategory");
        }
    };

    const handleDeleteSubcategory = async (categoryId, subCategoryId) => {
        if (window.confirm("Are you sure you want to delete this subcategory?")) {
            try {
                await api.delete(`/subcategory/delete/${subCategoryId}`);
                await fetchCategories();
            } catch (err) {
                console.error("Error deleting subcategory:", err);
                alert("Failed to delete subcategory");
            }
        }
    };

    const handleAddNewSubcategory = () => {
        if (editingCategory) {
            setEditingCategory({
                ...editingCategory,
                subcategories: [
                    ...editingCategory.subcategories,
                    { id: `temp-${Date.now()}`, name: "" }
                ]
            });
        }
    };

    const handleSubcategoryChange = (index, value) => {
        if (editingCategory) {
            const updatedSubcategories = [...editingCategory.subcategories];
            updatedSubcategories[index] = {
                ...updatedSubcategories[index],
                name: value
            };
            setEditingCategory({
                ...editingCategory,
                subcategories: updatedSubcategories
            });
        }
    };

    const handleAddSubcategoryClick = (categoryId) => {
        setNewSubcategory({ name: "", description: "", categoryId });
        setShowSubcategoryModal(true);
    };

    const handleAddSubcategorySubmit = async () => {
        try {
            await api.post("/subcategory/create", {
                category_id: newSubcategory.categoryId,
                name: newSubcategory.name,
                description: newSubcategory.description
            });
            await fetchCategories();
            setShowSubcategoryModal(false);
            setNewSubcategory({ name: "", description: "", categoryId: "" });
        } catch (err) {
            console.error("Error adding subcategory:", err);
            alert("Failed to add subcategory");
        }
    };

    const handleUpdateSubcategory = async (subCategoryId, updatedData) => {
        try {
            await api.put(`/subcategory/update/${subCategoryId}`, updatedData);
            await fetchCategories();
            setIsEditingSubcategory(null);
        } catch (err) {
            console.error("Error updating subcategory:", err);
            alert("Failed to update subcategory");
        }
    };

    // Update the closeModal function and add it to the component
    const closeModal = () => {
        setShowCategoryModal(false);
        setEditingCategory(null); // Reset editing state
        setNewCategory({ name: "", description: "", subcategories: [] }); // Reset new category state
    };

    const handleDeleteProduct = async (productId) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await api.delete(`/product/delete?product_id=${productId}`);
                fetchProducts(); // Refresh the list
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product');
            }
        }
    };

    const handlePriceEdit = async (product) => {
          try {
            console.log("PRODUCT ", product)
                await api.put(`/product/update/price`, {
                    product_id: product.id,
                    price: Number(product.editPriceValue)
                });
                // Refresh products after update
                fetchProducts();
            } catch (err) {
                alert("Failed to update price");
            } finally {
                setProducts((prev) =>
                    prev.map((p) =>
                        p.id === product.id
                            ? { ...p, isEditingPrice: false }
                            : p
                    )
                );
            }
    }
    

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setActiveTab("products")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "products"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Products
                        </button>
                        <button
                            onClick={() => setActiveTab("categories")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "categories"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            Categories
                        </button>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        {activeTab === "products" && (
                            <button
                                onClick={() => navigate('/add-seller-product')}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                                Add Product
                            </button>
                        )}
                        {activeTab === "categories" ? (
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Plus className="h-5 w-5 text-gray-600" />
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Products Table */}
                {activeTab === "products" && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Seller
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Last Updated By
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{product.category}</div>
                                                <div className="text-xs text-gray-500">{product.subcategory}</div>
                                            </td>
                                                

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm flex items-center">
                                                    {/* Editable Price Section */}
                                                    {product.isEditingPrice ? (
                                                        <>
                                                            <input
                                                                type="number"
                                                                value={product.editPriceValue}
                                                                onChange={(e) => {
                                                                    const newValue = e.target.value;
                                                                    setProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.id === product.id
                                                                                ? { ...p, editPriceValue: newValue }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                                className="w-20 px-2 py-1 border rounded text-gray-900"
                                                            />
                                                            <button
                                                                className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                                onClick={()=>handlePriceEdit(product)}
                                                                  
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                className="ml-1 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                                onClick={() => {
                                                                    setProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.id === product.id
                                                                                ? { ...p, isEditingPrice: false }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-gray-900">₹{product.price}</span>
                                                            <button
                                                                className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                                                onClick={() => {
                                                                    setProducts((prev) =>
                                                                        prev.map((p) =>
                                                                            p.id === product.id
                                                                                ? { ...p, isEditingPrice: true, editPriceValue: p.price }
                                                                                : p
                                                                        )
                                                                    );
                                                                }}
                                                                title="Edit Price"
                                                            >
                                                                Edit
                                                            </button>
                                                        </>
                                                    )}
                                                    {product.last_price && product.last_price != 0 ? (
                                                        <>
                                                            {product.last_price < 0 ? (
                                                                <span className="px-3 text-green-600 flex items-center gap-0.5">
                                                                    
                                                                     <ArrowBigUp />
                                                                    <span className="font-bold">{Math.abs(product.last_price)}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="px-3 text-red-600 flex items-center gap-0.5">
                                                                    <ArrowBigDown />
                                                                    <span className="font-bold">{Math.abs(product.last_price)}</span>
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    per {product.price_details?.quantity} KG
                                                </div>
                                                                                          
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <button
                                                        onClick={() => handleSellerClick(product.seller_id)}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                    >
                                                        {product.seller_name}
                                                    </button>
                                                    <span className="text-xs text-gray-500">{product.seller_company}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{product.updatedBy ? product.updatedBy['user_name'] : null}</div>
                                                <div className="text-xs text-gray-500">
                                                    {product.updatedAt}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleProductEdit(product.id)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Eye className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-500">
                                    Showing {Math.min(((currentPage - 1) * itemsPerPage) + 1, totalItems)} to{" "}
                                    {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                                </div>
                                <div className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 rounded-md transition-colors ${currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 rounded-md transition-colors ${currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Management */}
                {activeTab === "categories" && (
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Add New Category Card */}
                                <div
                                    onClick={() => {
                                        setEditingCategory(null); // Reset editing state
                                        setNewCategory({ name: "", description: "", subcategories: [] }); // Reset new category state
                                        setShowCategoryModal(true);
                                    }}
                                    className="border-2 border-dashed border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200 flex items-center justify-center"
                                >
                                    <div className="text-center">
                                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <span className="text-sm font-medium text-gray-600">Add New Category</span>
                                    </div>
                                </div>

                                {/* Category Cards */}
                                {categories.map((category) => (
                                    <div key={category.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {category.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">{category.description}</p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingCategory(category);
                                                            setShowCategoryModal(true);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                        className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {category.subcategories.map((sub) => (
                                                    <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md group">
                                                        <div className="flex-grow">
                                                            {isEditingSubcategory === sub.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={sub.name}
                                                                        onChange={(e) => {
                                                                            const updatedSubcategories = category.subcategories.map(s =>
                                                                                s.id === sub.id ? { ...s, name: e.target.value } : s
                                                                            );
                                                                            setCategories(categories.map(c =>
                                                                                c.id === category.id ? { ...c, subcategories: updatedSubcategories } : c
                                                                            ));
                                                                        }}
                                                                        className="w-full px-2 py-1 text-sm border rounded-md"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleUpdateSubcategory(sub.id, { name: sub.name, description: sub.description })}
                                                                        className="p-1 text-green-600 hover:bg-green-50 rounded-md"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setIsEditingSubcategory(null)}
                                                                        className="p-1 text-red-600 hover:bg-red-50 rounded-md"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-700">{sub.name}</span>
                                                                    <p className="text-xs text-gray-500">{sub.description}</p>
                                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                                                        <button
                                                                            onClick={() => setIsEditingSubcategory(sub.id)}
                                                                            className="p-1 rounded-md hover:bg-blue-50 text-blue-600 transition-all"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSubcategory(category.id, sub.id)}
                                                                            className="p-1 rounded-md hover:bg-red-50 text-red-500 transition-all"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => handleAddSubcategoryClick(category.id)}
                                                    className="w-full mt-2 py-1.5 px-3 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Add Subcategory
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Modal */}
                {showCategoryModal && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                closeModal();
                            }
                        }}
                    >
                        <div className="bg-white rounded-lg w-full max-w-md mx-4">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {editingCategory ? "Edit Category" : "Add New Category"}
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCategory?.name || newCategory.name}
                                        onChange={(e) =>
                                            editingCategory
                                                ? setEditingCategory({ ...editingCategory, name: e.target.value })
                                                : setNewCategory({ ...newCategory, name: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter category name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editingCategory?.description || newCategory.description}
                                        onChange={(e) =>
                                            editingCategory
                                                ? setEditingCategory({ ...editingCategory, description: e.target.value })
                                                : setNewCategory({ ...newCategory, description: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter category description"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    {editingCategory ? "Update Category" : "Add Category"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Subcategory Modal */}
                {showSubcategoryModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg w-full max-w-md mx-4">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Add Subcategory
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subcategory Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newSubcategory.name}
                                        onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter subcategory name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newSubcategory.description}
                                        onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter subcategory description"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSubcategoryModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSubcategorySubmit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                >
                                    Add Subcategory
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProductsScreen() {
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
                <ProductsContent isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}