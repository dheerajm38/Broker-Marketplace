import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";
import { generateUniqueRangeId } from "./Utils/generateUniqueRangeId.js";
import { Ticket, User } from "../Model/Models.js";

const TicketSchema = new dynamoose.Schema(
    {
        ticket_id: {
            type: Number,
            hashKey: true,
            default: async function () {
                try {
                    return await generateUniqueTicketId();
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            },
        },
        buyer_id: {
            type: String,
            required: true,
            index: {
                name: "buyerIndex",
                global: true,
            },
        },
        buyer_details: {
            type: Object,
            schema: {
                company_name: {
                    type: String,
                    required: true,
                },
                city: {
                    type: String,
                    required: true,
                },
                buyer_name: {
                    type: String,
                    required: true,
                },
                buyer_contact_number: {
                    type: String,
                    required: true,
                },
            },
        },
        seller_id: {
            type: String,
            required: true,
            index: {
                name: "sellerIndex",
                global: true,
            },
        },
        seller_details: {
            type: Object,
            schema: {
                company_name: {
                    type: String,
                    required: true,
                },
                city: {
                    type: String,
                    required: true,
                },
                seller_name: {
                    type: String,
                    required: true,
                },
                seller_contact_number: {
                    type: String,
                    required: true,
                },
            },
        },
        product_id: {
            type: String,
            required: true,
            index: {
                name: "productIndex",
                global: true,
            },
        },
        product_name: {
            type: String,
            required: true,
        },
        price_details: {
            type: Object,
            schema: {
                unit: {
                    type: String,
                    required: true,
                    enum: ["per_kg", "per_quintal", "per_ton"],
                    default: "per_kg",
                },
                quantity: {
                    type: Number,
                    required: true,
                    validate: (value) => value > 0,
                },
            },
        },
        price: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: [
                "InProgress",
                "Acknowledged_by_Operator",
                "Deal_Cancel",
                "Deal_Complete",
            ],
            required: true,
            default: "InProgress",
            index: {
                name: "statusIndex",
                global: true,
            },
        },
        description: {
            type: String,
            required: false,
        },
        // this will be trigger either when deal is complete or when deal is cancel
        ticket_update_timestamp: {
            type: Date,
            required: false,
        },
        assigned_operator: {
            type: String,
            // required: false,
        },
        // have to add the complete by whom
        // acknowledge status and timestamp
    },
    {
        timestamps: true,
    }
);

const generateUniqueTicketId = async () => {
    // try {
    //     // Fetch only the highest ticket_id using DynamoDB query capability
    //     const tickets = await Ticket.scan()
    //         .attributes(["ticket_id"])
    //         .sort("descending")
    //         .limit(1)
    //         .exec();

    //     let newTicketId;

    //     if (tickets.length > 0) {
    //         // Extract the last ticket_id and increment it
    //         const lastTicketId = parseInt(tickets[0].ticket_id, 10);
    //         newTicketId = lastTicketId + 1;
    //     } else {
    //         // If no records exist, start with the initial ID
    //         newTicketId = 1000000;
    //     }

    //     console.log("Generated new ticket ID:", newTicketId);
    //     return newTicketId;
    // } catch (error) {
    //     console.error("Error generating unique ticket ID:", error);
    //     throw error;
    // }
    try {
        // TODO: optimised this function to fetch only the last ticket with highest ticket id and return new ticket id = highest_id + 1
        const tickets = await Ticket.scan().exec();

        let newTicketId;

        if (tickets.length > 0) {
            const sortedTickets = tickets.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            // Extract the last ticket_id and increment it
            const lastTicketId = parseInt(sortedTickets[0].ticket_id, 10);
            newTicketId = lastTicketId + 1;
        } else {
            // If no records exist, start with the initial ID
            newTicketId = 1000000;
        }
        console.log("newTicketId =", newTicketId);
        return newTicketId;
    } catch (error) {
        console.error("Error generating unique ticket ID:", error);
        throw error;
    }
};

export default TicketSchema;
