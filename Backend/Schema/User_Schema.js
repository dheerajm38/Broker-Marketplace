import dynamoose from "dynamoose";
import { generateUniqueRangeId } from "../Schema/Utils/generateUniqueRangeId.js";
import { User } from "../Model/Models.js";

const PersonalDetailSchema = {
    fullName: {
        type: String,
        required: true,
    },
    // "date_of_birth": {
    //     type: String,
    //     required: true
    // },
    // "pan_number":{
    //     type:String,
    // }
};

const addressSchema = {
    street: {
        type: String,
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
    },
    state: {
        type: String,
        //   required: true
    },
    zip_code: {
        type: String,
        //   required: true
    },
};

const ContactDetailSchema = {
    email: {
        type: String,
        // required: true
    },
    phone_number: {
        type: String,
        required: true,
    },
};

const CompanyDetailSchema = {
    company_name: {
        type: String,
        required: true,
    },
    gst_number: {
        type: String,
    },
    company_address: {
        type: Object,
        schema: addressSchema,
    },
};

// Define the User Schema with the GSI for email
const UserSchema = new dynamoose.Schema(
    {
        user_id: {
            type: String,
            hashKey: true,
            default: async function () {
                try {
                    return await generateUniqueCategoryId();
                } catch (error) {
                    console.error(error);
                    throw error;
                }
            },
        },
        personal_details: {
            type: Object,
            schema: PersonalDetailSchema,
        },
        contact_details: {
            type: Object,
            schema: ContactDetailSchema,
        },
        company_details: {
            type: Object,
            schema: CompanyDetailSchema,
        },
        role: {
            type: String,
            enum: ["buyer", "seller"],
            required: true,
        },
        created_by: {
            type: String,
            required: true,
        },
        assigned_operator: {
            type: String, // this will be operator id for seller it will be null
            default: "",
        },
        fcm_token: {
            type: String,
            required: false, // Making it optional since it might be updated after registration
            default: ""
        }
    },
    {
        timestamps: true,
        saveUnknown: false,
        strict: true,
        indexes: [
            {
                name: "EmailIndex", // Name of the GSI
                global: true, // GSI flag
                hashKey: "contact_details.email", // Index the email field
                throughput: {
                    read: 5,
                    write: 5,
                },
            },
        ],
    }
);

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

export default UserSchema;
