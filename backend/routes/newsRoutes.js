import express from "express";
import NewsArticle from "../models/NewsArticle.js";
import expressAsyncHandler from "express-async-handler";
import slugify from "slugify";
import Parser from "rss-parser"; // ← ADD THIS IMPORT (required!)
import {parse} from "node-html-parser";
import axios from "axios";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({storage});

const parser = new Parser();

const router = express.Router();

// GET /api/news/sources – list of sources
router.get("/sources", (req, res) => {
    res.json([
        {name: "Vatican News", value: "vatican"},
        {name: "Catholic News Agency", value: "cna"},
        {name: "EWTN News", value: "ewtn"},
    ]);
});

// GET /api/news/headlines/:source – headlines for a source
router.get(
    "/headlines/:source",
    expressAsyncHandler(async (req, res) => {
        const source = req.params.source;

        const sourcesMap = {
            vatican: "https://www.vaticannews.va/en.rss.xml",
            cna: "https://www.catholicnewsagency.com/rss",
            ewtn: "https://www.ewtnnews.com/rss",
        };

        const url = sourcesMap[source];
        if (!url) {
            return res.status(400).json({message: "Invalid source"});
        }

        try {
            const feed = await parser.parseURL(url);
            const headlines = feed.items.slice(0, 15).map((item) => ({
                title: item.title || "(No title)",
                url: item.link,
            }));
            res.json(headlines);
        } catch (err) {
            console.error(`Headlines fetch error for ${source}:`, err.message);
            res.status(500).json({message: "Failed to fetch headlines", error: err.message});
        }
    }),
);

// GET /api/news/article?url=... → Fetch full article content from URL
router.get(
    "/article",
    expressAsyncHandler(async (req, res) => {
        const {url} = req.query;
        if (!url) return res.status(400).json({message: "URL required"});

        try {
            const response = await axios.get(url, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; NewsAggregator/1.0)",
                },
                timeout: 20000,
            });

            const root = parse(response.data);

            // Try to find main content container
            let mainContent =
                root.querySelector("article") ||
                root.querySelector(".article-body") ||
                root.querySelector(".entry-content") ||
                root.querySelector(".post-content") ||
                root.querySelector("main") ||
                root.querySelector("body");

            // Remove unwanted elements (scripts, styles, ads, metadata)
            if (mainContent) {
                mainContent.querySelectorAll('script, style, noscript, iframe, [class*="ad"], [id*="ad"], meta, link, head').forEach((el) => el.remove());
            }

            let content = mainContent ? mainContent.structuredText : root.structuredText;

            // Clean extra junk
            content = content
                .replace(/\[.*?\]/g, "") // Remove [context] JSON junk
                .replace(/\(.*?\)/g, "") // Remove parentheses noise
                .replace(/\s+/g, " ") // Collapse spaces
                .replace(/AFP or licensors|©.*$/g, "") // Remove credit lines
                .trim();

            // Limit length
            content = content.substring(0, 8000);

            // Images (already extracted in your fetchNews, but here for completeness)
            const images = root
                .querySelectorAll("img")
                .map((img) => img.getAttribute("src"))
                .filter((src) => src && src.startsWith("http"))
                .slice(0, 3);

            res.json({
                content: content || "No readable content found",
                images,
            });
        } catch (err) {
            console.error("Article fetch error:", err.message);
            res.status(500).json({message: "Failed to fetch article content"});
        }
    }),
);

// GET /api/news – public list (active only)
router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        const articles = await NewsArticle.find({status: "active"}).sort({pubDate: -1}).skip(skip).limit(limit);

        const total = await NewsArticle.countDocuments({status: "active"});

        res.json({articles, total, page, limit});
    }),
);

// GET /api/news/:id – single article
router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const article = await NewsArticle.findById(req.params.id);
        if (!article) return res.status(404).json({message: "Article not found"});
        res.json(article);
    }),
);

// POST /api/news – admin creates news
router.post(
    "/",
    upload.single("media"), // ← Handles file upload (field name 'media')
    expressAsyncHandler(async (req, res) => {
        const {title, body, seoTitle, metaDescription, keywords, slug} = req.body;

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        const article = await NewsArticle.create({
            title,
            content: body,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : null, // ← Saves uploaded file path
            pubDate: new Date(),
            source: "Admin Curated",
            seoTitle: seoTitle || title,
            metaDescription: metaDescription || "",
            keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
            slug: slug || slugify(title, {lower: true, strict: true}),
            status: "active",
            url: "",
        });

        res.status(201).json({message: "News created", article});
    }),
);
// router.post(
//     "/",
//     expressAsyncHandler(async (req, res) => {
//         const {title, body, mediaUrl, seoTitle, metaDescription, keywords, slug} = req.body;

//         if (!title || !body) {
//             return res.status(400).json({message: "Title and body required"});
//         }

//         const article = await NewsArticle.create({
//             title,
//             content: body,
//             imageUrl: mediaUrl || null,
//             pubDate: new Date(),
//             source: "Admin Curated",
//             seoTitle: seoTitle || title,
//             metaDescription: metaDescription || "",
//             keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
//             slug: slug || slugify(title, {lower: true, strict: true}),
//             status: "active",
//         });

//         res.status(201).json({message: "News created", article});
//     }),
// );

// PATCH /api/news/:id – moderation
router.patch(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const {status} = req.body;
        const article = await NewsArticle.findByIdAndUpdate(req.params.id, {status}, {new: true});
        if (!article) return res.status(404).json({message: "Not found"});
        res.json(article);
    }),
);

export default router;
