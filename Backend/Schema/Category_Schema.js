import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const CategorySchema = new dynamoose.Schema({
    "category_id" : {
        type: String,
        hashKey: true,
        default: async function() {
                // return await generateUniqueCategoryId();
                return uuidv4(); // i think there is less chance of getting duplicate id's also the categories are 4,5 so i think we can use uuidv4
        }
    },
    "name" : {
        type: String,
        required: true
    },
    "description": {
        type: String
    }
});


export default CategorySchema;
