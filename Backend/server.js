import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import {
    MessageRoute,
    ModeratorRoute,
    userRoute,
    ProductRoute,
    AuthRoute,
    CategoryRoute,
    SubCategoryRoute,
    OnoboardingRoute,
    TicketRoute,
    ConfigRoute,
} from "./Routes/index.js";
import { createServer } from "node:http";
import { socketConfig } from "./Config/SocketConfig.js";
import { awsConfig } from "./Config/AWSconfig.js";
import cors from "cors";
import { authMiddleware } from "./Middleware/AuthMiddleware.js";
import NotificationRoute from "./Routes/NotificationRoutes.js";
import BroadcastRoute from "./Routes/broadcast_routes.js";
import Dashboard from "./Routes/Dashboard.js";

const app = express();
const server = createServer(app);
socketConfig(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(authMiddleware);

awsConfig.initialize();

//Routes
app.use("/user", userRoute);
app.use("/auth", AuthRoute);
app.use("/category", CategoryRoute);
app.use("/subCategory", SubCategoryRoute);
app.use("/moderator", ModeratorRoute);
app.use("/message", MessageRoute);
app.use("/product", ProductRoute);
app.use("/notification", NotificationRoute);
app.use("/broadcast", BroadcastRoute);
app.use("/onboarding", OnoboardingRoute);
app.use("/dashboard", Dashboard);
app.use("/ticket", TicketRoute);
app.use("/config", ConfigRoute);
server.listen(8000, () => {
    console.log("sun rha hai hu mein - 8000 pe !");
});
