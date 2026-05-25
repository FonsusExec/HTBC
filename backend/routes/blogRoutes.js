import express from "express";
import BlogPost from "../models/blogModel.js";
import expressAsyncHandler from "express-async-handler";
import striptags from "striptags";
import he from "he";
import slugify from "slugify";
import auth, {isSuperAdminUser, optionalAuth, requireSuperAdmin} from "../middleware/auth.js";
import CommunityComment from "../models/communityCommentModel.js";
import imageUpload from "../middleware/imageUpload.js";
import {uploadImageToCloudinary} from "../utils/cloudinary.js";

const router = express.Router();

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

            if (search) {
                filters.push({$or: [{title: {$regex: search, $options: "i"}}, {excerpt: {$regex: search, $options: "i"}}]});
            }

            const query = filters.filter((filter) => Object.keys(filter).length > 0);
            const mongoQuery = query.length ? {$and: query} : {};
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

router.post(
    "/",
    auth,
    requireSuperAdmin,
    imageUpload.single("media"),
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
        const uploadedImage = req.file ? await uploadImageToCloudinary(req.file, "blog") : null;

        const newPost = new BlogPost({
            title,
            excerpt,
            category,
            content: body,
            imageUrl: uploadedImage?.url || null,
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

router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    imageUpload.single("media"),
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

        if (req.file) {
            const uploadedImage = await uploadImageToCloudinary(req.file, "blog");
            updateData.imageUrl = uploadedImage.url;
        }

        const updatedPost = await BlogPost.findOneAndUpdate({_id: req.params.id, ...getBlogTypeQuery("blog")}, updateData, {new: true, runValidators: true});

        if (!updatedPost) return res.status(404).json({message: "Post not found"});
        res.json({message: "Post updated", post: updatedPost});
    }),
);

router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findOneAndDelete({_id: req.params.id, ...getBlogTypeQuery("blog")});
        if (!post) return res.status(404).json({message: "Post not found"});
        await CommunityComment.deleteMany({contentType: "blog", contentId: req.params.id});
        res.json({message: "Post deleted successfully"});
    }),
);

router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const post = await BlogPost.findOne({_id: req.params.id, ...getBlogTypeQuery(req.query.type || "blog")});
        if (!post) return res.status(404).json({message: "Post not found"});
        res.json(post);
    }),
);

export default router;
