import express from "express";
import { Product, User, OnboardingRequest, Ticket } from "../Model/Models.js";

const router = express.Router();

router.get("/details", async function (req, res) {
    console.log("dashboard details called");
    try {
        // Get counts of buyers and sellers
        const userResult = await User.scan("role")
            .in(["buyer", "seller"])
            .exec();

        // Count occurrences
        const counts = userResult.reduce(
            (acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            },
            { buyer: 0, seller: 0 }
        );

        const buyersCount = counts.buyer;
        const sellersCount = counts.seller;

        console.log(buyersCount, sellersCount);

        // Get count of pending buyer onboarding requests
        const onboardingRequests = await OnboardingRequest.scan("role")
            .eq("buyer")
            .and()
            .where("onboarding_status")
            .eq("pending")
            .count()
            .exec();

        const onboardingRequestsCount = onboardingRequests;

        // Get count of active products
        const activeProductsCount = await Product.scan("status")
            .eq("active")
            .count()
            .exec();

        // Get today's date at beginning of day (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get tomorrow's date at beginning of day (midnight)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Convert dates to timestamps for comparison
        const todayTimestamp = today.getTime();
        const tomorrowTimestamp = tomorrow.getTime();

        // Query for tickets created today using createdAt (timestamps in your schema)
        const ticketsOpenedToday = await Ticket.scan()
            .where("createdAt")
            .count()
            .exec();

        // Query for tickets completed today (status is Accepted or Rejected)
        const ticketsCompletedToday = await Ticket.scan()
            .where("updatedAt")
            .between(todayTimestamp, tomorrowTimestamp)
            .and()
            .where("status")
            .in(["Accepted", "Rejected"])
            .count()
            .exec();

        const obj = {
            buyersCount,
            sellersCount,
            onboardingRequestsCount,
            activeProductsCount,
            ticketsCompletedToday,
            ticketsOpenedToday,
            date: today.toISOString().split("T")[0], // Include the date for reference
        };
        console.log(obj);

        // Return all the accumulated information
        return res.status(200).json({
            success: true,
            data: {
                buyersCount,
                sellersCount,
                onboardingRequestsCount: onboardingRequestsCount.count,
                activeProductsCount: activeProductsCount.count,
                ticketsCompletedToday: ticketsCompletedToday.count,
                ticketsOpenedToday: ticketsOpenedToday.count,
                date: today.toISOString().split("T")[0], // Include the date for reference
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard statistics",
            error: error.message,
        });
    }
});

export default router;
