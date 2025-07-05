import express from "express";
import {
    Product,
    User,
    Category,
    SubCategory,
    Ticket,
    Favorite,
} from "../Model/Models.js";
import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import S3 from "aws-sdk/clients/s3.js";
import { upload } from "../Config/S3Config.js";
const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;

const router = express.Router();

router.post("/add", upload.array("images", 5), async (req, res) => {
    try {
        console.log("Request body:", req.body);

        // Extract user info from the interceptor-added field if it exists
        let user;
        if (req.body.userInfo) {
            try {
                user = JSON.parse(req.body.userInfo);
            } catch (e) {
                console.error("Error parsing userInfo:", e);
            }
        } else if (req.body.user) {
            user = req.body.user;
        } else {
            // Use JWT from request if available
            user = req.user?.user;
        }

        console.log("USER", user);

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access",
            });
        }

        const addedBy = {
            user_id: user.moderator_id,
            user_name: user.name,
        };

        // Get form data from request body
        const categoryID = req.body.categoryID;
        const subCategoryID = req.body.subCategoryID;
        const description = req.body.description;
        const price = req.body.price;
        const name = req.body.name;

        // Handle price_details properly
        let price_details = req.body.price_details;

        const seller_id = req.query.seller_id;

        // Validation checks
        if (!categoryID) {
            return res.status(400).json({
                status: "error",
                message: "Category ID is required",
            });
        }

        if (!subCategoryID) {
            return res.status(400).json({
                status: "error",
                message: "SubCategory ID is required",
            });
        }

        if (!price_details || !price_details.unit || !price_details.quantity) {
            return res.status(400).json({
                status: "error",
                message: "Price details(Unit and Quantity) are required",
            });
        }

        console.log(categoryID);
        const category = await Category.query("category_id")
            .eq(categoryID)
            .exec();

        if (category.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Category ID is invalid",
            });
        }

        const subCategory = await SubCategory.scan("sub_category_id")
            .eq(subCategoryID)
            .exec();
        if (subCategory.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "SubCategory ID is invalid",
            });
        }

        // Process uploaded images
        let images = [];
        if (req.files && req.files.length > 0) {
            // Map S3 URLs to CloudFront URLs
            images = req.files.map((file) => {
                const objectKey = file.key;
                return `https://${cloudFrontDomain}/${objectKey}`;
            });
        }
        console.log("images:", images);

        // Handle deletion of existing images if needed

        const newProduct = new Product({
            category_id: categoryID,
            sub_category_id: subCategoryID,
            price: parseFloat(price),
            price_details: {
                unit: price_details.unit,
                quantity: parseInt(price_details.quantity),
            },
            images: images, // Store CloudFront URLs array
            description: description,
            seller_id,
            status: "active",
            name: name,
            category: {
                category_name: category[0].name,
                category_id: category[0].category_id,
            },
            sub_category: {
                sub_category_name: subCategory[0].name,
                sub_category_id: subCategory[0].sub_category_id,
            },
            added_by: addedBy,
            updated_by: { ...addedBy },
        });

        console.log("NEW PRODUCT", newProduct);
        await newProduct.save();

        return res.status(201).json({
            status: "success",
            message: "Product added successfully",
            data: newProduct,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to add product",
        });
    }
});

