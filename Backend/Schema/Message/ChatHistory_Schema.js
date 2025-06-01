import dynamoose from "dynamoose";
import { v4 as uuidv4 } from "uuid";

const ChatHistorySchema = new dynamoose.Schema({
    "chatHistory_id": {
        type: String,
        hashKey: true,
        default: () => uuidv4()
    },
    "emp_id": {
        type: String,
        required: true
        // opertor or admin 
    },
    "user_id": {
        type: String,
        required: true
    },
    "last_interaction": {
        type: String,
        required: true
    },
    "read_status": {
        type: String,
        required: true,
        default: "unread"
    }
},{ timestamps: true });


export default ChatHistorySchema;
  