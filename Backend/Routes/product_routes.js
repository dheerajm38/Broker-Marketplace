import express from 'express';
import dynamoose from 'dynamoose';
import { ProductSchema } from '../Schema/Product_Schema.js';

const router = express.Router();
const Product = dynamoose.model('Product', ProductSchema);

// Create a new product
router.post('/products', async (req, res) => {
    try {
        const productData = req.body;
        const newProduct = await Product.create(productData);
        res.status(201).json({
            success: true,
            data: newProduct
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get all products with optional filters
router.get('/products', async (req, res) => {
    try {
        const {
            category_id,
            sub_category_id,
            seller_id,
            status,
            min_price,
            max_price
        } = req.query;

        let condition = {};
        
        if (category_id) condition.category_id = category_id;
        if (sub_category_id) condition.sub_category_id = sub_category_id;
        if (seller_id) condition.seller_id = seller_id;
        if (status) condition.status = status;

        let products = await Product.scan(condition).exec();

        // Apply price filters if provided
        if (min_price || max_price) {
            products = products.filter(product => {
                if (min_price && product.price < parseFloat(min_price)) return false;
                if (max_price && product.price > parseFloat(max_price)) return false;
                return true;
            });
        }

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get a single product by ID
router.get('/products/:product_id', async (req, res) => {
    try {
        const product = await Product.get(req.params.product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update a product
router.put('/products/:product_id', async (req, res) => {
    try {
        const updates = req.body;
        const product = await Product.update(req.params.product_id, updates);
        
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Delete a product
router.delete('/products/:product_id', async (req, res) => {
    try {
        await Product.delete(req.params.product_id);
        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Search products by name
router.get('/products/search/:name', async (req, res) => {
    try {
        const products = await Product.scan('name').contains(req.params.name).exec();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Get products by seller
router.get('/seller/:seller_id/products', async (req, res) => {
    try {
        const products = await Product.scan('seller_id').eq(req.params.seller_id).exec();
        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Update product status
router.patch('/products/:product_id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status value'
            });
        }

        const product = await Product.update(req.params.product_id, { status });
        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

export default router; 