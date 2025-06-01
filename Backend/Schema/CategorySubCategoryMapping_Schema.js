import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

export const CategorySubCategoryMappingSchema = new dynamoose.Schema({
    mapping_id: {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    category_id: {
        type: String,
        required: true,
        index: true  // For efficient querying
    },
    sub_category_id: {
        type: String,
        required: true,
        index: true  // For efficient querying
    }
});
