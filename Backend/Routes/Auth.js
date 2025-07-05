import express from "express";
import { User, Moderator, ModeratorToken, OnboardingRequest } from "../Model/Models.js";
import { apiResponse } from "../Functionality/ApiResponse.js";
import { generateAccessToken, generateRefreshToken, generateUserAccessToken, generateUserRefreshToken } from "../Utils/AuthUtils.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import axios from "axios";
import { sendOTP } from "../Services/AuthService.js";

const router = express.Router();

// login dashboard
router.post("/login", async (req, res) => {
    console.log("Login User request received - {}", req.body);
    const { email, password } = req.body;

    try {
        let moderator;
        const result = await Moderator.scan('email').eq(email).exec();

        if (result.length > 0) {
            moderator = result[0];
            if (result.length > 1) {
                return res.status(401).json(apiResponse(401, "Multiple users found"));
            }
        } else {
            moderator = null;
        }

        if (!moderator) {
            return res
                .status(401)
                .json(apiResponse(401, "Invalid credentials"));
        }
        console.log("Moderator", moderator);
        const isPasswordValid = await bcrypt.compare(
            password,
            moderator.password
        );

        if (!isPasswordValid) {
            return res
                .status(401)
                .json(apiResponse(401, "Invalid email or password"));
        }

        let resultModerator = { ...moderator };
        delete resultModerator.password;

        const accessToken = generateAccessToken(resultModerator);
        const refreshToken = generateRefreshToken(resultModerator);
        console.log("Access Token: " + accessToken);
        console.log("Refresh Token: " + refreshToken);

        const userAgent = req.headers["user-agent"] || "";
        const isReactNative = userAgent.includes("ReactNative");

        // Calculate expiration date (7 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Save refresh token to DynamoDB
        // await ModeratorToken.create({
        //     moderator_id: moderator.moderator_id,
        //     refresh_token: refreshToken,
        //     user_agent: userAgent,
        //     expires_at: expiresAt,
        // });

        if (isReactNative) {
            return res.json({ accessToken, refreshToken });
        }

        // React Web (Browser): Set refresh token in HTTP-only cookie
        res.cookie("REFRESH", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiry
        });

        res.status(200).json({
            message: "Login Success",
            accessToken,
        });
    } catch (error) {
        console.log(error);
        return res
            .status(500)
            .json(apiResponse(500, "Server error during login"));
    }
});

