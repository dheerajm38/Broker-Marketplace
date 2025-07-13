import express from "express";
import {
    OnboardingRequest,
    User,
    Moderator,
    Notification,
} from "../Model/Models.js";
import {
    validateEmail,
    validatePhoneNumber,
    validateGST,
} from "../Schema/Utils/validators.js";
import { sanitizeInput } from "../Schema/Utils/sanitizers.js";
import { generateUniqueRangeId } from "../Schema/Utils/generateUniqueRangeId.js";
import { authMiddleware } from "../Middleware/AuthMiddleware.js";
import notificationService from "../Services/NotificationService.js";
import admin from "../Config/FirebaseConfig.js";

const router = express.Router();

// Helper function to create notifications for admins
const createAdminNotifications = async (buyerData, savedRequest) => {
    console.log("Saved Request", savedRequest);
    try {
        // Fetch all moderators with admin role
        const admins = await Moderator.scan("role").eq("Admin").exec();

        if (!admins || admins.length === 0) {
            console.warn("No admin moderators found for notifications");
            return;
        }

        // Take only the first admin from the list
        const firstAdmin = admins[0];

        // Create message object with proper structure
        const messageObject = {
            requestType: "Buyer Onboarding Request",
            requestId: savedRequest.onboarding_request_id || "",
            status: savedRequest.onboarding_status || "pending",
            buyer: {
                role: savedRequest.role || "",
                personalDetails: {
                    fullName: savedRequest.personal_details?.full_name || "",
                    // Add other personal details as needed
                },
                contactDetails: {
                    phoneNumber:
                        savedRequest.contact_details?.phone_number || "",
                    email: savedRequest.contact_details?.email || "",
                },
                companyDetails: {
                    companyName:
                        savedRequest.company_details?.company_name || "",
                    gstNumber: savedRequest.company_details?.gst_number || "",
                    companyAddress:
                        savedRequest.company_details?.company_address || {},
                },
            },
            timestamp: new Date().toISOString(),
        };

        console.log("Message Object", messageObject);

        // Create a new notification object
        const notification = new Notification({
            title: "New Buyer Onboarding Request",
            message: messageObject, // Pass the complex object directly
            type: "BUYER_REQUEST",
            recipientType: "MODERATOR",
            recipientId: firstAdmin.moderator_id,
            isRead: false,
        });

        // Save the notification
        const savedNotification = await notification.save();
        console.log("Notification saved successfully:", savedNotification);

        const message = `${notification.message.buyer.personalDetails.fullName} wants to onboard on the portal as new buyer`;
        //fire notification
        sendNotification(
            firstAdmin.fcm_token,
            savedNotification.title,
            message
        );
    } catch (error) {
        console.error("Error creating admin notification:", error);
        console.error("Error details:", error.stack);
        // Don't throw the error - we don't want to fail the onboarding if notifications fail
    }
};

async function sendNotification(token, title, body, data = {}) {
    try {
        // token =
        //     "d7Bnwo9zkdwGqfKeLcqL2f:APA91bH30lnOGiRU95yL139kJ6XaCTQIVYTVEwO4tZDKlbrbOhPixuxFnSAG62SOr0Xpx5bJwjFkPS_1EnN89EQ7UlwqhcW66H4kZHhFrmZ3CJ6zV1zUztk";
        const notification = {
            title,
            body,
        };

        const response = await notificationService.sendToDevice(
            token,
            notification,
            data
        );
        console.log(response);
        //res.status(200).json({ success: true, response });
    } catch (error) {
        console.error("Error in /send endpoint:", error);
        //res.status(500).json({ success: false, error: error.message });
    }
}