// Get Products route
router.get("/all/user", async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 5, location } = req.query;
        const userID = "40402"; // TODO: Replace with actual user ID from auth
        const { user } = req.user;
        console.log("USER", user);
        const { categories, subcategories, cities, sort } = req.body;
        // sort will contain " Low to high", "High to low", "Newest"

        // Convert to numbers
        const page = parseInt(pageNumber);
        const limit = parseInt(pageSize);

        // Get tickets raised by user
        const ticketsRaisedList = await Ticket.scan("buyer_id")
            .eq(userID)
            .exec();

        let productList = [];
        let totalCount = 0;

        // If location is provided, get products by location
        if (location) {
            const sellerList = await User.scan()
                .filter("role")
                .eq("seller")
                .filter("company_details.company_address.city")
                .eq(location)
                .exec();

            if (sellerList.length === 0) {
                return res.status(200).json({
                    status: "success",
                    data: [],
                    metadata: {
                        currentPage: page,
                        pageSize: limit,
                        totalPages: 0,
                        totalItems: 0,
                    },
                    message: "No sellers found in this location",
                });
            }

            // Get all products for counting
            const allProducts = await Product.scan("seller_id")
                .in(sellerList.map((seller) => seller.user_id))
                .exec();

            totalCount = allProducts.length;

            // Get paginated products
            productList = allProducts
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
                )
                .slice((page - 1) * limit, page * limit);
        } else {
            // Get all products for counting
            const allProducts = await Product.scan().exec();
            totalCount = allProducts.length;

            // Get paginated products
            productList = allProducts
                .sort(
                    (a, b) =>
                        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
                )
                .slice((page - 1) * limit, page * limit);
        }

        // TODO: filter the productList by subcategories, cities

        // Modify the out-of-bounds check
        const totalPages = Math.ceil(totalCount / limit);
        if (page > totalPages) {
            return res.status(200).json({
                status: "success",
                data: [],
                metadata: {
                    currentPage: page,
                    pageSize: limit,
                    totalPages,
                    totalItems: totalCount,
                },
                message: "No more products available",
            });
        }

        // Get seller details for products
        const sellerIds = [
            ...new Set(productList.map((product) => product.seller_id)),
        ];
        const sellers = await User.scan("user_id").in(sellerIds).exec();

        // Create seller lookup map
        const sellerMap = sellers.reduce((acc, seller) => {
            acc[seller.user_id] = {
                name: seller.personal_details?.fullName,
                company: seller.company_details?.company_name,
                city: seller.company_details?.company_address?.city,
            };
            return acc;
        }, {});

        // Transform products
        const products = transformToProductsListResponse(
            productList,
            sellerMap,
            ticketsRaisedList,
            userID
        );

        return res.status(200).json({
            status: "success",
            data: products,
            metadata: {
                currentPage: page,
                pageSize: limit,
                totalPages,
                totalItems: totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch products",
        });
    }
});

