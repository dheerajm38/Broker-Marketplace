import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const BroadcastSchema = new dynamoose.Schema({
    "broadcast_id": {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    "title": {
        type: String,
        required: true,
        index: {
            name: 'titleIndex',
            global: true
        }
    },
    "description": {
        type: String,
        required: true
    },
    "created_by": {
        type: String,
        required: true,
        index: {
            name: 'creatorIndex',
            global: true
        }
    },
}, {
    timestamps: true
});

// Remove the pre-save hook since it's not supported in Dynamoose this way
// The timestamps: true option will automatically handle created_at and updated_at

export default BroadcastSchema;