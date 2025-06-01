import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { api } from "./axiosConfig";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import { PenSquare, X, Plus, Trash2 } from "lucide-react";
import ContentWrapper from "./layout/ContentWrapper";

// Import product images
import ctCake from "../assets/ct-cake.jpeg";
import ctnCake from "../assets/ctn-cake.jpeg";
import cottonCake from "../assets/cotton-cake-cattle-feed.jpg";

const ViewProduct = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { productId } = location.state || {};
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newImages, setNewImages] = useState([]);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const MAX_ALLOWED_IMAGES_LIMIT = 5;

    // Invariant: product.images.length - imagesToDelete.length + newImages.length <= 5

    useEffect(() => {
        const fetchAllData = async () => {
            if (!productId) {
                setError("No product ID provided");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Fetch product details
                const productResponse = await api.get(`/product/${productId}`);

                console.log(productResponse.data);
                console.log(productResponse.data.imageUrls);

                // Fetch categories
                const categoriesResponse = await api.get(
                    "/category/categories-with-subcategories"
                );

                if (productResponse.data.status === "success") {
                    const productData = {
                        id: productResponse.data.data.product_id,
                        name: productResponse.data.data.name,
                        productCategory:
                            productResponse.data.data.category?.category_name,
                        subcategory:
                            productResponse.data.data.sub_category
                                ?.sub_category_name,
                        category_id:
                            productResponse.data.data.category?.category_id,
                        subcategory_id:
                            productResponse.data.data.sub_category
                                ?.sub_category_id,
                        price: productResponse.data.data.price,
                        price_details: {
                            unit:
                                productResponse.data.data.price_details?.unit ||
                                "per_kg",
                            quantity:
                                productResponse.data.data.price_details
                                    ?.quantity || 1,
                        },
                        seller: productResponse.data.data.seller_name,
                        seller_id: productResponse.data.data.seller_id,
                        status: productResponse.data.data.status,
                        createdAt: productResponse.data.data.createdAt,
                        images: productResponse.data.data.images || [],
                        description: productResponse.data.data.description,
                    };

                    console.log(productData.images);

                    setProduct(productData);
                    setCategories(categoriesResponse.data.data);

                    // Get subcategories for the current category
                    if (productData.category_id) {
                        const subCatResponse = await api.get(
                            `/subcategory/${productData.category_id}`
                        );
                        setSubcategories(subCatResponse.data.data);
                    }

                    setError(null);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [productId]);

    const fetchSubcategories = async (categoryId) => {
        try {
            const response = await api.get(`/subcategory/${categoryId}`);
            if (response.data.success) {
                // Changed from status to success
                setSubcategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching subcategories:", error);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setNewImages([]);
        setImagesToDelete([]);
        fetchProductDetails();
    };

    const handleSave = async () => {
        try {
            console.log("Current images:", product.images);
            console.log("New images to add:", newImages);
            console.log("Images to delete:", imagesToDelete);
            const totalImages =
                product.images.length -
                imagesToDelete.length +
                newImages.length;
            if (totalImages > MAX_ALLOWED_IMAGES_LIMIT) {
                throw new Error(
                    `You can upload atmost ${MAX_ALLOWED_IMAGES_LIMIT} images per product`
                );
            }

            // Create FormData for multipart/form-data request
            const productFormData = new FormData();

            // Add basic product information
            productFormData.append("product_id", product.id);
            productFormData.append("name", product.name);
            productFormData.append("price", Number(product.price));
            productFormData.append("status", product.status);
            productFormData.append("description", product.description || "");
            productFormData.append("seller_id", product.seller_id);

            // Add category information - match the structure expected by the backend
            productFormData.append(
                "category[category_id]",
                product.category_id
            );
            productFormData.append(
                "category[category_name]",
                product.productCategory
            );

            // Add subcategory information
            productFormData.append(
                "sub_category[sub_category_id]",
                product.subcategory_id
            );
            productFormData.append(
                "sub_category[sub_category_name]",
                product.subcategory
            );

            // Add price details fields
            productFormData.append(
                "price_details[unit]",
                product.price_details.unit
            );
            productFormData.append(
                "price_details[quantity]",
                product.price_details.quantity
            );

            // Add existing images that are not marked for deletion
            const imagesToKeep = [...product.images].filter(
                (img) => !imagesToDelete.includes(img)
            );

            // Send existing images as a JSON string
            productFormData.append("images", JSON.stringify(imagesToKeep));

            // Send images to be deleted
            if (imagesToDelete.length > 0) {
                productFormData.append(
                    "imagesToBeDeleted",
                    JSON.stringify(imagesToDelete)
                );
            }

            // Add user information if available (based on your server code)
            // if (userInfo) {
            //     productFormData.append("userInfo", JSON.stringify(userInfo));
            // }

            // Add new image files
            // In your frontend, check that newImages contains actual File objects
            if (newImages.length > 0) {
                newImages.forEach((image, index) => {
                    console.log(
                        `Appending file: ${image.name}, type: ${image.type}, size: ${image.size}`
                    );
                    productFormData.append("newImages", image);
                });
            }

            // Debug the FormData before sending
            console.log("Form data being sent:");
            for (let pair of productFormData.entries()) {
                console.log(
                    pair[0] +
                        ": " +
                        (pair[1] instanceof File
                            ? `File: ${pair[1].name}`
                            : pair[1])
                );
            }

            const response = await api.put(
                `/product/update?seller_id=${product.seller_id}`,
                productFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.status === "success") {
                // Update the product state with the returned data
                setProduct({
                    id: response.data.data.product_id,
                    name: response.data.data.name,
                    productCategory: response.data.data.category?.category_name,
                    subcategory:
                        response.data.data.sub_category?.sub_category_name,
                    category_id: response.data.data.category?.category_id,
                    subcategory_id:
                        response.data.data.sub_category?.sub_category_id,
                    price: response.data.data.price,
                    price_details: response.data.data.price_details,
                    seller: response.data.data.seller_name,
                    seller_id: response.data.data.seller_id,
                    status: response.data.data.status,
                    createdAt: response.data.data.createdAt,
                    images: response.data.data.images || [],
                    description: response.data.data.description,
                });

                alert("Product updated successfully!");
                setIsEditing(false);
                setNewImages([]);
                setImagesToDelete([]);
            }
        } catch (error) {
            console.error("Failed to update product:", error);
            alert(
                "Failed to update product: " +
                    (error.response?.data?.message ||
                        error.message ||
                        "Unknown error")
            );
        }
    };

    const fetchProductDetails = async () => {
        try {
            const response = await api.get(`/product/${productId}`);
            if (response.data.status === "success") {
                const productData = {
                    id: response.data.data.product_id,
                    name: response.data.data.name,
                    productCategory: response.data.data.category?.category_name,
                    subcategory:
                        response.data.data.sub_category?.sub_category_name,
                    category_id: response.data.data.category?.category_id,
                    subcategory_id:
                        response.data.data.sub_category?.sub_category_id,
                    price: response.data.data.price,
                    price_details: response.data.data.price_details,
                    seller: response.data.data.seller_name,
                    seller_id: response.data.data.seller_id,
                    status: response.data.data.status,
                    createdAt: response.data.data.createdAt,
                    images: response.data.data.images || [],
                    description: response.data.data.description,
                };
                setProduct(productData);
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
        }
    };

    const handlePriceChange = (e) => {
        setProduct({ ...product, price: e.target.value });
    };

    const handleUnitChange = (e) => {
        setProduct({ ...product, unit: e.target.value });
    };

    const handleImageUpload = (e) => {
        let files = Array.from(e.target.files);
        // const uploadedImagesCount = files.length;
        // console.log("Count of uploaded images: " + uploadedImagesCount);
        // // const effectiveLength = process.env.MAX_ALLOWED_IMAGES - imagesToDelete.length - product.images.length;
        // const effectiveLength =
        //     MAX_ALLOWED_IMAGES_LIMIT -
        //     imagesToDelete.length -
        //     product.images.length;
        // console.log("Effective length: " + effectiveLength);
        // files = files.slice(0, Math.min(files.length, effectiveLength));
        setNewImages((prev) => [...prev, ...files]);
    };

    const handleDeleteImage = (index, isNew = false) => {
        if (isNew) {
            setNewImages((prev) => prev.filter((_, i) => i !== index));
        } else {
            setImagesToDelete((prev) => [...prev, product.images[index]]);
            setProduct((prev) => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index),
            }));
        }
    };

    const inputClassName = (isEditing) =>
        `mt-1 block w-full px-3 py-2 rounded-md text-gray-900 transition-all duration-200 ${
            isEditing
                ? "bg-white border-2 border-blue-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                : "bg-gray-50 border border-gray-200 focus:outline-none cursor-default"
        }`;

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="text-red-500">{error}</div>
                <button
                    onClick={() => navigate("/products")}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Back to Products
                </button>
            </div>
        );
    }

    if (!product) {
        return <div className="p-4">Product not found</div>;
    }

    return (
        <div className="h-full">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Product Details
                    </h1>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <button
                                onClick={handleEdit}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                            >
                                <PenSquare className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                            </button>
                        ) : (
                            <button
                                onClick={handleCancel}
                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors group"
                            >
                                <X className="h-5 w-5 text-red-600 group-hover:text-red-700" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Details Card */}
                <div
                    className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ${
                        isEditing ? "ring-2 ring-blue-100" : ""
                    }`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Name */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Product Name
                            </h3>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) =>
                                        setProduct({
                                            ...product,
                                            name: e.target.value,
                                        })
                                    }
                                    className={inputClassName(isEditing)}
                                    placeholder="Enter product name"
                                />
                            ) : (
                                <p className="text-gray-900">{product.name}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Category
                            </h3>
                            {isEditing ? (
                                <select
                                    value={product.productCategory}
                                    onChange={(e) => {
                                        const selectedCategory =
                                            categories.find(
                                                (cat) =>
                                                    cat.name === e.target.value
                                            );
                                        setProduct({
                                            ...product,
                                            productCategory: e.target.value,
                                            category_id:
                                                selectedCategory?.category_id,
                                        });
                                        // Fetch subcategories for selected category
                                        fetchSubcategories(
                                            selectedCategory?.category_id
                                        );
                                    }}
                                    className={inputClassName(isEditing)}
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category.category_id}
                                            value={category.name}
                                        >
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-gray-900">
                                    {product.productCategory}
                                </p>
                            )}
                        </div>

                        {/* Subcategory */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Subcategory
                            </h3>
                            {isEditing ? (
                                <select
                                    value={product.subcategory}
                                    onChange={(e) => {
                                        const selectedSubCategory =
                                            subcategories.find(
                                                (sub) =>
                                                    sub.name === e.target.value
                                            );
                                        setProduct({
                                            ...product,
                                            subcategory: e.target.value,
                                            subcategory_id:
                                                selectedSubCategory?.sub_category_id,
                                        });
                                    }}
                                    className={inputClassName(isEditing)}
                                    disabled={!product.category_id}
                                >
                                    <option value="">Select Subcategory</option>
                                    {subcategories.map((sub) => (
                                        <option
                                            key={sub.sub_category_id}
                                            value={sub.name}
                                        >
                                            {sub.name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-gray-900">
                                    {product.subcategory}
                                </p>
                            )}
                        </div>

                        {/* Price */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Price (₹)
                            </h3>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={product.price}
                                    onChange={handlePriceChange}
                                    className={inputClassName(isEditing)}
                                    placeholder="Enter price"
                                />
                            ) : (
                                <p className="text-gray-900">
                                    ₹{product.price}
                                </p>
                            )}
                        </div>

                        {/* Unit */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Unit
                            </h3>
                            {isEditing ? (
                                <select
                                    value={product.price_details?.unit}
                                    onChange={(e) =>
                                        setProduct({
                                            ...product,
                                            price_details: {
                                                ...product.price_details,
                                                unit: e.target.value,
                                            },
                                        })
                                    }
                                    className={inputClassName(isEditing)}
                                >
                                    <option value="per_kg">Per Kg</option>
                                    <option value="per_quintal">
                                        Per Quintal
                                    </option>
                                    <option value="per_ton">Per Ton</option>
                                </select>
                            ) : (
                                <p className="text-gray-900">
                                    {product.price_details?.unit}
                                </p>
                            )}
                        </div>

                        {/* Quantity */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Quantity
                            </h3>
                            {isEditing ? (
                                <input
                                    type="number"
                                    value={product.price_details?.quantity}
                                    onChange={(e) =>
                                        setProduct({
                                            ...product,
                                            price_details: {
                                                ...product.price_details,
                                                quantity: parseInt(
                                                    e.target.value
                                                ),
                                            },
                                        })
                                    }
                                    className={inputClassName(isEditing)}
                                    min="1"
                                />
                            ) : (
                                <p className="text-gray-900">
                                    {product.price_details?.quantity}
                                </p>
                            )}
                        </div>

                        {/* Non-editable fields */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Seller
                            </h3>
                            <p className="text-gray-900">{product.seller}</p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Added On
                            </h3>
                            <p className="text-gray-900">
                                {new Date(
                                    product.createdAt
                                ).toLocaleDateString()}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-1">
                                Status
                            </h3>
                            <p
                                className={`inline-flex px-2 py-1 rounded-full text-sm ${
                                    product.status === "active"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                            >
                                {product.status}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Product Images Card */}
                <div
                    className={`bg-white rounded-lg shadow-sm p-6 transition-all duration-200 ${
                        isEditing ? "ring-2 ring-blue-100" : ""
                    }`}
                >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Product Images
                        </h2>
                        {isEditing && (
                            <div className="relative">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label
                                    htmlFor="image-upload"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Images
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {product?.images?.map((image, index) => (
                            <div
                                key={`existing-${index}`}
                                className="relative group rounded-lg overflow-hidden shadow-md border"
                            >
                                <img
                                    src={image}
                                    alt={`Product ${index + 1}`}
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                {isEditing && (
                                    <button
                                        onClick={() => handleDeleteImage(index)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {/* {newImages.map((image, index) => (
                            <div
                                key={`new-${index}`}
                                className="relative group rounded-lg overflow-hidden shadow-md border"
                            >
                                <img
                                    src={image}
                                    alt={`New Product ${index + 1}`}
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() =>
                                        handleDeleteImage(index, true)
                                    }
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))} */}
                        {newImages.map((image, index) => (
                            <div
                                key={`new-${index}`}
                                className="relative group rounded-lg overflow-hidden shadow-md border"
                            >
                                <img
                                    src={URL.createObjectURL(image)} // Create URL here for display only
                                    alt={`New Product ${index + 1}`}
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <button
                                    onClick={() =>
                                        handleDeleteImage(index, true)
                                    }
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ViewSellerProductScreen() {
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
                <ViewProduct isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
