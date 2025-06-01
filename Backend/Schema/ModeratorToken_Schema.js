// Define the schema for ModeratorToken
import dynamoose from "dynamoose";

const moderatorTokenSchema = new dynamoose.Schema(
    {
        moderator_id: {
            type: String,
            hashKey: true, // This is the partition key
        },
        refresh_token: {
            type: String,
            required: true,
        },
        user_agent: {
            type: String,
            required: true,
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        expires_at: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt timestamps
    }
);

export default moderatorTokenSchema;
