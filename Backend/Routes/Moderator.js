import express from "express";
import { Moderator } from "../Model/Models.js";
import { authMiddleware } from "../Middleware/AuthMiddleware.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Create a new moderator
router.post("/create", async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Check if moderator with email already exists
        const existingModerator = await Moderator.scan("email")
            .eq(email)
            .exec();
        if (existingModerator.count > 0) {
            return res
                .status(400)
                .json({ message: "Moderator with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new moderator
        const moderator = await Moderator.create({
            name,
            email,
            password: hashedPassword,
            phone_number: phone,
            role,
        });
        console.log(moderator);

        // Remove password from response
        const moderatorResponse = { ...moderator };
        delete moderatorResponse.password;

        res.status(201).json(moderatorResponse);
    } catch (error) {
        console.error("Error creating moderator:", error);
        res.status(500).json({
            message: "Error creating moderator",
            error: error.message,
        });
    }
});

// Get all moderators
router.get("/all", async (req, res) => {
    try {
        const moderators = await Moderator.scan().exec();

        // Remove passwords from response
        const moderatorsResponse = moderators.map((mod) => {
            const modObj = { ...mod };
            delete modObj.password;
            return modObj;
        });

        console.log(moderatorsResponse);

        res.status(200).json(moderatorsResponse);
    } catch (error) {
        console.error("Error fetching moderators:", error);
        res.status(500).json({
            message: "Error fetching moderators",
            error: error.message,
        });
    }
});

// Get moderator by ID
router.get("/:id", async (req, res) => {
    try {
        console.log(req);
        console.log(req.params.id);
        const moderator = await Moderator.get(req.params.id);
        if (!moderator) {
            return res.status(404).json({ message: "Moderator not found" });
        }

        // Remove password from response
        const moderatorResponse = { ...moderator };
        delete moderatorResponse.password;

        res.status(200).json(moderatorResponse);
    } catch (error) {
        console.error("Error fetching moderator:", error);
        res.status(500).json({
            message: "Error fetching moderator",
            error: error.message,
        });
    }
});

// Update moderator
// router.put("/:id", async (req, res) => {
//     try {
//         const { name, email, password, phone, role } = req.body;
//         const moderatorId = req.params.id;

//         // Check if moderator exists
//         const existingModerator = await Moderator.get(moderatorId);
//         if (!existingModerator) {
//             return res.status(404).json({ message: "Moderator not found" });
//         }

//         // Prepare update object
//         const updateData = {};
//         if (name) updateData.name = name;
//         if (email) updateData.email = email;
//         if (password) updateData.password = await bcrypt.hash(password, 10);
//         if (phone) updateData.phone = phone;
//         if (role) updateData.role = role;

//         // Update moderator
//         const updatedModerator = await Moderator.update(
//             moderatorId,
//             updateData
//         );

//         // Remove password from response
//         const moderatorResponse = { ...updatedModerator };
//         delete moderatorResponse.password;

//         res.status(200).json(moderatorResponse);
//     } catch (error) {
//         console.error("Error updating moderator:", error);
//         res.status(500).json({
//             message: "Error updating moderator",
//             error: error.message,
//         });
//     }
// });
router.put("/:id", async (req, res) => {
    try {
        console.log("Inside /put for moderator");
        console.log(req.params.id);
        const { name, email, password, phone, role, fcm_token } = req.body;
        const moderatorId = req.params.id;

        // Check if moderator exists
        const existingModerator = await Moderator.get(moderatorId);
        if (!existingModerator) {
            return res.status(404).json({ message: "Moderator not found" });
        }

        // Prepare update object
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (phone) updateData.phone = phone;
        if (role) updateData.role = role;
        if (fcm_token) updateData.fcm_token = fcm_token;

        // Update moderator
        const updatedModerator = await Moderator.update(
            moderatorId,
            updateData
        );

        console.log(updatedModerator);

        // Remove password from response
        const moderatorResponse = { ...updatedModerator };
        delete moderatorResponse.password;

        res.status(200).json(moderatorResponse);
    } catch (error) {
        console.error("Error updating moderator:", error);
        res.status(500).json({
            message: "Error updating moderator",
            error: error.message,
        });
    }
});

// Delete moderator
router.delete("/:id", async (req, res) => {
    try {
        const moderatorId = req.params.id;

        // Check if moderator exists
        const existingModerator = await Moderator.get(moderatorId);
        if (!existingModerator) {
            return res.status(404).json({ message: "Moderator not found" });
        }

        // Delete moderator
        await Moderator.delete(moderatorId);

        res.status(200).json({ message: "Moderator deleted successfully" });
    } catch (error) {
        console.error("Error deleting moderator:", error);
        res.status(500).json({
            message: "Error deleting moderator",
            error: error.message,
        });
    }
});

// Fetch moderators by role
router.get("/role/:role", authMiddleware, async (req, res) => {
    console.log("Fetch Details called for Moderator", req.params.role);
    const role = req.params.role;
    try {
        const moderatorList = await Moderator.scan("role").eq(role).exec();
        console.log("Moderator List", moderatorList);
        res.status(200).json(moderatorList);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
});

export default router;
