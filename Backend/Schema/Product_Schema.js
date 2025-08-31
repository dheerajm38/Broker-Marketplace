import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

export const ProductSchema = new dynamoose.Schema(
    {
        product_id: {
            type: String,
            hashKey: true,
            default: () => uuidv4(),
        },
        name: {
            type: String,
            required: true,
            index: {
                name: "nameIndex",
                global: true,
            },
        },
        category: {
            type: Object,
            required: true,
            schema: {
                category_id: {
                    type: String,
                    required: true,
                },
                category_name: {
                    type: String,
                    required: true,
                },
            },
        },
        sub_category: {
            type: Object,
            required: true,
            schema: {
                sub_category_id: {
                    type: String,
                    required: true,
                },
                sub_category_name: {
                    type: String,
                    required: true,
                },
            },
        },
        price: {
            type: Number,
            required: true,
        },
        description: {
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
        seller_id: {
            type: String,
            required: true,
            index: {
                name: "sellerIndex",
                global: true,
            },
        },
        added_by: {
            type: Object,
            schema: {
                user_id: {
                    type: String,
                    required: true,
                },
                user_name: {
                    type: String,
                    required: true,
                },
            },
            required: true,
        },
        images: {
            type: Array,
            schema: [String],
        },
        status: {
            type: String,
            required: true,
            default: "active",
            enum: ["active", "inactive"],
            index: {
                name: "statusIndex",
                global: true,
            },
        },
        updated_by:{
            type: Object,
            schema: {
                user_id: {
                    type: String,
                    required: true,
                },
                user_name: {
                    type: String,
                    required: true,
                },
            },
            required: true
        },
        last_updated_price:{
            type: Number,
        }
    },
    {
        timestamps: true,
    }
);
