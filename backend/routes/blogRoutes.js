import express from "express";
import BlogPost from "../models/blogModel.js"; // Adjust path if needed
import multer from "multer";
import path from "path";
import fs from "fs";
import expressAsyncHandler from "express-async-handler";
import striptags from "striptags"; // For HTML stripping
import he from "he";
import slugify from "slugify";
import auth, {isSuperAdminUser, optionalAuth, requireSuperAdmin} from "../middleware/auth.js";

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

const getBlogTypeQuery = (type) => {
    if (type === "all") return {};
    if (type === "news") return {type: "news"};
    return {$or: [{type: "blog"}, {type: {$exists: false}}]};
};

const getKeywords = (keywords = "") => {
    if (Array.isArray(keywords)) return keywords.map((keyword) => String(keyword).trim()).filter(Boolean);
    return String(keywords)
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
};

const getStatusQuery = (status = "") => {
    if (status === "all") return {};
    if (["active", "draft", "archived"].includes(status)) return {status};
    return {$or: [{status: "active"}, {status: {$exists: false}}]};
};

const getValidStatus = (status, fallback = "active") => (["active", "draft", "archived"].includes(status) ? status : fallback);

// GET /api/blogs: List with pagination/search/status/type filter
router.get(
    "/",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, parseInt(req.query.limit) || 10);
            const search = req.query.search || "";
            const type = req.query.type || "";
            const requestedStatus = req.query.status || "";
            const status = isSuperAdminUser(req.user) ? requestedStatus : "";

            const filters = [getBlogTypeQuery(type), getStatusQuery(status)];

            // Search filter
            if (search) {
                filters.push({$or: [{title: {$regex: search, $options: "i"}}, {excerpt: {$regex: search, $options: "i"}}]});
            }

            const query = filters.filter((filter) => Object.keys(filter).length > 0);
            const mongoQuery = query.length ? {$and: query} : {};

            console.log("GET /api/blogs called with:", {page, limit, type, status, search});

            const skip = (page - 1) * limit;

            const posts = await BlogPost.find(mongoQuery).sort({createdAt: -1}).skip(skip).limit(limit).select("-content");

            const total = await BlogPost.countDocuments(mongoQuery);

            res.json({posts, total, page, limit});
        } catch (error) {
            console.error("GET /api/blogs ERROR:", error);
            res.status(500).json({error: "Failed to fetch posts"});
        }
    }),
);

// POST /api/blogs: Create blog posts only
router.post(
    "/",
    auth,
    requireSuperAdmin,
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, category, seoTitle, metaDescription, keywords, slug, type, status} = req.body;

        if (type && type !== "blog") {
            return res.status(400).json({message: "Use /api/news for news articles"});
        }

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        if (!category) {
            return res.status(400).json({message: "Category required for blog posts"});
        }

        const plainBody = he.decode(striptags(body));
        const excerpt = plainBody.length > 150 ? plainBody.substring(0, 150) + "..." : plainBody;

        const newPost = new BlogPost({
            title,
            excerpt,
            category,
            content: body,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
            seoTitle: seoTitle || title,
            metaDescription: metaDescription || excerpt,
            keywords: keywords ? getKeywords(keywords) : [],
            slug: slug || slugify(title, {lower: true}),
            type: "blog",
            status: getValidStatus(status),
        });

        const savedPost = await newPost.save();
        res.status(201).json({message: "Post created", post: savedPost});
    }),
);

// PUT /api/blogs/:id: Update
router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, category, seoTitle, metaDescription, keywords, slug, type, status} = req.body;

        if (type && type !== "blog") {
            return res.status(400).json({message: "Use /api/news for news articles"});
        }

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        const updateData = {
            title,
            content: body,
            seoTitle,
            metaDescription,
            keywords: keywords ? getKeywords(keywords) : [],
            slug,
            type: "blog",
            category,
            status: getValidStatus(status),
        };

        const plainBody = he.decode(striptags(body));
        updateData.excerpt = plainBody.length > 150 ? plainBody.substring(0, 150) + "..." : plainBody;

        if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

        const updatedPost = await BlogPost.findOneAndUpdate({_id: req.params.id, ...getBlogTypeQuery("blog")}, updateData, {new: true, runValidators: true});

        if (!updatedPost) return res.status(404).json({message: "Post not found"});
        res.json({message: "Post updated", post: updatedPost});
    }),
);

// DELETE /api/blogs/:id
router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findOneAndDelete({_id: req.params.id, ...getBlogTypeQuery("blog")});
        if (!post) return res.status(404).json({message: "Post not found"});
        res.json({message: "Post deleted successfully"});
    }),
);

// GET /api/blogs/:id: Single post
router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findOne({_id: req.params.id, ...getBlogTypeQuery(req.query.type || "blog")});
        if (!post) return res.status(404).json({message: "Post not found"});
        res.json(post);
    }),
);

export default router;
