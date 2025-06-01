import dynamoose from "dynamoose";
import { User } from "../Model/Models.js";
import { generateUniqueRangeId } from "../Schema/Utils/generateUniqueRangeId.js";
import { v4 as uuidv4 } from "uuid";

async function generateUniqueCategoryId() {
    let isUnique = false;
    let newId;
    
    while (!isUnique) {
        newId = generateUniqueRangeId(10000, 99999);
        
        const existingCategory = await User.get({ user_id: newId });
        if (!existingCategory) {
            isUnique = true;
        }
    }
    
    return newId;
}
const PersonalDetailSchema = {
    "full_name": {
        type: String,
        required: true
    },
    // "date_of_birth": {
    //     type: String, 
    //     required: true
    // },
    // "pan_number":{
    //     type:String,
    // }
}

const addressSchema = {
    street: {
      type: String
    },
    city: {
      type: String,
      required: true
    },
    district: {
        type: String
    },
    state: {
      type: String,
    //   required: true
    },
    zip_code: {
      type: String,
    //   required: true
    }
};

const ContactDetailSchema = {
    "email": {
        type: String,
        // required: true
    },
    "phone_number":{
        type: String,
        required: true
    }
}

const CompanyDetailSchema = {
    "company_name": {
        type: String,
        required:true,
    },
    "gst_number": {
        type: String,
        // required: true
    },
    "company_address": {
        type: Object,
        schema: addressSchema
    },
}
const OnboardingRequestSchema = new dynamoose.Schema({ 
    "onboarding_request_id": {
        type: String,
        hashKey: true,
        default: ()=>uuidv4(),
    },
    "personal_details": {
        type: Object,
        schema: PersonalDetailSchema
    },
    "contact_details": {
        type: Object,
        schema: ContactDetailSchema
    },
    "company_details":{
        type: Object,
        schema: CompanyDetailSchema
    },
    "role": {
        type: String,
        enum: [ 'buyer', 'seller'],
        required: true
    },
    "onboarding_status":{
        type: String,
        required: true,
        enum: ["pending", "accept", "reject"],
        default: "pending" // accept , reject 
    },
    "fcm_token": {
        type: String,
        required: false,
        default: ""
    }
});
export default OnboardingRequestSchema;