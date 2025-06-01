import express from 'express';
import { CategorySubCategoryMapping } from '../Model/Models.js';
import { SubCategory } from '../Model/Models.js';
import { Category } from '../Model/Models.js';
import { apiResponse } from '../Functionality/ApiResponse.js';

const router = express.Router();

// Create Category
router.post('/create', async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Category name is required" });
        }

        const existingCategory = await Category.scan('name').eq(name).exec();
        if(existingCategory.length > 0) {
            return res.status(400).json({ success: false, message: "Category name already exists"});
        }

        const newCategory = await Category.create({ name, description });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: newCategory
        });
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

// Get All Category
router.get('/fetchAll', async (req, res) => {
    try {
        const categories = await Category.scan().exec();

        if (!categories || categories.length === 0) {
            return res.status(404).json({ success: false, message: "No categories found" });
        }
        console.log("categories", categories);

        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);

        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

// Update Category 
router.put('/update/:category_id', async (req, res) => {
    try {
        const { category_id } = req.params;
        const { name, description } = req.body;

        // 🔹 Check if category exists
        const existingCategory = await Category.get({ category_id });

        if (!existingCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // 🔹 Update the category
        const updatedCategory = await Category.update(
            { category_id },  // 🔹 Search key
            { name, description } // 🔹 Updated values
        );

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

// Delete Category
router.delete('/delete/:category_id', async (req, res) => {
    try {
        const { category_id } = req.params;

        // 🔹 Check if category exists
        const existingCategory = await Category.get({ category_id });

        if (!existingCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        // 🔹 Delete the category
        await Category.delete({ category_id });

        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
});

// Get All Categories with Subcategories
router.get("/categories-with-subcategories", async (req, res) => {
    try {
        // Step 1: Fetch all categories
        const categories = await Category.scan().exec();

        // Step 2: Fetch all subcategories
        const subCategories = await SubCategory.scan().exec();

        // Step 3: Fetch all mappings
        const mappings = await CategorySubCategoryMapping.scan().exec();

        // Step 4: Create a mapping dictionary for quick lookup
        const categorySubMap = {};
        mappings.forEach(mapping => {
            if (!categorySubMap[mapping.category_id]) {
                categorySubMap[mapping.category_id] = [];
            }
            categorySubMap[mapping.category_id].push(mapping.sub_category_id);
        });

        // Step 5: Structure the response
        const response = categories.map(category => {
            return {
                category_id: category.category_id,
                name: category.name,
                description: category.description,
                subcategories: subCategories
                    .filter(sub => categorySubMap[category.category_id]?.includes(sub.sub_category_id))
                    .map(sub => ({
                        sub_category_id: sub.sub_category_id,
                        name: sub.name,
                        description: sub.description
                    }))
            };
        });

        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error("Error fetching categories with subcategories:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

export default router;