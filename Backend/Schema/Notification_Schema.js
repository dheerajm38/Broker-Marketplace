import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const notificationSchema = new dynamoose.Schema(
    {
        id: {
            type: String,
            hashKey: true, // Primary Key
            default: uuidv4, // Generates a UUID if not provided
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: Object, // DynamoDB supports storing objects
            required: true,
            // No nested schema - allow any valid JSON structure
        },
        type: {
            type: String,
            required: true,
            enum: [
                "BUYER_REQUEST",
                "BUYER_MESSAGE",
                "TICKET_GENERATION",
                "ADMIN_MESSAGE",
                "BROADCAST",
                "TICKET_PRICE_UPDATE",
            ],
        },
        recipientType: {
            type: String,
            required: true,
            enum: ["MODERATOR", "USER"],
        },
        recipientId: {
            type: String,
            required: true,
            index: {
                global: true,
                name: "RecipientIndex",
                project: true, // Allows fetching with this index
            },
        },
        senderId: {
            type: String,
            required: false,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
    },
    {
        timestamps: true, // Automatically manages createdAt & updatedAt
        saveUnknown: ["message.**"], // Critical: Allow any property path in the message object
        convertClassInstanceToMap: true,
    }
);

export default notificationSchema;