export const onboardBuyer = async (req, res) => {
    try {
        const {
            personal_details,
            contact_details,
            company_details,
            onboarding_status,
            fcm_token,
        } = req.body;
        console.log(req.body);
        // Input sanitization
        const sanitizedData = {
            personal_details: personal_details
                ? sanitizeInput(personal_details)
                : {},
            contact_details: contact_details
                ? sanitizeInput(contact_details)
                : {},
            company_details: company_details
                ? sanitizeInput(company_details)
                : {},
        };
        console.log(
            "sanitized data: " + sanitizedData.personal_details.full_name
        );

        // Validate required fields
        const validationErrors = validateBuyerData(sanitizedData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        // Check for duplicate phone number
        const existingBuyer = await OnboardingRequest.scan(
            "contact_details.phone_number"
        )
            .eq(sanitizedData.contact_details.phone_number)
            .and()
            .where("role")
            .eq("buyer")
            .exec();

        if (existingBuyer.count > 0) {
            return res.status(409).json({
                message: "A buyer with this phone number already exists",
            });
        }

        // Validate onboarding status
        const validStatus = ["pending", "accepted", "rejected"];
        const status = onboarding_status?.toLowerCase() || "pending";
        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid onboarding status",
            });
        }

        // Create the onboarding request
        const newBuyerOnboarding = new OnboardingRequest({
            role: "buyer",
            personal_details: sanitizedData.personal_details,
            contact_details: sanitizedData.contact_details,
            company_details: sanitizedData.company_details,
            onboarding_status: status,
            fcm_token: fcm_token?.trim() || "", // Add FCM token
        });

        // Save to database with retry mechanism
        const savedBuyer = await retryOperation(
            () => newBuyerOnboarding.save(),
            3 // number of retries
        );

        // Create notifications for admins with complete saved request data
        await createAdminNotifications(sanitizedData, newBuyerOnboarding);

        // Send success response
        return res.status(201).json({
            message: "Buyer onboarding request created successfully",
            data: savedBuyer,
        });
    } catch (error) {
        console.error("Error in onboarding buyer:", error);
        const errorMessage =
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : error.message;
        return res.status(500).json({ message: errorMessage });
    }
};

export const updateBuyer = async (req, res) => {
    console.log("update buyer method");
    try {
        const { onboarding_request_id } = req.params;
        const updateData = req.body;

        // Validate if onboarding_request_id is provided
        if (!onboarding_request_id) {
            return res.status(400).json({
                message: "Buyer ID is required",
            });
        }

        // Find existing buyer
        const existingBuyer = await OnboardingRequest.get({
            onboarding_request_id,
        });
        if (!existingBuyer) {
            return res.status(404).json({
                message: "Buyer not found",
            });
        }

        // Verify if it's a buyer record
        if (existingBuyer.role !== "buyer") {
            return res.status(400).json({
                message:
                    "Invalid operation: This ID does not belong to a buyer",
            });
        }

        // Sanitize input data
        const sanitizedData = sanitizeInput(updateData);

        // Validate update data
        const validationErrors = validateUpdateData(
            sanitizedData,
            existingBuyer
        );
        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: validationErrors,
            });
        }

        // Check for phone number uniqueness if it's being updated
        if (
            sanitizedData.contact_details?.phone_number &&
            sanitizedData.contact_details.phone_number !==
                existingBuyer.contact_details?.phone_number
        ) {
            const duplicatePhone = await OnboardingRequest.scan(
                "contact_details.phone_number"
            )
                .eq(sanitizedData.contact_details.phone_number)
                .and()
                .where("role")
                .eq("buyer")
                .and()
                .where("onboarding_request_id")
                .not()
                .eq(onboarding_request_id)
                .exec();

            if (duplicatePhone.count > 0) {
                return res.status(409).json({
                    message:
                        "This phone number is already registered with another buyer",
                });
            }
        }

        // Prepare update data
        const updateFields = prepareUpdateFields(sanitizedData, existingBuyer);

        // Update the buyer with retry mechanism
        const updatedBuyer = await retryOperation(async () => {
            const buyer = await OnboardingRequest.update(
                { onboarding_request_id },
                updateFields,
                { returnValues: "ALL_NEW" } // Return the updated document
            );
            return buyer;
        }, 3);

        return res.status(200).json({
            message: "Buyer updated successfully",
            data: updatedBuyer,
        });
    } catch (error) {
        console.error("Error in updating buyer:", error);
        const errorMessage =
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : error.message;
        return res.status(500).json({ message: errorMessage });
    }
};

