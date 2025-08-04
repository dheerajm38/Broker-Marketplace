import express from "express";
import { Ticket, User } from "../Model/Models.js";
import { apiResponse } from "../Functionality/ApiResponse.js";
import { authMiddleware } from "../Middleware/AuthMiddleware.js";
import { generateUniqueRangeId } from "../Schema/Utils/generateUniqueRangeId.js";
import { Moderator } from "../Model/Models.js";

const router = express.Router();

const generateUniqueUserId = async () => {
    let isUnique = false;
    let newId;

    while (!isUnique) {
        newId = generateUniqueRangeId(10000, 99999); // Generates a number between 10000 and 99999
        const existingUser = await User.get({ user_id: newId });

        if (!existingUser) {
            isUnique = true;
        }
    }

    return newId;
};

const validatePhoneNumber = (phoneNumber) => {
    // Add your phone number validation logic here
    const phoneRegex = /^\d{10}$/; // Basic 10-digit validation
    return phoneRegex.test(phoneNumber);
};

const validateCompanyDetails = (companyDetails) => {
    if (!companyDetails.company_name) {
        return { isValid: false, message: "Company name is required" };
    }

    if (
        companyDetails.gst_number &&
        !/^[0-9A-Z]{15}$/.test(companyDetails.gst_number)
    ) {
        return { isValid: false, message: "Invalid GST number format" };
    }

    return { isValid: true };
};