router.post("/all/user/new", async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 5, location } = req.query;
        const { subcategories, cities, sort, buyer_id } = req.body;
        let userID = buyer_id;

        const page = parseInt(pageNumber);
        const limit = parseInt(pageSize);

        // Get tickets raised by user
        const ticketsRaisedList = await Ticket.scan("buyer_id")
            .eq(userID)
            .exec();

        // Get user's favorites
        const userFavorites = await Favorite.scan("user_id")
            .eq(userID)
            .exec();

        // Create a Set of favorite product IDs for faster lookup
        const favoriteProductIds = new Set(
            userFavorites.map((fav) => fav.product_id)
        );

        let productList = [];
        let totalCount = 0;

        // If location is provided, get products by location
        if (location) {
            const sellerList = await User.scan()
                .filter("role")
                .eq("seller")
                .filter("company_details.company_address.city")
                .eq(location)
                .exec();

            if (sellerList.length === 0) {
                return res.status(200).json({
                    status: "success",
                    data: [],
                    metadata: {
                        currentPage: page,
                        pageSize: limit,
                        totalPages: 0,
                        totalItems: 0,
                    },
                    message: "No sellers found in this location",
                });
            }

            // Get all products for counting
            const allProducts = await Product.scan("seller_id")
                .in(sellerList.map((seller) => seller.user_id))
                .exec();

            productList = allProducts;
        } else {
            // Get all products for counting
            productList = await Product.scan().exec();
        }

        // Get seller details for all products
        const sellerIds = [
            ...new Set(productList.map((product) => product.seller_id)),
        ];
        const sellers = await User.scan("user_id").in(sellerIds).exec();

        // Create seller lookup map
        const sellerMap = sellers.reduce((acc, seller) => {
            acc[seller.user_id] = {
                name: seller.personal_details?.fullName,
                company: seller.company_details?.company_name,
                city: seller.company_details?.company_address?.city,
            };
            return acc;
        }, {});

        // console.log(subcategories);
        // Filter by subcategories if provided
        if (subcategories && subcategories.length > 0) {
            productList = productList.filter((product) => {
                // console.log("id: " + product.sub_category.sub_category_id);
                return subcategories.includes(
                    product.sub_category.sub_category_id
                );
            });
        }

        // Filter by cities if provided
        if (cities && cities.length > 0) {
            productList = productList.filter((product) => {
                const sellerCity = sellerMap[product.seller_id]?.city;
                return sellerCity && cities.includes(sellerCity);
            });
        }

        if (sort) {
            switch (sort) {
                case "Low to high":
                    productList.sort((a, b) => a.price - b.price);
                    break;
                case "High to low":
                    productList.sort((a, b) => b.price - a.price);
                    break;
                case "Newest":
                default:
                    productList.sort(
                        (a, b) =>
                            new Date(b.updatedAt || 0) -
                            new Date(a.updatedAt || 0)
                    );
                    break;
            }
        } else {
            // Default sort by newest
            productList.sort(
                (a, b) =>
                    new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
            );
        }

        // Calculate total count after filtering
        totalCount = productList.length;

        const totalPages = Math.ceil(totalCount / limit);
        if (page > totalPages && totalCount > 0) {
            return res.status(200).json({
                status: "success",
                data: [],
                metadata: {
                    currentPage: page,
                    pageSize: limit,
                    totalPages,
                    totalItems: totalCount,
                },
                message: "No more products available",
            });
        }

        // Apply pagination after filtering and sorting
        const paginatedProducts = productList.slice(
            (page - 1) * limit,
            page * limit
        );

        // Transform products
        const products = transformToProductsListResponse(
            paginatedProducts,
            sellerMap,
            ticketsRaisedList,
            userID,
            new Set(favoriteProductIds) // Pass favorites to transform function
        );

        return res.status(200).json({
            status: "success",
            data: products,
            metadata: {
                currentPage: page,
                pageSize: limit,
                totalPages,
                totalItems: totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch products",
        });
    }
});

router.post("/all/user/interested", async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 5, location } = req.query;
        let userID = "40402"; // TODO: Replace with actual user ID from auth

        const { subcategories, cities, sort, buyer_id } = req.body;
        // sort will contain "Low to high", "High to low", "Newest"
        userID = buyer_id;

        // Convert to numbers
        const page = parseInt(pageNumber);
        const limit = parseInt(pageSize);

        // Get tickets raised by the user
        // This replaces the previous approach of fetching products and then finding matching tickets
        let ticketsList = await Ticket.scan("buyer_id").eq(userID).exec();

        console.log(`Found ${ticketsList.length} tickets for user ${userID}`);

        // Get seller details for all tickets
        const sellerIds = [
            ...new Set(ticketsList.map((ticket) => ticket.seller_id)),
        ];
        let sellers = [];
            if (sellerIds.length > 0) {

                 sellers = await User.scan("user_id").in(sellerIds).exec();
            }
        // Create seller lookup map
        const sellerMap = sellers.reduce((acc, seller) => {
            acc[seller.user_id] = {
                name: seller.personal_details?.fullName,
                company: seller.company_details?.company_name,
                city: seller.company_details?.company_address?.city,
            };
            return acc;
        }, {});

        // Calculate total count after filtering
        const totalCount = ticketsList.length;

        console.log(`Total tickets after filtering: ${totalCount}`);

        // Calculate pagination
        const totalPages = Math.ceil(totalCount / limit);
        if (page > totalPages && totalCount > 0) {
            return res.status(200).json({
                status: "success",
                data: [],
                metadata: {
                    currentPage: page,
                    pageSize: limit,
                    totalPages,
                    totalItems: totalCount,
                },
                message: "No more products available",
            });
        }

        // Apply pagination after filtering and sorting
        const paginatedTickets = ticketsList.slice(
            (page - 1) * limit,
            page * limit
        );

        // Transform tickets to the response format
        const interestedProducts = transformToInterestedProductsListFromTickets(
            paginatedTickets,
            sellerMap
        );

        return res.status(200).json({
            status: "success",
            data: interestedProducts,
            metadata: {
                currentPage: page,
                pageSize: limit,
                totalPages,
                totalItems: totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching interested products:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch interested products",
        });
    }
});

