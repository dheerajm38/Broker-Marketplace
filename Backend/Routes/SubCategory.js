import express from 'express';
import { v4 as uuidv4 } from "uuid";
import { CategorySubCategoryMapping, SubCategory, Category } from '../Model/Models.js';

const router = express.Router();

// Get SubCategories for a specific Category
router.get('/:category_id', async (req, res) => {
    try {
        const { category_id } = req.params;

        // First check if category exists
        const categoryExists = await Category.get({ category_id });
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Get all mappings for this category
        const mappings = await CategorySubCategoryMapping.scan('category_id')
            .eq(category_id)
            .exec();

        if (!mappings || mappings.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No subcategories found for this category",
                data: []
            });
        }

        // Get subcategory IDs from mappings
        const subCategoryIds = mappings.map(mapping => mapping.sub_category_id);

        // Fetch all subcategories that match these IDs
        const subcategories = await Promise.all(
            subCategoryIds.map(async (id) => {
                const sub = await SubCategory.get({ sub_category_id: id });
                return sub;
            })
        );

        // Filter out any null values and format response
        const formattedSubcategories = subcategories
            .filter(Boolean)
            .map(sub => ({
                sub_category_id: sub.sub_category_id,
                name: sub.name,
                description: sub.description,
                category_id: sub.category_id
            }));

        return res.status(200).json({
            success: true,
            message: "Subcategories retrieved successfully",
            data: formattedSubcategories
        });

    } catch (error) {
        console.error("Error fetching subcategories:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Create SubCategory
router.post("/create", async (req, res) => {
    try {
        const { category_id, name, description } = req.body;
        console.log(req.body);
        console.log("uuidv4 ", uuidv4());  // Logging the UUID here
        console.log("name", name)

        // Validate input
        if (!category_id || !name) {
            return res.status(400).json({
                success: false,
                message: "Category ID and name are required"
            });
        }

        // Check if category exists
        const existingCategory = await Category.get({ category_id });
        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        // Create subcategory
        const newSubCategory = await SubCategory.create({
            sub_category_id: uuidv4(),
            name,
            description,
            category_id
        });
        console.log("newSubCategory ", newSubCategory);
        // Create mapping
        await CategorySubCategoryMapping.create({
            category_id,
            sub_category_id: newSubCategory.sub_category_id
        });

        res.status(201).json({
            success: true,
            message: "Subcategory created successfully",
            data: newSubCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Update SubCategory
router.put("/update/:sub_category_id", async (req, res) => {
    try {
        const { sub_category_id } = req.params;
        const { name, description } = req.body;

        // Validate input
        if (!name && !description) {
            return res.status(400).json({
                success: false,
                message: "At least one field to update is required"
            });
        }

        // Check if subcategory exists
        const subCategory = await SubCategory.get({ sub_category_id });
        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }

        // Perform update
        const updatedSubCategory = await SubCategory.update(
            { sub_category_id },
            { name, description }
        );

        res.status(200).json({
            success: true,
            message: "Subcategory updated successfully",
            data: updatedSubCategory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

// Delete SubCategory
router.delete("/delete/:sub_category_id", async (req, res) => {
    try {
        const { sub_category_id } = req.params;

        // Check if subcategory exists
        const subCategory = await SubCategory.get({ sub_category_id });
        if (!subCategory) {
            return res.status(404).json({
                success: false,
                message: "Subcategory not found"
            });
        }

        // Delete subcategory
        await SubCategory.delete({ sub_category_id });

        // Delete associated mapping
        const mappings = await CategorySubCategoryMapping
            .query('sub_category_id')
            .eq(sub_category_id)
            .exec();

        for (let mapping of mappings) {
            await mapping.delete();
        }

        res.status(200).json({
            success: true,
            message: "Subcategory deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

router.get("/fetchAll", async (req, res) => {
    try {
        const subCategories = await SubCategory.scan().exec();
        if (!subCategories) {
            return res.status(404).json({ success: false, message: "No subCategories found" });
        }

        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully",
            data: subCategories
        });

    } catch (error) {
    }
});

export default router;