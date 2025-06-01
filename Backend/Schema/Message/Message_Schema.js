import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const MessageSchema = new dynamoose.Schema({
    "message_id": {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    "sender_id": {
        type: String,
        required: true
    },
    "receiver_id": {
        type: String,
        required: true
    },
    "message_body": {
        type: String,
        required: true
    },
    "createdAt": {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) // Unix timestamp (seconds)
    },
    "updatedAt": {
        type: Number,
        default: () => Math.floor(Date.now() / 1000) ,// Unix timestamp (seconds)
        forceDefault: true
    }
}, { timestamps: false });

export default MessageSchema;
  