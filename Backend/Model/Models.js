import dynamoose from "dynamoose";
import UserSchema from "../Schema/User_Schema.js";
import EmployeeSchema from "../Schema/Employee_Schema.js";
import MessageSchema from "../Schema/Message/Message_Schema.js";
import TicketSchema from "../Schema/Ticket_Schema.js";
import CategorySchema from "../Schema/Category_Schema.js";
import SubCategorySchema from "../Schema/SubCategory_Schema.js";
import { CategorySubCategoryMappingSchema } from "../Schema/CategorySubCategoryMapping_Schema.js";
import OnboardingRequestSchema from "../Schema/OnboardingRequest_Schema.js";
import ModeratorSchema from "../Schema/Moderator_Schema.js";
import moderatorTokenSchema from "../Schema/ModeratorToken_Schema.js";
import ChatHistorySchema from "../Schema/Message/ChatHistory_Schema.js";
import NotificationSchema from "../Schema/Notification_Schema.js";
import BroadcastSchema from "../Schema/Broadcast_Schema.js";
import { ProductSchema } from "../Schema/Product_Schema.js";
import favoriteSchema from "../Schema/Favorite_Schema.js";
export const User = dynamoose.model("User", UserSchema);
export const Employee = dynamoose.model("Employee", EmployeeSchema);
export const Message = dynamoose.model("Message", MessageSchema);
export const Ticket = dynamoose.model("Ticket", TicketSchema);
export const Category = dynamoose.model("Category", CategorySchema);
export const SubCategory = dynamoose.model("SubCategory", SubCategorySchema);
export const CategorySubCategoryMapping = dynamoose.model(
    "CategorySubCategoryMapping",
    CategorySubCategoryMappingSchema
);
export const OnboardingRequest = dynamoose.model(
    "OnboardingRequest",
    OnboardingRequestSchema
);
export const ModeratorToken = dynamoose.model(
    "ModeratorToken",
    moderatorTokenSchema
);
export const Moderator = dynamoose.model("Moderator", ModeratorSchema);
export const ChatHistory = dynamoose.model("ChatHistory", ChatHistorySchema);
export const Notification = dynamoose.model("Notification", NotificationSchema);
export const Broadcast = dynamoose.model("Broadcast", BroadcastSchema);
export const Product = dynamoose.model("Product", ProductSchema);
export const Favorite = dynamoose.model('favoriteSchema',favoriteSchema);