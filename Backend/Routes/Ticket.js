import {
    Ticket,
    Product,
    User,
    Moderator,
    Notification,
} from "../Model/Models.js";
import express from "express";
import notificationService from "../Services/NotificationService.js";

// Helper function for error handling

const router = express.Router();
const handleError = (res, error) => {
    console.error("Error:", error);
    return res.status(500).json({
        success: false,
        message: "An error occurred",
        error: error.message,
    });
};

// Create a new ticket
const createTicket = async (req, res) => {
    try {
        const { buyer_id, product_id } = req.body;

        if (!product_id || !buyer_id) {
            return res.status(400).json({
                success: false,
                error: "Product ID and Buyer ID are required",
            });
        }

        // Get product details
        const product = await Product.get(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found",
            });
        }

        // Get buyer details
        const buyer = await User.get(buyer_id);
        const seller = await User.get(product.seller_id);
        if (!buyer) {
            return res.status(404).json({
                success: false,
                error: "Buyer not found",
            });
        }
        if (!seller) {
            return res.status(404).json({
                success: false,
                error: "Seller not found",
            });
        }
        console.log("buyer value ", buyer);
        console.log("product value us ", product);
        const ticketData = {
            product_id: product.product_id,
            product_name: product.name,
            price: product.price,
            price_details: product.price_details || {},
            buyer_id: buyer.user_id,
            buyer_details: {
                company_name: buyer.company_details.company_name,
                city: buyer.company_details.company_address.city,
                buyer_name: buyer.personal_details.fullName,
                buyer_contact_number: buyer.contact_details.phone_number,
            },
            seller_id: product.seller_id,
            seller_details: {
                company_name: seller.company_details.company_name,
                city: seller.company_details.company_address.city,
                seller_name: seller.personal_details.fullName,
                seller_contact_number: seller.contact_details.phone_number,
            },
            assigned_operator: buyer.assigned_operator,
            // description: "Placeholder", // TODO: fix this, currently hardcoding
        };

        // Create the ticket
        const newTicket = await Ticket.create(ticketData);
        createModeratorNotifications(newTicket);
        return res.status(201).json({
            success: true,
            message: "Ticket created successfully",
            data: newTicket,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get a ticket by ID
const getTicketById = async (req, res) => {
    try {
        const { ticket_id } = req.params;

        // Convert to Number since ticket_id is stored as a Number
        const numericTicketId = Number(ticket_id);

        // Fetch the ticket
        const ticket = await Ticket.get(numericTicketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: ticket,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
    try {

        console.log("update ticket status api call");
        const { ticket_id } = req.params;
        const { status, description } = req.body;
        console.log("Ticket status api call  body" , req.body); 
        // Convert to Number since ticket_id is stored as a Number
        const numericTicketId = Number(ticket_id);

        // Fetch the ticket to update
        const ticket = await Ticket.get(numericTicketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }

        // console.log("Ticket found");
        // console.log(ticket);

        // Validate the status
        const validStatuses = [
            "InProgress",
            "Acknowledged_by_Operator",
            "Deal_Cancel",
            "Deal_Complete",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status",
            });
        }

        // Prepare update object
        const updateData = {
            status: status,
        };

        // Add description if provided
        if (description) {
            updateData.description = description;
        }

        // Add resolve_timestamp if status is Accepted or Rejected
        if (status === "Accepted" || status === "Rejected") {
            updateData.resolve_timestamp = new Date();
        }

        // Update the ticket
        const updatedTicket = await Ticket.update(
            { ticket_id: numericTicketId },
            updateData
        );

        return res.status(200).json({
            success: true,
            message: "Ticket status updated successfully",
            data: updatedTicket,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Get tickets by buyer ID
const getTicketsByBuyerId = async (req, res) => {
    try {
        const { buyer_id } = req.params;

        // Query tickets by buyer_id using the global secondary index
        const tickets = await Ticket.query("buyer_id")
            .eq(buyer_id)
            .using("buyerIndex")
            .exec();

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const getTicketByOperatorID = async (req, res) => {
    try {
        // const { operator_id } = req.params;
        const { user } = req.user;

        const { page = 1, limit = 10 } = req.body;

        let scanResult, totalItems;
        if (user.role === "Admin") {
            console.log("Admin");
            scanResult = await Ticket.scan().exec();
            totalItems = scanResult.length;
        } else {
            scanResult = await Ticket.scan("assigned_operator")
                .eq(user.moderator_id)
                .exec();
            totalItems = scanResult.length;
        }

        scanResult.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        // Calculate the start position
        const startPosition = (page - 1) * limit;

        // Apply pagination manually
        const tickets = scanResult.slice(startPosition, startPosition + limit);

        //console.log(tickets);

        return res.status(200).json({
            success: true,
            count: tickets.length,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page),
            data: tickets,
        });
    } catch (error) {
        return handleError(res, error);
    }
};
// Get tickets by buyer ID and status
const getTicketsByBuyerAndStatus = async (req, res) => {
    try {
        const { buyer_id, statuses } = req.body;
        console.log(buyer_id);
        console.log("statuses: " + statuses);
        if (!buyer_id) {
            return res.status(400).json({
                success: false,
                message: "Buyer ID is required in request body",
            });
        }

        if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one status is required in request body",
            });
        }

        // Query tickets by buyer_id
        let tickets = await Ticket.query("buyer_id")
            .eq(buyer_id)
            .using("buyerIndex")
            .exec();

        // Filter by status
        tickets = tickets.filter((ticket) => statuses.includes(ticket.status));
        console.log("tickets: ");
        console.log(tickets);

        return res.status(200).json({
            success: true,
            count: tickets.length,
            data: tickets,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred",
            error: error.message,
        });
    }
};

// Get all tickets with pagination
const getAllTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.body;

        // Calculate the start position
        const startPosition = (page - 1) * limit;

        // Scan all tickets
        let scanResult = await Ticket.scan().exec();
        const totalItems = scanResult.length;

        scanResult.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });

        // Apply pagination manually
        const tickets = scanResult.slice(startPosition, startPosition + limit);

        return res.status(200).json({
            success: true,
            count: tickets.length,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page),
            data: tickets,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Update a ticket
const updateTicket = async (req, res) => {
    try {
        console.log("inside the update ticket function")
        const { ticket_id } = req.params;
        const updateData = req.body;

        // Only allow updates to specific fields
        const allowedFields = ["status", "description", "resolve_timestamp"];

        // Filter out any fields that are not allowed
        const filteredUpdateData = Object.keys(updateData)
            .filter((key) => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updateData[key];
                return obj;
            }, {});

        // If there are no allowed fields to update
        if (Object.keys(filteredUpdateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields to update",
            });
        }

        // Add resolve_timestamp if status is provided and is Accepted or Rejected
        if (
            filteredUpdateData.status &&
            (filteredUpdateData.status === "Accepted" ||
                filteredUpdateData.status === "Rejected")
        ) {
            filteredUpdateData.resolve_timestamp = new Date();
        }

        // Convert to Number since ticket_id is stored as a Number
        const numericTicketId = Number(ticket_id);

        // Update the ticket
        const updatedTicket = await Ticket.update(
            { ticket_id: numericTicketId },
            filteredUpdateData
        );

        return res.status(200).json({
            success: true,
            message: "Ticket updated successfully",
            data: updatedTicket,
        });
    } catch (error) {
        return handleError(res, error);
    }
};

// Delete a ticket
const deleteTicket = async (req, res) => {
    try {
        const { ticket_id } = req.params;

        // Convert to Number since ticket_id is stored as a Number
        const numericTicketId = Number(ticket_id);

        // Check if ticket exists
        const ticket = await Ticket.get(numericTicketId);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found",
            });
        }

        // Delete the ticket
        await Ticket.delete(numericTicketId);

        return res.status(200).json({
            success: true,
            message: "Ticket deleted successfully",
        });
    } catch (error) {
        return handleError(res, error);
    }
};