router.get("/all/employee", async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 10, location } = req.query;
        // const userID = req.user.userId;

        const startPage = (pageNumber - 1) * pageSize;
        const endPage = pageNumber * pageSize;

        let productList = [];

        // If location is provided, get products by location
        if (location) {
            // console.log("Fetching products by location:", location);
            const sellerList = await User.scan()
                .filter("role")
                .eq("seller")
                .filter("company_details.company_address.city")
                .eq(location)
                .exec();

            if (sellerList.length === 0) {
                return res.status(200).json({
                    status: "success",
                    data: [],
                    message: "No sellers found in this location",
                });
            }

            const products = await Product.scan("seller_id")
                .in(sellerList.map((seller) => seller.user_id))
                .exec();

            if (products.length === 0) {
                return res.status(200).json({
                    status: "success",
                    data: [],
                    message: "No products found in this location",
                });
            }

            productList = products
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(startPage, endPage);
        }

        if (productList.length === 0) {
            productList = await Product.scan()
                .exec()
                .then((results) => {
                    return results
                        .sort(
                            (a, b) =>
                                new Date(b.timestamp) - new Date(a.timestamp)
                        )
                        .slice(startPage, endPage);
                });
        }
        // Get all unique seller IDs
        const sellerIds = [
            ...new Set(productList.map((product) => product.seller_id)),
        ];

        // Fetch all sellers in one query
        const sellers = await User.scan("user_id").in(sellerIds).exec();

        const sellerMap = sellers.reduce((acc, seller) => {
            acc[seller.user_id] = {
                name: seller.personal_details.fullName,
                company: seller.company_details.company_name,
            };
            return acc;
        }, {});

        // console.log("SELLER MAP", sellerMap);
        const products = transformToEmployeeProductsListResponse(
            productList,
            sellerMap
        );

        return res.status(200).json({
            status: "success",
            data: products,
            metadata: {
                currentPage: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(
                    sortedProducts.length / parseInt(pageSize)
                ),
                totalItems: sortedProducts.length,
            },
        });
    } catch (error) {
        // catch (exception) { }
        console.error("Error fetching product:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch product",
        });
    }
});

// Get single product route
router.get("/:productId", async (req, res) => {
    try {
        console.log("Hey");
        const { productId } = req.params;

        const product = await Product.scan("product_id").eq(productId).exec();

        if (!product || product.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Product not found",
            });
        }

        // Get seller details
        const seller = await User.scan("user_id")
            .eq(product[0].seller_id)
            .exec();


        const productWithSellerDetails = {
            ...product[0],
            seller_name:
                seller[0]?.personal_details?.fullName || "Unknown Seller",
            seller_company:
                seller[0]?.company_details?.company_name || "Unknown Company",
        };


        return res.status(200).json({
            status: "success",
            data: productWithSellerDetails,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch product",
        });
    }
});