const validateUpdateData = (updateData, existingData) => {
    const errors = [];

    // Personal details validation
    if (updateData.personal_details) {
        if (
            updateData.personal_details.fullName &&
            (updateData.personal_details.fullName.length < 2 ||
                updateData.personal_details.fullName.length > 100)
        ) {
            errors.push("Full Name must be between 2 and 100 characters");
        }
    }

    // Contact details validation
    if (updateData.contact_details) {
        if (
            updateData.contact_details.phone_number &&
            !validatePhoneNumber(updateData.contact_details.phone_number)
        ) {
            errors.push("Invalid phone number format");
        }

        if (
            updateData.contact_details.email &&
            !validateEmail(updateData.contact_details.email)
        ) {
            errors.push("Invalid email format");
        }
    }

    // Company details validation
    if (updateData.company_details) {
        if (
            updateData.company_details.gst_number &&
            !validateGST(updateData.company_details.gst_number)
        ) {
            errors.push("Invalid GST number format");
        }

        if (updateData.company_details.company_address) {
            const { city, state, zip_code } =
                updateData.company_details.company_address;
            if (city && city.length < 2) errors.push("City name is too short");
            if (state && state.length < 2)
                errors.push("State name is too short");
            if (zip_code && !/^\d{6}$/.test(zip_code))
                errors.push("Invalid ZIP code format");
        }
    }

    // Validate onboarding status if provided
    if (updateData.onboarding_status) {
        const validStatus = ["pending", "accepted", "rejected"];
        if (!validStatus.includes(updateData.onboarding_status.toLowerCase())) {
            errors.push("Invalid onboarding status");
        }
    }

    // FCM token validation (optional)
    if (
        updateData.fcm_token !== undefined &&
        typeof updateData.fcm_token !== "string"
    ) {
        errors.push("FCM token must be a string");
    }

    return errors;
};

const prepareUpdateFields = (updateData, existingData) => {
    const updates = {};

    // Only include fields that are actually being updated
    if (updateData.personal_details) {
        updates.personal_details = {
            ...existingData.personal_details,
            ...updateData.personal_details,
        };
    }

    if (updateData.contact_details) {
        updates.contact_details = {
            ...existingData.contact_details,
            ...updateData.contact_details,
        };
    }

    if (updateData.company_details) {
        updates.company_details = {
            ...existingData.company_details,
            ...updateData.company_details,
            company_address: updateData.company_details.company_address
                ? {
                      ...(existingData.company_details?.company_address || {}),
                      ...updateData.company_details.company_address,
                  }
                : existingData.company_details?.company_address,
        };
    }

    if (updateData.onboarding_status) {
        updates.onboarding_status = updateData.onboarding_status.toLowerCase();
    }

    // Add FCM token if provided
    if (updateData.fcm_token !== undefined) {
        updates.fcm_token = updateData.fcm_token?.trim() || "";
    }

    return updates;
};

const validateBuyerData = (data) => {
    const errors = [];

    // Personal details validation
    if (!data.personal_details?.full_name) {
        errors.push("Full Name is required");
    } else if (
        data.personal_details.full_name.length < 2 ||
        data.personal_details.full_name.length > 100
    ) {
        errors.push("Full Name must be between 2 and 100 characters");
    }

    // Contact details validation
    if (!data.contact_details?.phone_number) {
        errors.push("Phone number is required");
    } else if (!validatePhoneNumber(data.contact_details.phone_number)) {
        errors.push("Invalid phone number format");
    }

    if (
        data.contact_details?.email &&
        !validateEmail(data.contact_details.email)
    ) {
        errors.push("Invalid email format");
    }

    // Company details validation (optional but validated if provided)
    if (
        data.company_details?.gst_number &&
        !validateGST(data.company_details.gst_number)
    ) {
        errors.push("Invalid GST number format");
    }

    if (data.company_details?.company_address) {
        const { city, state, zip_code } = data.company_details.company_address;
        if (city && city.length < 2) errors.push("City name is too short");
        if (state && state.length < 2) errors.push("State name is too short");
        if (zip_code && !/^\d{6}$/.test(zip_code))
            errors.push("Invalid ZIP code format");
    }

    return errors;
};

const retryOperation = async (operation, maxRetries, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};

export const getBuyerById = async (req, res) => {
    console.log("inside the get buyer by id");
    try {
        const { onboarding_request_id } = req.params;

        // Validate if ID is provided
        if (!onboarding_request_id) {
            return res.status(400).json({
                message: "Buyer ID is required",
            });
        }

        // Get buyer from database
        const buyer = await OnboardingRequest.get({ onboarding_request_id });

        // Check if buyer exists
        if (!buyer) {
            return res.status(404).json({
                message: "Buyer not found",
            });
        }

        // Verify if it's a buyer record
        if (buyer.role !== "buyer") {
            return res.status(404).json({
                message:
                    "Invalid operation: This ID does not belong to a buyer",
            });
        }

        return res.status(200).json({
            message: "Buyer details retrieved successfully",
            data: buyer,
        });
    } catch (error) {
        console.error("Error in getting buyer details:", error);
        const errorMessage =
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : error.message;
        return res.status(500).json({ message: errorMessage });
    }
};

