import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import S3 from "aws-sdk/clients/s3.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();


const s3Client = new S3({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: "d-marketplace-images",
        acl: "public-read",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.getMonth() + 1; // +1 because getMonth() returns 0-11

            // Get sellerId from query params or request body
            const sellerId = req.query.seller_id || req.body.seller_id;

            const uniqueSuffix =
                Date.now() + "-" + Math.round(Math.random() * 1e9);
            const fileName = `products/${currentYear}/${currentMonth}/${sellerId}/${uniqueSuffix}${path.extname(
                file.originalname
            )}`;
            cb(null, fileName);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
});