const getS3UrlFromCloudFront = (cloudFrontUrl) => {
    const cloudFrontDomain = "https://d2jj7u8y6nhupa.cloudfront.net";
    const s3Bucket = "d-marketplace-images";

    if (cloudFrontUrl.includes(cloudFrontDomain)) {
        // Extract the object key from CloudFront URL
        const objectKey = cloudFrontUrl.replace(`${cloudFrontDomain}/`, "");
        return `https://${s3Bucket}.s3.amazonaws.com/${objectKey}`;
    }

    // Return original URL if it's not a CloudFront URL
    return cloudFrontUrl;
};

// Add this function to your component
const getCloudFrontUrl = (imageUrl) => {
    const cloudFrontDomain = "https://d2jj7u8y6nhupa.cloudfront.net";

    // If it's already a CloudFront URL, return as is
    if (imageUrl.includes(cloudFrontDomain)) {
        return imageUrl;
    }

    // If it's an S3 URL, extract the object key
    if (imageUrl.includes("amazonaws.com")) {
        const objectPath = imageUrl.split(".com/")[1];
        return `${cloudFrontDomain}/${objectPath}`;
    }
    console.log(imageUrl);
    console.log(`${cloudFrontDomain}/${imageUrl}`);

    // If it's just an object key
    return `${cloudFrontDomain}/${imageUrl}`;
};

//Delete Product route
router.delete("/delete", async (req, res) => {
    try {
        const { product_id } = req.query;
        // TODO: delete respective images from S3
        await Product.delete({ product_id });
        res.status(200).send("Product deleted successfully");
    } catch (exception) {
        console.log(exception);
    }
});

// Update Product route
router.put("/update", upload.array("newImages", 5), async (req, res) => {
    try {
        let user;
        if (req.body.userInfo) {
            try {
                user = JSON.parse(req.body.userInfo);
            } catch (e) {
                console.error("Error parsing userInfo:", e);
            }
        } else if (req.body.user) {
            user = req.body.user;
        } else {
            // Use JWT from request if available
            user = req.user?.user;
        }

        console.log("USER", user);

        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized access",
            });
        }
        const {
            name,
            status,
            price_details,
            product_id,
            sub_category,
            category,
            description,
            price,
            priceUnit,
            images,
            imagesToBeDeleted,
            location,
        } = req.body;
        console.log(req.body);

        let parsedImages = [],
            parsedImagesToBeDeleted = [];
        if (
            req.body.imagesToBeDeleted &&
            req.body.imagesToBeDeleted.length > 0
        ) {
            try {
                const parsedImagesToBeDeleted = JSON.parse(
                    req.body.imagesToBeDeleted
                );
                const deletePromises = parsedImagesToBeDeleted.map(
                    async (imageURL) => {
                        console.log("Image URL:", imageURL);
                        // Convert CloudFront URL to S3 URL
                        const s3Url = getS3UrlFromCloudFront(imageURL);

                        // Extract the object key from the S3 URL
                        const objectKey = s3Url.split(".s3.amazonaws.com/")[1];

                        // Create delete params
                        const deleteParams = {
                            Bucket: "d-marketplace-images",
                            Key: objectKey,
                        };

                        // Delete the file from S3
                        return s3Client.deleteObject(deleteParams).promise();
                    }
                );

                await Promise.all(deletePromises);
            } catch (error) {
                console.error("Error deleting images:", error);
                // Continue with the rest of the function even if image deletion fails
            }
        }

        try {
            parsedImages =
                typeof images === "string" ? JSON.parse(images) : images;
            parsedImagesToBeDeleted =
                typeof imagesToBeDeleted === "string"
                    ? JSON.parse(imagesToBeDeleted)
                    : imagesToBeDeleted;
        } catch (err) {
            console.error("Failed to parse images:", err);
        }
        let newImagesArray = [],
            updatedImages;
        console.log("Size: " + req.files.length);
        if (req.files && req.files.length > 0) {
            // Map S3 URLs to CloudFront URLs
            newImagesArray = req.files.map((file) => {
                const objectKey = file.key;
                return `https://${cloudFrontDomain}/${objectKey}`;
            });
        }
        updatedImages = [...parsedImages, ...newImagesArray];
        console.log("newImagesArray:", newImagesArray);
        console.log(parsedImages);
        console.log(parsedImagesToBeDeleted);
        console.log(updatedImages);

        const updated_by = {
            user_id: user.moderator_id,
            user_name: user.name,
        };

        const product = await Product.scan("product_id").eq(product_id).exec();
        console.log("PRODUCT", product);
        if (!product || product.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "Product not found",
            });
        }
        console.log(typeof price);
        console.log("Type");
        const last_price = product[0].price;
        console.log(updatedImages);
        price_details.quantity = +price_details.quantity;
        const updatedProduct = await Product.update(
            { product_id },
            {
                category,
                sub_category,
                description,
                price: +price,
                price_details,
                images: updatedImages,
                location,
                name,
                status,
                description,
                updated_by,
                last_updated_price: last_price,
            }
        );

        console.log("Updated Product:", updatedProduct);

        const seller = await User.scan("user_id")
            .eq(updatedProduct.seller_id)
            .exec();

        const productWithSellerDetails = {
            ...updatedProduct,
            seller_name:
                seller[0]?.personal_details?.fullName || "Unknown Seller",
            seller_company:
                seller[0]?.company_details?.company_name || "Unknown Company",
        };

        return res.status(200).json({
            status: "success",
            message: "Product updated successfully",
            data: productWithSellerDetails,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to update product",
        });
    }
});