export const getAllBuyers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            sortBy = "personal_details.fullName",
            sortOrder = "asc",
        } = req.query;

        // Initialize scan operation
        let scanOperation = OnboardingRequest.scan("role").eq("buyer");

        // Apply status filter if provided
        if (status) {
            scanOperation = scanOperation
                .and()
                .where("onboarding_status")
                .eq(status.toLowerCase());
        }

        // Apply search filter if provided
        if (search) {
            scanOperation = scanOperation
                .and()
                .where("personal_details.fullName")
                .contains(search.toLowerCase())
                .or()
                .where("contact_details.phone_number")
                .contains(search)
                .or()
                .where("company_details.company_name")
                .contains(search.toLowerCase());
        }

        // Execute the scan operation
        let buyers = await scanOperation.exec();

        // Sort results
        const sortField = sortBy.split(".");
        buyers.sort((a, b) => {
            let valueA = a;
            let valueB = b;

            // Handle nested fields
            for (const field of sortField) {
                valueA = valueA?.[field];
                valueB = valueB?.[field];
            }

            if (valueA === undefined) return sortOrder === "asc" ? -1 : 1;
            if (valueB === undefined) return sortOrder === "asc" ? 1 : -1;

            if (typeof valueA === "string") {
                return sortOrder === "asc"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            }

            return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
        });

        // Calculate pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = buyers.length;

        // Paginate results
        const paginatedBuyers = buyers.slice(startIndex, endIndex);

        // Prepare pagination metadata
        const pagination = {
            total,
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total_pages: Math.ceil(total / limit),
            has_next: endIndex < total,
            has_previous: startIndex > 0,
        };

        return res.status(200).json({
            message: "Buyers retrieved successfully",
            data: paginatedBuyers,
            pagination,
        });
    } catch (error) {
        console.error("Error in getting buyers:", error);
        const errorMessage =
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : error.message;
        return res.status(500).json({ message: errorMessage });
    }
};

export const getBuyerStatistics = async (req, res) => {
    console.log("get buyer stats");
    try {
        const buyers = await OnboardingRequest.scan("role").eq("buyer").exec();

        const statistics = {
            total_buyers: buyers.length,
            status_breakdown: {
                pending: 0,
                accept: 0,
                reject: 0,
            },
            with_company_details: 0,
            with_email: 0,
        };

        // Calculate statistics
        buyers.forEach((buyer) => {
            // Status breakdown
            statistics.status_breakdown[buyer.onboarding_status]++;

            // Company details count
            if (buyer.company_details?.company_name) {
                statistics.with_company_details++;
            }

            // Email count
            if (buyer.contact_details?.email) {
                statistics.with_email++;
            }
        });

        return res.status(200).json({
            message: "Buyer statistics retrieved successfully",
            data: statistics,
        });
    } catch (error) {
        console.error("Error in getting buyer statistics:", error);
        const errorMessage =
            process.env.NODE_ENV === "production"
                ? "Internal Server Error"
                : error.message;
        return res.status(500).json({ message: errorMessage });
    }
};