const createModeratorNotifications = async (ticketData) => {
    console.log("Ticket Data: ", ticketData);
    try {
        // Fetch all moderators with admin role
        const admins = await Moderator.scan("role").eq("Admin").exec();

        if (!admins || admins.length === 0) {
            console.warn("No admin moderators found for notifications");
            return;
        }

        // Take only the first admin from the list
        const firstAdmin = admins[0];
        console.log(firstAdmin);

        // Convert ticketData to a plain JavaScript object if it's a class instance
        const plainTicketData = JSON.parse(JSON.stringify(ticketData));

        // Create message object with proper structure - using plain objects
        const messageObject = {
            requestType: "New Interested Product Ticket",
            requestId: plainTicketData.ticket_id || "",
            status: plainTicketData.status || "Open",
            ticketDetails: plainTicketData,
            timestamp: new Date().toISOString(),
        };

        console.log("Message Object", messageObject);

        // Create a new notification object
        const notification = new Notification({
            title: "New Interested Product Ticket",
            message: messageObject,
            type: "TICKET_GENERATION",
            recipientType: "MODERATOR",
            recipientId: firstAdmin.moderator_id,
            isRead: false,
        });

        // console.log("Trying to save notification");
        // console.log(notification);

        // Save the notification
        const savedNotification = await notification.save();
        console.log("Notification saved successfully:", savedNotification);

        // Safely access nested properties with optional chaining
        const fullName =
            notification.message?.ticketDetails?.buyer_details?.buyer_name ||
            "A new buyer";

        const message = `${fullName} wants to onboard on the portal as new buyer`;
        // Fire notification
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

async function sendNotification(
    token,
    title,
    body = "A buyer showed interest for a product",
    data
) {
    try {
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
    } catch (error) {
        console.error("Error in /send endpoint:", error);
        //res.status(500).json({ success: false, error: error.message });
    }
}

router.post("/create", createTicket);

// READ - Get a single ticket by ticket_id
router.get("/:ticket_id", getTicketById);

// READ - Get all tickets with pagination
router.post("/all", getAllTickets);

// READ - Get tickets by buyer_id
router.get("/buyer/:buyer_id/tickets", getTicketsByBuyerId);

router.post("/operator", getTicketByOperatorID);

// READ - Get tickets by buyer and status filters
router.post("/buyer", getTicketsByBuyerAndStatus);

// UPDATE - Update ticket status
router.put("/:ticket_id/status", updateTicketStatus);

// UPDATE - Update any allowed fields of a ticket
router.put("/:ticket_id", updateTicket);

// DELETE - Delete a ticket
router.delete("/:ticket_id", deleteTicket);

export default router;