// Get products by seller route
router.get("/seller/:sellerId", async (req, res) => {
    try {
        const { sellerId } = req.params;
        const products = await Product.scan("seller_id").eq(sellerId).exec();

        if (!products || products.length === 0) {
            return res.status(200).json({
                status: "success",
                data: [],
                message: "No products found for this seller",
            });
        }

        const seller = await User.scan("user_id").eq(sellerId).exec();

        const transformedProducts = products.map((product) => ({
            id: product.product_id,
            name: product.name,
            category: product.category?.category_name,
            subcategory: product.sub_category?.sub_category_name,
            price: product.price,
            price_details: product.price_details,
            status: product.status,
            images: product.images,
            seller_name:
                seller[0]?.personal_details?.fullName || "Unknown Seller",
            seller_company:
                seller[0]?.company_details?.company_name || "Unknown Company",
            seller_id: sellerId,
            createdAt: product.createdAt,
        }));

        return res.status(200).json({
            status: "success",
            data: transformedProducts,
        });
    } catch (error) {
        console.error("Error fetching seller products:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch seller products",
        });
    }
});

const transformToInterestedProductsListFromTickets = (tickets, sellerMap) => {
    const transformedProducts = tickets.map((ticket) => ({
        id: ticket.product_id,
        name: ticket.product_name,
        // These will come from the ticket's saved data rather than the product
        seller_id: ticket.seller_id,
        seller_name: ticket.seller_details?.seller_name || "Unknown Seller",
        seller_company:
            ticket.seller_details?.company_name || "Unknown Company",
        seller_city: ticket.seller_details?.city || "Unknown City",
        price: ticket.price,
        price_details: {
            unit: ticket.price_details?.unit || "per_kg",
            quantity: ticket.price_details?.quantity || 1,
        },
        status: ticket.status,
        updatedAt: ticket.updatedAt || ticket.createdAt,
        ticket_id: ticket.ticket_id,
        isInterested: true, // All tickets are inherently "interested" items
    }));

    return transformedProducts;
};

