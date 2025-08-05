import React, { useState, useRef, useEffect } from "react";
import { PenSquare, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import NavigationBar from "./NavigationBar";
import ContentWrapper from "./layout/ContentWrapper";
import { fetchCategories, fetchSubCategory } from "./seller/api/api";
import { api } from "./axiosConfig";

const OnboardProduct = ({ isSidebarOpen }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { sellerData } = location.state || {};

    // Add fileInputRef definition
    const fileInputRef = useRef(null);

    // Add new state for sellers list
    const [sellers, setSellers] = useState([]);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add useEffect to fetch sellers if no sellerData is provided
    useEffect(() => {
        const fetchSellers = async () => {
            if (!sellerData) {
                try {
                    const response = await api.get("/user/role/seller");
                    if (response.data.success) {
                        setSellers(response.data.data);
                    }
                } catch (error) {
                    console.error("Error fetching sellers:", error);
                }
            }
        };
        fetchSellers();
    }, [sellerData]);

    // Update formData initialization
    const [formData, setFormData] = useState({
        productName: "",
        category: "",
        subcategory: "",
        price: 0,
        priceUnit: "per_kg",
        quantity: 1,
        description: "",
        images: [],
    });

    const [imagePreview, setImagePreview] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchCategories();
                setCategories(response);
                const subCategoriesResponse = await fetchSubCategory();
                setSubcategories(response);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, []);

    const priceUnitOptions = [
        { value: "per_kg", label: "Per Kg" },
        // { value: "per_quintal", label: "Per Quintal" },
        // { value: "per_ton", label: "Per Ton" },
    ];

    const handleCategoryChange = async (e) => {
        const selectedValue = e.target.value;
        const selectedCategory = categories.find(
            (cat) => cat.name === selectedValue
        );
        setFormData({
            ...formData,
            category: selectedValue,
            subcategory: "",
        });
        try {
            const response = await fetchSubCategory(
                selectedCategory.category_id
            );
            console.log("Subcategories", response);
            setSubcategories(response);
        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // const handleImageChange = (e) => {
    //     const files = Array.from(e.target.files);
    //     const newImages = [];
    //     const newPreviews = [];

    //     files.forEach((file) => {
    //         // Existing file type and size validations
    //         const validTypes = ["image/jpeg", "image/png", "image/gif"];
    //         if (!validTypes.includes(file.type)) {
    //             alert("Please upload valid image files (PNG, JPG, or GIF)");
    //             return;
    //         }

    //         if (file.size > 5 * 1024 * 1024) {
    //             alert("File size must be less than 5 MB");
    //             return;
    //         }

    //         newImages.push(file);

    //         // Create preview
    //         const reader = new FileReader();
    //         reader.onloadend = () => {
    //             newPreviews.push(reader.result);
    //             if (newPreviews.length === files.length) {
    //                 setImagePreview((prev) => [...prev, ...newPreviews]);
    //             }
    //         };
    //         reader.readAsDataURL(file);
    //     });

    //     setFormData((prev) => ({
    //         ...prev,
    //         images: [...prev.images, ...newImages],
    //     }));
    // };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Update image previews
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImagePreview((prev) => [...prev, ...newPreviews]);

        // Update form data with actual files
        setFormData((prev) => ({
            ...prev,
            images: [...(prev.images || []), ...files],
        }));
    };

    const removeImage = (indexToRemove) => {
        setImagePreview((prev) =>
            prev.filter((_, index) => index !== indexToRemove)
        );
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const selectedSubCategory = subcategories.find(
                (cat) => cat.name === formData.subcategory
            );
            const selectedCategory = categories.find(
                (cat) => cat.name === formData.category
            );

            console.log("Selected Category:", selectedCategory);
            console.log("Selected SubCategory:", selectedSubCategory);

            if (!selectedCategory || !selectedSubCategory) {
                alert("Please select both category and subcategory");
                setIsSubmitting(false);
                return;
            }

            // Get seller_id based on scenario
            const seller_id = sellerData?.user_id || selectedSeller?.user_id;

            if (!seller_id) {
                alert("Please select a seller");
                setIsSubmitting(false);
                return;
            }

            // Create FormData for multipart/form-data request
            const productFormData = new FormData();

            // Add text fields - ensure field names match exactly what backend expects
            productFormData.append("name", formData.productName);
            productFormData.append("categoryID", selectedCategory.category_id);
            productFormData.append(
                "subCategoryID",
                selectedSubCategory.sub_category_id
            );
            productFormData.append("description", formData.description || "");
            productFormData.append("price", parseFloat(formData.price));

            // Add price details fields correctly
            productFormData.append("price_details[unit]", formData.priceUnit);
            productFormData.append(
                "price_details[quantity]",
                parseInt(formData.quantity)
            );

            // Add image files
            formData.images.forEach((image) => {
                productFormData.append("images", image);
            });

            // Debug the FormData before sending
            console.log("Form data being sent:");
            for (let pair of productFormData.entries()) {
                console.log(pair[0] + ": " + pair[1]);
            }

            // Make the request
            const response = await api.post(
                `/product/add?seller_id=${seller_id}`,
                productFormData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (response.data.status === "success") {
                alert("Product added successfully!");
                navigate("/products");
            }
        } catch (error) {
            console.error("Error adding product:", error);
            alert(
                error.response?.data?.message ||
                    "Failed to add product. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">
                        Add Product for Seller
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Seller
                                </label>
                                {sellerData ? (
                                    <input
                                        type="text"
                                        value={
                                            sellerData?.personal_details
                                                ?.fullName || ""
                                        }
                                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-not-allowed"
                                        disabled
                                    />
                                ) : (
                                    <select
                                        value={selectedSeller?.user_id || ""}
                                        onChange={(e) => {
                                            const seller = sellers.find(
                                                (s) =>
                                                    s.user_id === e.target.value
                                            );
                                            setSelectedSeller(seller);
                                        }}
                                        className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                        required
                                    >
                                        <option value="">Select Seller</option>
                                        {Array.isArray(sellers) &&
                                            sellers.map((seller) => (
                                                <option
                                                    key={seller.user_id}
                                                    value={seller.user_id}
                                                >
                                                    {seller.personal_details
                                                        ?.fullName ||
                                                        "Unknown"}{" "}
                                                    -{" "}
                                                    {seller.company_details
                                                        ?.company_name ||
                                                        "Unknown Company"}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Product Name
                                </label>
                                <input
                                    type="text"
                                    name="productName"
                                    value={formData.productName}
                                    placeholder="Enter product name"
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Product Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleCategoryChange}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((option) => (
                                        <option
                                            key={option.category_id}
                                            value={option.name}
                                        >
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Price
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="Enter price"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Rate
                                </label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="Enter rate"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Price Unit
                                </label>
                                <select
                                    name="priceUnit"
                                    value={formData.priceUnit}
                                    onChange={handleChange}
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                >
                                    {priceUnitOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                          
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Subcategory
                                </label>
                                <select
                                    name="subcategory"
                                    value={formData.subcategory}
                                    onChange={handleChange}
                                    placeholder="Select Subcategory"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    required
                                    disabled={!formData.category} // Disable if no category is selected
                                >
                                    {!formData.category ? (
                                        <option value="">
                                            Select a Category first
                                        </option>
                                    ) : (
                                        <>
                                            <option value="">
                                                Select Subcategory
                                            </option>
                                            {subcategories.map((option) => (
                                                <option
                                                    key={option.sub_category_id}
                                                    value={option.name}
                                                >
                                                    {option.name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter product description"
                                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Product Images
                            </label>
                            <input
                                type="file"
                                name="images"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/png,image/jpeg,image/jpg"
                                multiple
                                className="hidden"
                            />
                            <div
                                className="mt-1 flex justify-center px-6 py-10 border-2 border-gray-200 border-dashed rounded-lg cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {imagePreview.length > 0 ? (
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        {imagePreview.map((preview, index) => (
                                            <div
                                                key={index}
                                                className="relative"
                                            >
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="h-40 w-40 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeImage(index);
                                                    }}
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="h-40 w-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer">
                                            + Add More
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-colors duration-200"
                                        >
                                            Upload Images
                                        </button>
                                        <p className="mt-2 text-sm text-gray-500">
                                            PNG, JPG up to 5MB
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-black text-white rounded-lg ${
                                    isSubmitting
                                        ? "opacity-70 cursor-not-allowed"
                                        : "hover:bg-gray-900"
                                } focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors duration-200`}
                            >
                                {isSubmitting
                                    ? "Adding Product..."
                                    : "Add Product"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default function OnboardProductScreen() {
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
                <OnboardProduct isSidebarOpen={isSidebarOpen} />
            </ContentWrapper>
        </div>
    );
}
