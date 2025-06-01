import dynamose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const ModeratorSchema = new dynamose.Schema(
    {
        moderator_id: {
            type: String,
            hashKey: true,
            default: async function () {
                try {
                    return uuidv4();
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            },
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        phone_number: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["Admin", "Operator"],
            required: true,
        },
        fcm_token: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

export default ModeratorSchema;