// Add this new route to your existing Product.js file
router.get("/filters/data", async (req, res) => {
    try {
        // Get all categories
        const categories = await Category.scan().exec();

        // Get all subcategories
        const subcategories = await SubCategory.scan().exec();

        // Get only sellers' cities
        const sellers = await User.scan()
            .filter("role")
            .eq("seller")
            .filter("company_details.company_address.city")
            .exec();

        // Transform categories and subcategories
        const categoriesWithSubs = categories.map((category) => ({
            category_id: category.category_id,
            category_name: category.name,
            description: category.description,
            subcategories: subcategories
                .filter((sub) => sub.category_id === category.category_id)
                .map((sub) => ({
                    sub_category_id: sub.sub_category_id,
                    sub_category_name: sub.name,
                    description: sub.description,
                })),
        }));

        // Extract unique cities from sellers only
        const cities = [
            ...new Set(
                sellers
                    .map(
                        (seller) =>
                            seller.company_details?.company_address?.city
                    )
                    .filter((city) => city) // Remove null/undefined values
            ),
        ].sort(); // Sort alphabetically

        return res.status(200).json({
            status: "success",
            data: {
                categories: categoriesWithSubs,
                cities: cities,
            },
            message: "Filters data fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching filters data:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch filters data",
        });
    }
});

const transformToEmployeeProductsListResponse = (products, sellerMap) => {
    const transformedProducts = products.map((product) => ({
        id: product.product_id,
        name: product.name,
        category: product.category?.category_name,
        subcategory: product.sub_category?.sub_category_name,
        seller_id: product.seller_id,
        seller_name: sellerMap[product.seller_id]?.name || "Unknown Seller",
        seller_company:
            sellerMap[product.seller_id]?.company || "Unknown Company",
        price: product.price,
        price_details: product.price_details,
        status: product.status,
        updatedAt: product.updatedAt,
        last_price: product.last_updated_price - product.price,
        images: product.images,
    }));
    return transformedProducts;
};

const transformToProductsListResponse = (
    products,
    sellerMap,
    ticketsRaisedList,
    userId,
    favoriteProductIds = new Set() 
) => {
    const transformedProducts = products.map((product) => ({
        id: product.product_id,
        name: product.name,
        category: product.category?.category_name,
        subcategory: product.sub_category?.sub_category_name,
        seller_id: product.seller_id,
        seller_name: sellerMap[product.seller_id]?.name || "Unknown Seller",
        seller_company: sellerMap[product.seller_id]?.company || "Unknown Company",
        seller_city: sellerMap[product.seller_id]?.city || "Unknown City",
        price: product.price,
        price_details: {
            unit: product.price_details?.unit || "per_kg",
            quantity: product.price_details?.quantity || 1,
        },
        status: product.status,
        updatedAt: product.updatedAt,
        isInterested: ticketsRaisedList.some(
            (ticket) => ticket.product_id === product.product_id
        ),
        isFavorite: favoriteProductIds.has(product.product_id), // Add favorite status
        updatedBy: product.updated_by,
        last_price: product.last_updated_price - product.price,
        images: product.images,
    }));

    return transformedProducts;
};

const transformToInterestedProductsListResponse = (
    products,
    sellerMap,
    ticketsRaisedList,
    userId
) => {
    const transformedProducts = products
        .map((product) => ({
            id: product.product_id,
            name: product.name,
            category: product.category?.category_name,
            subcategory: product.sub_category?.sub_category_name,
            seller_id: product.seller_id,
            seller_name: sellerMap[product.seller_id]?.name || "Unknown Seller",
            seller_company:
                sellerMap[product.seller_id]?.company || "Unknown Company",
            seller_city: sellerMap[product.seller_id]?.city || "Unknown City",
            price: product.price,
            price_details: {
                unit: product.price_details?.unit || "per_kg",
                quantity: product.price_details?.quantity || 1,
            },
            status: product.status,
            updatedAt: product.updatedAt,
            isInterested: ticketsRaisedList.some(
                (ticket) => ticket.product_id === product.product_id
            ),
            images: product.images,
        }))
        .filter((product) => product.isInterested); // Filter only interested products

    return transformedProducts;
};

