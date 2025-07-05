import jwt from "jsonwebtoken";
import { apiResponse } from "../Functionality/ApiResponse.js";
import express from "express";

const router = express.Router();

// Array of paths that don't require authentication
const PUBLIC_PATHS = ["/auth/verifyOTP/user","/config/basic-info","/auth/sendotp/user","/onboarding/createbuyer","/auth/login", "/auth/register", "/auth/refresh-token","/auth/login/user", "config/basic-route", "/onboarding/buyer","auth/signup","/sendotp/user"];
export const authMiddleware = (req, res, next) => {

    if (PUBLIC_PATHS.some((path) => req.path.includes(path))) {
        console.log("Bypassing for public path");
        return next();
    }

    // console.log("Request Header cookies={}", req.headers.cookie);
    const userAgent = req.headers["user-agent"] || "";
    const isReactNative = req.headers["device"] || ""
    console.log("isReactNative", isReactNative, userAgent);
    console.log("Request Headers", req.headers);
    // if (isReactNative != 'mobile') {
    //     next();
    // }

    const accessToken = req.headers["authorization"]?.split(" ")[1];
    const refreshToken = req.cookies.REFRESH;

    if (!accessToken) {
        return res
            .status(401)
            .json(apiResponse(401, "Access token is missing"));
    }

    try {
        // Verify access token
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );
        console.log("Decoded", decoded);
        req.user = decoded;
        console.log("Tokein verfied successfully...Proceeding towards controller.");
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json(apiResponse(401, "Token Expired"));
        } else {
            return res
                .status(403)
                .json(apiResponse(403, "Invalid access token"));
        }
    }
};

// Enhanced Auth.js routes
