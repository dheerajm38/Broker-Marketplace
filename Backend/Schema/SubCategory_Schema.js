import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const SubCategorySchema = new dynamoose.Schema({
    "sub_category_id" : {
        type: String,
        required: true,
        default: uuidv4
    },
    "name": {
        type: String,
        required: true
    },
    "description": {
        type: String
    },
    "category_id": {
        type: String,
        required: true,
        index: {
            name: 'categoryIndex',
            global: true
        }
    }
});

export default SubCategorySchema;