// Admin decision endpoint for onboarding requests
router.put("/admin-decision/:onboarding_request_id", async (req, res) => {
    console.log("This does not get printed");
    try {
        const { onboarding_request_id } = req.params;
        const { decision, admin_id, assigned_operator } = req.body;
        console.log(
            onboarding_request_id,
            decision,
            admin_id,
            assigned_operator
        );
        // Validate input
        if (!onboarding_request_id || !decision || !admin_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing required fields: onboarding_request_id, decision, and admin_id are required",
            });
        }

        if (!["accepted", "rejected"].includes(decision.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid decision. Must be either 'accepted' or 'rejected'",
            });
        }

        // Get the onboarding request
        const onboardingRequest = await OnboardingRequest.get({
            onboarding_request_id,
        });
        if (!onboardingRequest) {
            return res.status(404).json({
                success: false,
                message: "Onboarding request not found",
            });
        }

        // Check if request is already processed
        console.log("Checking processing");
        if (onboardingRequest.onboarding_status !== "pending") {
            return res.status(400).json({
                success: false,
                message: `This request has already been ${onboardingRequest.onboarding_status}`,
            });
        }
        console.log(decision);
        // If decision is reject, just update the status
        if (decision.toLowerCase() === "reject") {
            await OnboardingRequest.update(
                { onboarding_request_id },
                {
                    onboarding_status: "rejected",
                    rejection_date: new Date().toISOString(),
                    rejected_by: admin_id,
                }
            );

            return res.status(200).json({
                success: true,
                message: "Onboarding request rejected successfully",
            });
        }

        // If decision is accept, create new user and update onboarding status
        if (decision.toLowerCase() === "accepted") {
            // Check if user with same phone number and role already exists
            const existingUser = await User.scan("contact_details.phone_number")
                .eq(onboardingRequest.contact_details.phone_number)
                .and()
                .where("role")
                .eq(onboardingRequest.role)
                .exec();

            if (existingUser.count > 0) {
                return res.status(400).json({
                    success: false,
                    message: `User with phone number ${onboardingRequest.contact_details.phone_number} is already registered as a ${onboardingRequest.role}`,
                });
            }

            // Create new user with only required and provided fields
            const userFields = {
                personal_details: {
                    fullName: onboardingRequest.personal_details.full_name,
                },
                contact_details: onboardingRequest.contact_details,
                role: onboardingRequest.role,
                created_by: admin_id,
                assigned_operator: assigned_operator || "",
                status: "accepted", // New field to track user status
                fcm_token: onboardingRequest.fcm_token || "", // Transfer FCM token
            };

            // Only add company details if they exist
            if (onboardingRequest.company_details) {
                userFields.company_details = {
                    company_name:
                        onboardingRequest.company_details.company_name,
                };

                // Only add GST if it exists
                if (onboardingRequest.company_details.gst_number) {
                    userFields.company_details.gst_number =
                        onboardingRequest.company_details.gst_number;
                }

                // Add company address if it exists
                if (onboardingRequest.company_details.company_address) {
                    userFields.company_details.company_address =
                        onboardingRequest.company_details.company_address;
                }
            }

            console.log(userFields);

            const newUser = new User(userFields);
            await newUser.save();

            // Update onboarding request status but keep the record
            await OnboardingRequest.update(
                { onboarding_request_id },
                {
                    onboarding_status: "accepted",
                    acceptance_date: new Date().toISOString(),
                    accepted_by: admin_id,
                    assigned_operator: assigned_operator || "",
                    user_id: newUser.user_id, // Reference to created user
                }
            );

            return res.status(200).json({
                success: true,
                message:
                    "Onboarding request accepted and user created successfully",
                data: newUser,
            });
        }
    } catch (error) {
        console.error("Error processing admin decision:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Get all onboarding requests
router.get("/", async (req, res) => {
    try {
        const requests = await OnboardingRequest.scan().exec();
        return res.status(200).json({
            success: true,
            message: "Onboarding requests retrieved successfully",
            data: requests,
        });
    } catch (error) {
        console.error("Error fetching onboarding requests:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

// Get onboarding request by ID
router.get("/:onboarding_request_id", authMiddleware, async (req, res) => {
    try {
        const { onboarding_request_id } = req.params;
        const request = await OnboardingRequest.get({ onboarding_request_id });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Onboarding request not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Onboarding request retrieved successfully",
            data: request,
        });
    } catch (error) {
        console.error("Error fetching onboarding request:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
});

router.post("/buyer", onboardBuyer);
router.post("/buyer/:onboarding_request_id", updateBuyer);
router.get("/buyer/:onboarding_request_id", getBuyerById);
router.get("/buyers", getAllBuyers);
router.get("/getbuyer/statistics", getBuyerStatistics);

router.post("/createbuyer", async (req, res) => {
    try {
        const { first_name, last_name, city, phone_number, company_name } =
            req.body;

        // Validate Data
        if (
            !first_name ||
            !last_name ||
            !city ||
            !phone_number ||
            !company_name
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (!validatePhoneNumber(phone_number)) {
            return res
                .status(400)
                .json({ message: "Invalid phone number format" });
        }

        const existingBuyer = await OnboardingRequest.scan(
            "contact_details.phone_number"
        )
            .eq(phone_number)
            .and()
            .where("role")
            .eq("buyer")
            .exec();

        if (existingBuyer.count > 0) {
            return res.status(409).json({
                message: "A buyer with this phone number already exists",
            });
        }
        const newBuyerOnboarding = new OnboardingRequest({
            role: "buyer",
            personal_details: {
                full_name: `${first_name} ${last_name}`,
            },
            contact_details: {
                phone_number: phone_number,
            },
            company_details: {
                company_name: company_name,
                company_address: {
                    city: city,
                },
            },
        });

        const savedBuyer = await retryOperation(
            () => newBuyerOnboarding.save(),
            3
        );
        await createAdminNotifications({}, savedBuyer);

        return res.status(201).json({
            message: "Buyer onboarding request created successfully",
            data: savedBuyer,
        });
    } catch (error) {
        console.error("Error creating buyer onboarding request:", error);
    }
});
export default router;
