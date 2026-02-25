import express from "express";
import BlogPost from "../models/blogModel.js"; // Adjust path if needed
import multer from "multer";
import path from "path";
import fs from "fs";
import expressAsyncHandler from "express-async-handler";
import striptags from "striptags"; // For HTML stripping
import he from "he";
import slugify from "slugify";

// ← ADD THIS POLYFILL: For ES modules (fixes __dirname error)
import {fileURLToPath} from "url";
import {dirname} from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Multer setup (self-contained here)
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
    console.log("📁 Created uploads directory");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({storage});

// GET /api/blogs: List with pagination/search/status/type filter
router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, parseInt(req.query.limit) || 10);
            const search = req.query.search || "";
            const type = req.query.type || "";

            let query = {};

            // Type filter
            if (type && ["blog", "news"].includes(type)) {
                query.type = type;
            }

            // Search filter
            if (search) {
                query.$or = [{title: {$regex: search, $options: "i"}}, {excerpt: {$regex: search, $options: "i"}}];
            }

            console.log("GET /api/blogs called with:", {page, limit, type, search});

            const skip = (page - 1) * limit;

            const posts = await BlogPost.find(query).sort({createdAt: -1}).skip(skip).limit(limit).select("-content");

            const total = await BlogPost.countDocuments(query);

            res.json({posts, total, page, limit});
        } catch (error) {
            console.error("GET /api/blogs ERROR:", error);
            res.status(500).json({error: "Failed to fetch posts"});
        }
    }),
);

// POST /api/blogs: Create (supports type=blog or type=news)
router.post(
    "/",
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, category, seoTitle, metaDescription, keywords, slug, type} = req.body;

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        // Require category only for blog posts
        if (type !== "news" && !category) {
            return res.status(400).json({message: "Category required for blog posts"});
        }

        const plainBody = he.decode(striptags(body));
        const excerpt = plainBody.length > 150 ? plainBody.substring(0, 150) + "..." : plainBody;

        const newPost = new BlogPost({
            title,
            excerpt,
            category: category || undefined, // Allow null/undefined for news
            content: body,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            seoTitle: seoTitle || title,
            metaDescription: metaDescription || excerpt,
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
            slug: slug || slugify(title, {lower: true}),
            type: type || "blog",
        });

        const savedPost = await newPost.save();
        res.status(201).json({message: "Post created", post: savedPost});
    }),
);

// PUT /api/blogs/:id: Update
router.put(
    "/:id",
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, category, seoTitle, metaDescription, keywords, slug, type} = req.body;

        const updateData = {
            title,
            content: body,
            seoTitle,
            metaDescription,
            keywords,
            slug,
            type,
        };

        // Require category only for blog posts
        if (type !== "news") {
            updateData.category = category;
        } else {
            updateData.category = undefined; // Clear for news
        }

        const plainBody = he.decode(striptags(body));
        updateData.excerpt = plainBody.length > 150 ? plainBody.substring(0, 150) + "..." : plainBody;

        if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

        const updatedPost = await BlogPost.findByIdAndUpdate(req.params.id, updateData, {new: true, runValidators: true});

        if (!updatedPost) return res.status(404).json({message: "Post not found"});
        res.json({message: "Post updated", post: updatedPost});
    }),
);

// DELETE /api/blogs/:id
router.delete(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({message: "Post not found"});
        res.json({message: "Post deleted successfully"});
    }),
);

// GET /api/blogs/:id: Single post
router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findById(req.params.id);
        if (!post) return res.status(404).json({message: "Post not found"});
        res.json(post);
    }),
);

export default router;
