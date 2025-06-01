import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const favoriteSchema = new dynamoose.Schema(
    {
        id: {
            type: String,
            hashKey: true,
            default: uuidv4,
        },
        user_id: {
            type: String,
            required: true,
            index: {
                global: true,
                name: "UserIndex",
            }
        },
        product_id: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: () => new Date(),
        }
    },
    {
        timestamps: true,
    }
);

export default favoriteSchema; 