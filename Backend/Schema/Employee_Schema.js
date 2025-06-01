import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";
import { Employee } from "../Model/Models.js";
import { generateUniqueRangeId } from "../Schema/Utils/generateUniqueRangeId.js";

const PersonalDetailSchema = {
    "fullName": {
        type: String,
        required: true
    },
    // "date_of_birth": {
    //     type: String, 
    //     required: true
    // }
}
const addressSchema = {
    street: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    }
};

const ContactDetailSchema = {
    "email": {
        type: String
    },
    "address": {
        type: Object,
        schema: addressSchema
    },
    "phone_number":{
        type: String,
        required: true
    }
}

const EmployeeSchema = new dynamoose.Schema({
    "employee_id": {
        type: String,
        hashKey: true,
        default: async function() {
            try {
                return await generateUniqueCategoryId();
            } catch (error) {
                console.error(error);
                throw error;
            }
        }
    },
    "personal_details": {
        type: Object,
        schema: PersonalDetailSchema
    },
    "contact_details": {
        type: Object,
        schema: ContactDetailSchema
    },
    "role": {
        type: String,
        enum: [ 'admin', 'operator'],
        required: true
    },
    "created_by": {
        type: String
    }
});

async function generateUniqueCategoryId() {
    let isUnique = false;
    let newId;
    
    while (!isUnique) {
        newId = generateUniqueRangeId(1000, 4444);
        
        const existingCategory = await Employee.get({ employee_id: newId });
        if (!existingCategory) {
            isUnique = true;
        }
    }
    
    return newId;
}

export default EmployeeSchema;
  