const registerUser = async (req, res) => {
    try {
        console.log("Inside register user");
        console.log(req.body);
        const {
            personal_details,
            contact_details,
            company_details,
            role,
            created_by,
            assigned_operator,
            fcm_token,
        } = req.body;

        // Enhanced validation checks
        const validationErrors = [];

        if (!personal_details?.fullName?.trim()) {
            validationErrors.push("Full name is required");
        }

        if (!contact_details?.phone_number) {
            validationErrors.push("Phone number is required");
        } else if (!validatePhoneNumber(contact_details.phone_number)) {
            validationErrors.push("Invalid phone number format");
        }
        console.log("Phone number validation done");

        if (!role) {
            validationErrors.push("Role is required");
        } else if (role !== "buyer" && role !== "seller") {
            validationErrors.push(
                "Invalid role. Role must be either 'buyer' or 'seller'"
            );
        }
        console.log("Role validation done");
        if (!created_by?.trim()) {
            validationErrors.push("Created by is required");
        }

        if (!company_details) {
            validationErrors.push("Company details are required");
        } else {
            const companyValidation = validateCompanyDetails(company_details);
            if (!companyValidation.isValid) {
                validationErrors.push(companyValidation.message);
            }
        }
        console.log("Company details validation done", assigned_operator);
        // Validate assigned operator existence if provided
        if (
            assigned_operator != undefined &&
            assigned_operator != null &&
            assigned_operator?.trim()
        ) {
            try {
                // Import Moderator model at the top of your file
                //const Moderator = dynamose.model("Moderator", ModeratorSchema);

                // Query the database to check if the operator exists with role "Operator"
                console.log("Validation done");
                const operatorExists = await Moderator.scan("moderator_id")
                    .eq(assigned_operator.trim())
                    .and()
                    .where("role")
                    .eq("Operator")
                    .exec();

                if (operatorExists.count === 0) {
                    validationErrors.push(
                        "Assigned operator does not exist or is not an Operator"
                    );
                }
            } catch (error) {
                console.error("Error validating operator:", error);
                validationErrors.push("Error validating operator");
            }
        } else {
            if (role !== "seller") {
                console.error("Assigned operator must be non null", error);
                validationErrors.push("No assigned operator found");
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors,
            });
        }
        console.log("Validation done");
        // Check for existing user with same phone number and role
        const existingUser = await User.scan("contact_details.phone_number")
            .eq(contact_details.phone_number)
            .and()
            .where("role")
            .eq(role)
            .exec();

        if (existingUser.count > 0) {
            return res.status(400).json({
                success: false,
                message: `User with phone number ${contact_details.phone_number} is already registered as a ${role}`,
            });
        }

        // Create new user
        const newUser = new User({
            user_id: await generateUniqueUserId(),
            personal_details,
            contact_details,
            company_details,
            role,
            created_by,
            assigned_operator: assigned_operator?.trim() || "",
            fcm_token: fcm_token?.trim() || "",
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: newUser,
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

const getUserDetails = async (req, res) => {
    try {
        const { user_id } = req.params;

        if (!user_id?.trim()) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.get({ user_id });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User details retrieved successfully",
            data: user,
        });
    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Define allowed fields for each section
const ALLOWED_FIELDS = {
    personal_details: ["fullName"],
    contact_details: ["email", "phone_number"],
    company_details: ["company_name", "gst_number", "company_address"],
    company_address: ["street", "city", "district", "state", "zip_code"],
    top_level: ["role", "created_by", "assigned_operator"],
};

// Validation helper function
const validateUpdateFields = (updateData) => {
    const errors = [];

    // Check personal_details
    if (updateData.personal_details) {
        Object.keys(updateData.personal_details).forEach((field) => {
            if (!ALLOWED_FIELDS.personal_details.includes(field)) {
                errors.push(`Invalid field in personal_details: ${field}`);
            }
        });
    }

    // Add validation for assigned_operator
    if (updateData.assigned_operator !== undefined) {
        if (typeof updateData.assigned_operator !== "string") {
            errors.push("assigned_operator must be a string");
        }
        // You can add additional validation here, like checking if the operator exists
    }

    // Check contact_details
    if (updateData.contact_details) {
        Object.keys(updateData.contact_details).forEach((field) => {
            if (!ALLOWED_FIELDS.contact_details.includes(field)) {
                errors.push(`Invalid field in contact_details: ${field}`);
            }
        });
    }

    // Check company_details
    if (updateData.company_details) {
        Object.keys(updateData.company_details).forEach((field) => {
            if (field === "company_address") {
                // Validate company_address fields
                if (updateData.company_details.company_address) {
                    Object.keys(
                        updateData.company_details.company_address
                    ).forEach((addressField) => {
                        if (
                            !ALLOWED_FIELDS.company_address.includes(
                                addressField
                            )
                        ) {
                            errors.push(
                                `Invalid field in company_address: ${addressField}`
                            );
                        }
                    });
                }
            } else if (!ALLOWED_FIELDS.company_details.includes(field)) {
                errors.push(`Invalid field in company_details: ${field}`);
            }
        });
    }

    // Check top-level fields
    Object.keys(updateData).forEach((field) => {
        if (
            ![
                "personal_details",
                "contact_details",
                "company_details",
            ].includes(field) &&
            !ALLOWED_FIELDS.top_level.includes(field)
        ) {
            errors.push(`Invalid top-level field: ${field}`);
        }
    });

    return errors;
};

router.put("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const updateData = req.body;

        // Check if user exists
        const existingUser = await User.get({ user_id });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.log("user exists");
        console.log(updateData);

        // Validate fields
        const validationErrors = validateUpdateFields(updateData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid update fields",
                errors: validationErrors,
            });
        }

        // If phone number is being updated, check for duplicates with same role
        if (updateData.contact_details?.phone_number) {
            const duplicateUser = await User.scan(
                "contact_details.phone_number"
            )
                .eq(updateData.contact_details.phone_number)
                .and()
                .where("role")
                .eq(existingUser.role)
                .and()
                .where("user_id")
                .not()
                .eq(user_id)
                .exec();

            if (duplicateUser.count > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Another user with phone number ${updateData.contact_details.phone_number} is already registered as a ${existingUser.role}`,
                });
            }
        }

        // Validate role if it's being updated
        if (updateData.role && !["buyer", "seller"].includes(updateData.role)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid role. Role must be either 'buyer' or 'seller'",
            });
        }

        // Create update object while preserving existing data
        const updateObject = {};

        // Handle personal_details update
        if (updateData.personal_details) {
            updateObject.personal_details = {
                ...existingUser.personal_details,
                ...updateData.personal_details,
            };
        }

        // Handle contact_details update
        if (updateData.contact_details) {
            updateObject.contact_details = {
                ...existingUser.contact_details,
                ...updateData.contact_details,
            };
        }

        // Handle company_details update
        if (updateData.company_details) {
            updateObject.company_details = {
                ...existingUser.company_details,
                company_address: {
                    ...(existingUser.company_details?.company_address || {}),
                    ...(updateData.company_details.company_address || {}),
                },
                ...updateData.company_details,
            };
            // Remove company_address if it was explicitly provided to avoid nesting issues
            if (updateData.company_details.company_address) {
                delete updateData.company_details.company_address;
            }
        }

        // Handle other direct fields
        if (updateData.role) updateObject.role = updateData.role;
        if (updateData.created_by)
            updateObject.created_by = updateData.created_by;
        if (updateData.assigned_operator !== undefined) {
            updateObject.assigned_operator = updateData.assigned_operator;
        }

        // Perform the update using only the changed fields
        const updatedUser = await User.update({ user_id }, updateObject);

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

router.delete("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;

        // Check if user exists
        const existingUser = await User.get({ user_id });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Perform delete operation
        await User.delete({ user_id });

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Get All Users with pagination and role filter
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, role } = req.query;

        // Initialize scan operation
        let scanOperation = User.scan();

        // Apply role filter if provided
        if (role) {
            if (!["buyer", "seller"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid role. Role must be either 'buyer' or 'seller'",
                });
            }
            scanOperation = scanOperation.where("role").eq(role);
        }

        // Execute the scan
        const result = await scanOperation.exec();

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = result.count;
        const totalPages = Math.ceil(total / limit);

        // Get paginated results
        const paginatedUsers = result.slice(startIndex, endIndex);

        return res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: {
                users: paginatedUsers,
                pagination: {
                    total,
                    totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit),
                    hasNextPage: endIndex < total,
                    hasPrevPage: startIndex > 0,
                },
            },
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// router.get("/role/:role", async (req, res) => {
//     try {
//         const { role } = req.params;
//         console.log("Role", req.user);
//         // Validate role
//         if (!["buyer", "seller"].includes(role)) {
//             return res.status(400).json({
//                 success: false,
//                 message:
//                     "Invalid role. Role must be either 'buyer' or 'seller'",
//             });
//         }

//         // Fetch users with the given role
//         const users = await User.scan("role").eq(role).exec();

//         return res.status(200).json({
//             success: true,
//             message: `Users with role '${role}' retrieved successfully`,
//             data: users,
//         });
//     } catch (error) {
//         console.error("Error fetching users by role:", error);
//         return res.status(500).json({
//             success: false,
//             message: "Internal Server Error",
//             error: error.message,
//         });
//     }
// });

router.get("/role/:role", async (req, res) => {
    try {
        const { role } = req.params;
        console.log("Role", req.user);

        // Validate role
        if (!["buyer", "seller"].includes(role)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid role. Role must be either 'buyer' or 'seller'",
            });
        }

        // Fetch users with the given role
        const users = await User.scan("role").eq(role).exec();

        // Get all unique operator IDs from users who have assigned operators
        const operatorIds = [
            ...new Set(
                users
                    .filter(
                        (user) =>
                            user.assigned_operator &&
                            user.assigned_operator.trim() !== ""
                    )
                    .map((user) => user.assigned_operator)
            ),
        ];

        // Fetch operator details if there are any operators to fetch
        let operators = [];
        if (operatorIds.length > 0) {
            // Fetch all operators in parallel
            const operatorPromises = operatorIds.map((operatorId) =>
                Moderator.get({ moderator_id: operatorId }).catch((err) => {
                    console.warn(
                        `Operator with ID ${operatorId} not found:`,
                        err
                    );
                    return null; // Return null for non-existent operators
                })
            );

            const operatorResults = await Promise.all(operatorPromises);
            operators = operatorResults.filter((operator) => operator !== null);
        }

        // Create a map of operator ID to operator details for quick lookup
        const operatorMap = operators.reduce((map, operator) => {
            map[operator.moderator_id] = {
                moderator_id: operator.moderator_id,
                name: operator.name,
                email: operator.email,
                phone_number: operator.phone_number,
                role: operator.role,
            };
            return map;
        }, {});

        // Enhance users with operator details
        const usersWithOperators = users.map((user) => {
            const userObj = {
                ...user,
                assigned_operator_details: null,
            };

            // If user has an assigned operator, add the operator details
            if (
                user.assigned_operator &&
                user.assigned_operator.trim() !== ""
            ) {
                const operatorDetails = operatorMap[user.assigned_operator];
                if (operatorDetails) {
                    userObj.assigned_operator_details = operatorDetails;
                } else {
                    // Operator ID exists but operator not found in database
                    console.warn(
                        `Operator with ID ${user.assigned_operator} not found for user ${user.user_id}`
                    );
                    userObj.assigned_operator_details = {
                        error: "Operator not found",
                        operator_id: user.assigned_operator,
                    };
                }
            }

            return userObj;
        });

        return res.status(200).json({
            success: true,
            message: `Users with role '${role}' and their assigned operators retrieved successfully`,
            data: usersWithOperators,
            summary: {
                total_users: users.length,
                users_with_operators: users.filter(
                    (user) =>
                        user.assigned_operator &&
                        user.assigned_operator.trim() !== ""
                ).length,
                operators_found: operators.length,
            },
        });
    } catch (error) {
        console.error("Error fetching users by role:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Update FCM token
router.put("/:user_id/fcm-token", async (req, res) => {
    try {
        const { user_id } = req.params;
        const { fcm_token } = req.body;

        if (!fcm_token?.trim()) {
            return res.status(400).json({
                success: false,
                message: "FCM token is required",
            });
        }

        // Check if user exists
        const existingUser = await User.get({ user_id });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update FCM token
        const updatedUser = await User.update(
            { user_id },
            {
                fcm_token: fcm_token.trim(),
            }
        );

        return res.status(200).json({
            success: true,
            message: "FCM token updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        console.error("Error updating FCM token:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Router setup
router.post("/register", registerUser);
router.get("/:user_id", getUserDetails);

export default router;
