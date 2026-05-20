import express from "express";
import Resource from "../models/resourcesModel.js";
import expressAsyncHandler from "express-async-handler";
import multer from "multer";
import path from "path";
import fs from "fs";
import slugify from "slugify";
import auth, {requireSuperAdmin} from "../middleware/auth.js";

import {fileURLToPath} from "url";
import {dirname} from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer setup for PDF
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({storage});

// GET /api/resources - List all resources
router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const resources = await Resource.find().sort({createdAt: -1}).skip(skip).limit(limit);

        const total = await Resource.countDocuments();

        res.json({resources, total, page, limit});
    }),
);

// POST /api/resources - Create new resource
router.post(
    "/",
    auth,
    requireSuperAdmin,
    upload.single("pdf"),
    expressAsyncHandler(async (req, res) => {
        const {title, link, body, seoTitle, metaDescription, keywords, slug} = req.body;

        if (!title) {
            return res.status(400).json({message: "Title and Link are required"});
        }

        const newResource = await Resource.create({
            title,
            link,
            pdfUrl: req.file ? `/uploads/${req.file.filename}` : null,
            body,
            seoTitle: seoTitle || title,
            metaDescription: metaDescription,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
            slug: slug || slugify(title, {lower: true, strict: true}),
        });

        res.status(201).json({message: "Resource created", resource: newResource});
    }),
);

// PUT /api/resources/:id - Update
router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    upload.single("pdf"),
    expressAsyncHandler(async (req, res) => {
        const {title, link, body, seoTitle, metaDescription, keywords, slug} = req.body;

        const updateData = {title, link, body, seoTitle, metaDescription, keywords, slug};

        if (req.file) updateData.pdfUrl = `/uploads/${req.file.filename}`;

        const updated = await Resource.findByIdAndUpdate(req.params.id, updateData, {new: true});

        if (!updated) return res.status(404).json({message: "Resource not found"});

        res.json({message: "Resource updated", resource: updated});
    }),
);

// DELETE /api/resources/:id
router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const deleted = await Resource.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({message: "Resource not found"});
        res.json({message: "Resource deleted"});
    }),
);

// GET /api/resources/:id - Single resource
router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({message: "Resource not found"});
        res.json(resource);
    }),
);

export default router;
