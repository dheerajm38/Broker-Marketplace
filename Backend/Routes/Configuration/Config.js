import express from "express";
import { User, OnboardingRequest } from "../../Model/Models.js";
import { generateUserAccessToken, generateUserRefreshToken } from "../../Utils/AuthUtils.js";
const router = express.Router();

router.post("/basic-info", async (req, res) => {
    console.log("basic info called");
    try {
        const { phone_number } = req.body;
        // Check if user exists in the database

        const existingOnboarding = await OnboardingRequest.scan("contact_details.phone_number").eq(phone_number).exec();
        console.log("Existing Onboarding:", existingOnboarding);
        if(existingOnboarding.count === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        const onboardingRequest = existingOnboarding[0];
        console.log("Onboarding Request:", onboardingRequest);
        switch (onboardingRequest.onboarding_status) {
            case "pending": 
                const responseObject = {
                    name: onboardingRequest.personal_details?.full_name,
                    company_name: onboardingRequest.company_details?.company_name,
                    phone_number: onboardingRequest.contact_details?.phone_number,
                    status: onboardingRequest.onboarding_status,
                };
                return res.status(200).json(responseObject);
            case "accepted":
                {
                    const user = await User.scan("contact_details.phone_number").eq(phone_number).exec();
                    if (!user) {
                        return res.status(404).json({ message: "User not found" });
                    }
                    if(user.count > 1) {
                        return res.status(404).json({ message: "Multiple User Found" });
                    }
                    console.log("USER:", user);
                    const accessToken = generateUserAccessToken(user[0]);
                    const refreshToken = generateUserRefreshToken(user[0]);

                    console.log("Access Token: " + accessToken);
                    console.log("Refresh Token: " + refreshToken);
                    
                    return res.status(200).json({ message: "Onboarding request has already been approved.",
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        operator_id:user[0]?.assigned_operator,
                        user_id:user[0]?.user_id,
                        operatorPhoneNo:'8141211898'
                     });
                }
            case "rejected":
                {
                    return res.status(200).json({ 
                        message: "Onboarding request has been rejected." ,
                        name: onboardingRequest.personal_details?.full_name,
                        company_name: onboardingRequest.company_details?.company_name,
                        phone_number: onboardingRequest.contact_details?.phone_number,
                        status: onboardingRequest.onboarding_status,
                    });
                }
            default:
                break;
        }
    } catch (error) {
        console.error("Error fetching basic info:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;