//login mobile
router.post("/login/user", async (req, res) => {
  
    try {
        const { phone_number } = req.body;
        const existingOnboarding = await OnboardingRequest.scan("contact_details.phone_number").eq(phone_number).exec();
        if(existingOnboarding.count === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // problem here is that what if the admin manually add the buyer 
        // then cant able to find in the onboarding schema
        const sendOTPResponse = await sendOTP(phone_number);

        const { verificationId } = sendOTPResponse.data;

        return res.status(200).json({
            message: "OTP sent successfully",
            verificationId: verificationId,
            phone_number: phone_number,
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
});

//sendotp mobile
router.post("/sendotp/user", async (req, res) => {
  console.log("inside the send otp of the user", req.body);
    try {
        const { phone_number } = req.body;

        const sendOTPResponse = await sendOTP(phone_number);
        console.log("send otp response", sendOTPResponse);
        const { verificationId } = sendOTPResponse.data;

        return res.status(200).json({
            message: "OTP sent successfully",
            verificationId: verificationId,
            phone_number: phone_number,
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json(apiResponse(500, "Server error during OTP sending"));
    }
});


//MOBILE BUYER SIGNUP
router.post("/signup", async (req, res) => {
    try {
        const { phone_number } = req.body;
        console.log("Phone number:", phone_number);
        const existingUser = await User.scan("contact_details.phone_number").eq(phone_number).exec();
        console.log(existingUser);
        if (existingUser.length > 0) {
            return res.status(400).json(apiResponse(400, "User already exists"));
        }

        const existingOnboarding = await OnboardingRequest.scan("contact_details.phone_number").eq(phone_number).exec();
        if (existingOnboarding.length > 0) {
            return res.status(400).json(apiResponse(400, "Onboarding request already exists"));
        }

        const sendOTPResponse = await sendOTP(phone_number);
        const { verificationId } = sendOTPResponse.data;

        return res.status(200).json({
            message: "OTP sent successfully",
            verificationId: verificationId,
            phone_number: phone_number,
        });
    } catch (error) {
        console.error("Error signing up:", error);
        return res.status(500).json(apiResponse(500, "Server error during signup"));
    }
});

router.post("/refresh-token", async (req, res) => {
    const refreshToken = req.cookies.REFRESH || req.body.refreshToken;
    console.log("Refresh token: " + refreshToken);
    if (!refreshToken) {
        return res.status(401).json(apiResponse(401, "Refresh token required"));
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        console.log("Decoded2", decoded);
        // Generate new tokens
        const isMobile = req.headers["device"]?.includes("mobile");
        console.log("is mobile ",isMobile);
        const newAccessToken = isMobile ? generateUserAccessToken(decoded.user) : generateAccessToken(decoded.user);
        const newRefreshToken = isMobile ? generateUserRefreshToken(decoded.user) : generateRefreshToken(decoded.user);
        console.log(newAccessToken, newRefreshToken);

        // Update the refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        res.cookie("REFRESH", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json(apiResponse(401, "Invalid refresh token"));
    }
});

async function validateRefreshToken(moderatorId, token) {
    try {
        const result = await ModeratorToken.scan()
            .filter("moderator_id")
            .eq(moderatorId)
            .filter("refresh_token")
            .eq(token)
            .exec();

        if (result.length === 0) {
            return false;
        }

        const tokenRecord = result[0];
        const now = new Date();

        // Check if token has expired
        if (now > tokenRecord.expires_at) {
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error validating refresh token:", error);
        return false;
    }
}

async function invalidateRefreshToken(moderatorId, token) {
    try {
        const result = await ModeratorToken.scan()
            .filter("moderator_id")
            .eq(moderatorId)
            .filter("refresh_token")
            .eq(token)
            .exec();

        if (result.length > 0) {
            await ModeratorToken.delete(moderatorId);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error invalidating refresh token:", error);
        return false;
    }
}

router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.REFRESH || req.body.refreshToken;
    if (!refreshToken) {
        return res
            .status(400)
            .json(apiResponse(400, "No refresh token provided"));
    }

    try {
        // Verify the token to get the moderator_id
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Invalidate the token
        await invalidateRefreshToken(decoded.moderator_id, refreshToken);

        // Clear the cookie if it was set
        res.clearCookie("REFRESH");

        return res
            .status(200)
            .json(apiResponse(200, "Logged out successfully"));
    } catch (error) {
        console.error("Logout error:", error);
        return res
            .status(500)
            .json(apiResponse(500, "Server error during logout"));
    }
});

router.post("/sendOTP/moderator", async (req, res) => {
    console.log("inside the send OTP of the moderator", req.body);
    try {
        const { phone_number } = req.body;
        const moderator = await Moderator.scan("phone_number").eq(phone_number).exec();
        console.log("moderator log ", moderator);
        if (moderator == undefined || moderator == null || moderator.length == 0) {
            return res.status(404).json(apiResponse(404, "Moderator  not found"));
        }

        const sendOTPResponse = await sendOTP(phone_number);

        const { verificationId } = sendOTPResponse.data;

        return res.status(200).json({
            message: "OTP sent successfully",
            verificationId: verificationId,
            phone_number: phone_number,
        });
    } catch (error) {
        console.error("Error sending OTP:", error);
    }
});

router.post("/verifyOTP/moderator", async (req, res) => {
    console.log("inside the verify OTP of the moderator", req.body);

    try {
        const { phone_number, otp, verificationId } = req.body;

        const moderator = await Moderator.scan("phone_number").eq(phone_number).exec();

        if (moderator == undefined || moderator == null || moderator.length == 0) {
            return res.status(404).json(apiResponse(404, "Moderator not found"));
        }
        let authConfig = {
            method: 'get',
            url: `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${process.env.MESSAGE_CENTRAL_CUSTOMERID}&key=${process.env.MESSAGE_CENTRAL_PASSWORD_ENCODED}&scope=NEW`,
            headers: {
                'accept': ''
            }
        };

        const authResponse = await axios(authConfig);
        console.log(authResponse.data);

        const config = {
            method: 'get',
            url: 'https://cpaas.messagecentral.com/verification/v3/validateOtp',
            params: {
                countryCode: "91",
                customerId: `${process.env.MESSAGE_CENTRAL_CUSTOMERID}`,
                flowType: "SMS",
                mobileNumber: phone_number,
                verificationId: verificationId,
                code: otp,
            },
            headers: {
                'authToken': authResponse.data.token,
            }
        };
        const response = await axios(config);

        console.log(response.data);
        return res.status(200).json(apiResponse(200, "OTP verified successfully"));


    }
    catch (error) {
        console.error("Error verifying", error)
        return res.status(500).json(apiResponse(500, "Server error during OTP verification"));
    }
});

router.post("/verifyOTP/user", async (req, res) => {
    try {
        console.log("inside the verify OTP of the user", req.body);
        const { verificationId , phone_number, otp} = req.body;

        let authConfig = {
            method: 'get',
            url: `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${process.env.MESSAGE_CENTRAL_CUSTOMERID}&key=${process.env.MESSAGE_CENTRAL_PASSWORD_ENCODED}&scope=NEW`,
            headers: {
                'accept': ''
            }
        };

        const authResponse = await axios(authConfig);
        console.log("auth response ",authResponse.data);

        const config = {
            method: 'get',
            url: 'https://cpaas.messagecentral.com/verification/v3/validateOtp',
            params: {
                countryCode: "91",
                customerId: `${process.env.MESSAGE_CENTRAL_CUSTOMERID}`,
                flowType: "SMS",
                mobileNumber: phone_number,
                verificationId: verificationId,
                code: otp,
            },
            headers: {
                'authToken': authResponse.data.token,
            }
        };
        const response = await axios(config);

        return res.status(200).json(apiResponse(200, "OTP verified successfully"));

    } catch (error) {
        console.error("Error verifying", error)
        return res.status(500).json(apiResponse(500, "Server error during OTP verification"));
    }
})

router.post("/updatePassword", async (req, res) => {
    try {
        const { password, phone_number, verificationId } = req.body;

        if (!password || !phone_number || !verificationId) {
            return res.status(400).json(apiResponse(400, "Missing required fields"));
        }

        const moderator = await Moderator.scan("phone_number").eq(phone_number).exec();

        if (!moderator || moderator.length === 0) {
            return res.status(404).json(apiResponse(404, "Moderator not found"));
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const updatedModerator = await Moderator.update(
            { moderator_id: moderator[0].moderator_id },
            { password: hashedPassword }
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });

    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json(apiResponse(500, "Server error during password update"));
    }
});

export default router;