// Toggle favorite status
router.post("/favorite/toggle", async (req, res) => {
    try {
        const { product_id, user_id } = req.body;

        // Check if favorite already exists
        const existingFavorite = await Favorite.scan()
            .filter("user_id")
            .eq(user_id)
            .filter("product_id")
            .eq(product_id)
            .exec();

        if (existingFavorite.length > 0) {
            // Remove from favorites
            await Favorite.delete({ id: existingFavorite[0].id });
            return res.status(200).json({
                status: "success",
                message: "Product removed from favorites",
                isFavorite: false,
            });
        } else {
            // Add to favorites
            const newFavorite = new Favorite({
                user_id,
                product_id,
            });
            await newFavorite.save();
            return res.status(200).json({
                status: "success",
                message: "Product added to favorites",
                isFavorite: true,
            });
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to toggle favorite",
        });
    }
});

// Get favorite products
router.post("/favorites/user", async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 10, location } = req.query;
        const { subcategories, cities, sort, user_id } = req.body;

        // Convert to numbers
        const page = parseInt(pageNumber);
        const limit = parseInt(pageSize);

        // Get user's favorites
        const favorites = await Favorite.scan("user_id").eq(user_id).exec();

        if (favorites.length === 0) {
            return res.status(200).json({
                status: "success",
                data: [],
                metadata: {
                    currentPage: page,
                    pageSize: limit,
                    totalPages: 0,
                    totalItems: 0,
                },
            });
        }

        // Get tickets raised by user (for interested status)
        const ticketsRaisedList = await Ticket.scan("buyer_id")
            .eq(user_id)
            .exec();

        // Get all favorite products
        const favoriteProductIds = favorites.map((fav) => fav.product_id);
        let productList = await Product.scan("product_id")
            .in(favoriteProductIds)
            .exec();

        // Get seller details
        const sellerIds = [
            ...new Set(productList.map((product) => product.seller_id)),
        ];
        const sellers = await User.scan("user_id").in(sellerIds).exec();

        // Create seller lookup map
        const sellerMap = sellers.reduce((acc, seller) => {
            acc[seller.user_id] = {
                name: seller.personal_details?.fullName,
                company: seller.company_details?.company_name,
                city: seller.company_details?.company_address?.city,
            };
            return acc;
        }, {});

        // Apply filters
        if (subcategories && subcategories.length > 0) {
            productList = productList.filter((product) =>
                subcategories.includes(product.sub_category.sub_category_id)
            );
        }

        if (cities && cities.length > 0) {
            productList = productList.filter((product) => {
                const sellerCity = sellerMap[product.seller_id]?.city;
                return sellerCity && cities.includes(sellerCity);
            });
        }

        // Apply sorting
        if (sort) {
            switch (sort) {
                case "Low to high":
                    productList.sort((a, b) => a.price - b.price);
                    break;
                case "High to low":
                    productList.sort((a, b) => b.price - a.price);
                    break;
                case "Newest":
                default:
                    productList.sort(
                        (a, b) =>
                            new Date(b.updatedAt || 0) -
                            new Date(a.updatedAt || 0)
                    );
                    break;
            }
        }

        // Calculate pagination
        const totalCount = productList.length; // Using favorites length since we want total favorite products
        const totalPages = Math.ceil(totalCount / limit);

        // Apply pagination
        const paginatedProducts = productList.slice(
            (page - 1) * limit,
            page * limit
        );
        
    const favoriteproductids = paginatedProducts.map(product => product.product_id);

        // Transform products
        const products = transformToProductsListResponse(
            paginatedProducts,
            sellerMap,
            ticketsRaisedList,
            user_id,
            new Set(favoriteproductids)

        );

        return res.status(200).json({
            status: "success",
            data: products,
            metadata: {
                currentPage: page,
                pageSize: limit,
                totalPages,
                totalItems: totalCount,
            },
        });
    } catch (error) {
        console.error("Error fetching favorite products:", error);
        return res.status(500).json({
            status: "error",
            message: error.message || "Failed to fetch favorite products",
        });
    }
});

export default router;
