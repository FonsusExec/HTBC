import express from "express";
import NewsArticle from "../models/NewsArticle.js";
import NewsComment from "../models/newsCommentModel.js";
import expressAsyncHandler from "express-async-handler";
import slugify from "slugify";
import Parser from "rss-parser";
import {parse} from "node-html-parser";
import axios from "axios";
import multer from "multer";
import striptags from "striptags";
import he from "he";
import auth, {isSuperAdminUser, optionalAuth, requireSuperAdmin} from "../middleware/auth.js";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({storage});

const parser = new Parser();
const router = express.Router();

const getPlainText = (html = "") => he.decode(striptags(html)).replace(/\s+/g, " ").trim();

const getNewsImage = (item) => {
    if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) return item.enclosure.url;
    if (item["media:content"]?.["$"]?.url) return item["media:content"]["$"].url;
    if (item["media:thumbnail"]?.["$"]?.url) return item["media:thumbnail"]["$"].url;
    const imgMatch = item.content?.match(/<img[^>]+src=["'](.*?)["']/i);
    return imgMatch ? imgMatch[1] : "";
};

const getKeywords = (keywords = "") => {
    if (Array.isArray(keywords)) return keywords.map((keyword) => String(keyword).trim()).filter(Boolean);
    return String(keywords)
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);
};

const getValidStatus = (status, fallback = "active") => (["active", "draft", "archived"].includes(status) ? status : fallback);

router.get("/sources", auth, requireSuperAdmin, (req, res) => {
    res.json([
        {name: "Vatican News", value: "vatican"},
        {name: "Catholic News Agency", value: "cna"},
        {name: "EWTN News", value: "ewtn"},
    ]);
});

router.get(
    "/headlines/:source",
    auth,
    requireSuperAdmin,
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
                description: item.contentSnippet || getPlainText(item.content || ""),
                pubDate: item.pubDate || item.isoDate || "",
                imageUrl: getNewsImage(item),
            }));
            res.json(headlines);
        } catch (err) {
            console.error(`Headlines fetch error for ${source}:`, err.message);
            res.status(500).json({message: "Failed to fetch headlines", error: err.message});
        }
    }),
);

router.get(
    "/article",
    auth,
    requireSuperAdmin,
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

            let mainContent =
                root.querySelector("article") ||
                root.querySelector(".article-body") ||
                root.querySelector(".entry-content") ||
                root.querySelector(".post-content") ||
                root.querySelector("main") ||
                root.querySelector("body");

            if (mainContent) {
                mainContent.querySelectorAll('script, style, noscript, iframe, [class*="ad"], [id*="ad"], meta, link, head').forEach((el) => el.remove());
            }

            let content = mainContent ? mainContent.structuredText : root.structuredText;

            content = content
                .replace(/\[.*?\]/g, "")
                .replace(/\(.*?\)/g, "")
                .replace(/\s+/g, " ")
                .replace(/AFP or licensors|\u00a9.*$/g, "")
                .trim()
                .substring(0, 8000);

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

router.get(
    "/",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search || "";
        const requestedStatus = req.query.status || "";
        const status = isSuperAdminUser(req.user) ? requestedStatus : "";
        const sort = req.query.sort === "oldest" ? {pubDate: 1, createdAt: 1} : {pubDate: -1, createdAt: -1};
        const skip = (page - 1) * limit;
        const filters = [];

        if (status && status !== "all") {
            filters.push({status});
        } else if (!status) {
            filters.push({$or: [{status: "active"}, {status: {$exists: false}}]});
        }

        if (search) {
            filters.push({$or: [{title: {$regex: search, $options: "i"}}, {description: {$regex: search, $options: "i"}}, {content: {$regex: search, $options: "i"}}]});
        }

        const query = filters.length ? {$and: filters} : {};
        const articles = await NewsArticle.find(query).sort(sort).skip(skip).limit(limit);
        const total = await NewsArticle.countDocuments(query);

        res.json({articles, total, page, limit});
    }),
);

router.post(
    "/",
    auth,
    requireSuperAdmin,
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, source, url, imageUrl, seoTitle, metaDescription, keywords, slug, status} = req.body;

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        const plainBody = getPlainText(body);
        const description = plainBody.length > 180 ? plainBody.substring(0, 180) + "..." : plainBody;

        const article = await NewsArticle.create({
            title,
            description,
            content: body,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : imageUrl || null,
            pubDate: new Date(),
            source: source || "Admin Curated",
            seoTitle: seoTitle || title,
            metaDescription: metaDescription || description,
            keywords: keywords ? getKeywords(keywords) : [],
            slug: slug || slugify(title, {lower: true, strict: true}),
            status: getValidStatus(status),
            url: url || undefined,
        });

        res.status(201).json({message: "News created", article});
    }),
);

router.get(
    "/:id/comments",
    expressAsyncHandler(async (req, res) => {
        const article = await NewsArticle.findById(req.params.id).select("_id");
        if (!article) return res.status(404).json({message: "Article not found"});

        const comments = await NewsComment.find({article: req.params.id}).sort({createdAt: -1});
        res.json({comments});
    }),
);

router.post(
    "/:id/comments",
    expressAsyncHandler(async (req, res) => {
        const {name, email, body, comment} = req.body;
        const commentBody = String(body || comment || "").trim();
        const commenterName = String(name || "").trim();
        const commenterEmail = String(email || "").trim();

        if (!commenterName || !commentBody) {
            return res.status(400).json({message: "Name and comment are required"});
        }

        const article = await NewsArticle.findById(req.params.id).select("_id");
        if (!article) return res.status(404).json({message: "Article not found"});

        const createdComment = await NewsComment.create({
            article: req.params.id,
            name: commenterName,
            email: commenterEmail,
            body: commentBody,
        });

        res.status(201).json({message: "Comment posted", comment: createdComment});
    }),
);

router.patch(
    "/:id/comments/:commentId/reaction",
    expressAsyncHandler(async (req, res) => {
        const {reaction} = req.body;

        if (!["like", "dislike"].includes(reaction)) {
            return res.status(400).json({message: "Reaction must be like or dislike"});
        }

        const field = reaction === "like" ? "likes" : "dislikes";
        const comment = await NewsComment.findOneAndUpdate(
            {
                _id: req.params.commentId,
                article: req.params.id,
            },
            {$inc: {[field]: 1}},
            {new: true},
        );

        if (!comment) return res.status(404).json({message: "Comment not found"});
        res.json({message: "Reaction saved", comment});
    }),
);

router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const article = await NewsArticle.findById(req.params.id);
        if (!article) return res.status(404).json({message: "Article not found"});
        res.json(article);
    }),
);

router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    upload.single("media"),
    expressAsyncHandler(async (req, res) => {
        const {title, body, source, url, imageUrl, seoTitle, metaDescription, keywords, slug, status} = req.body;

        if (!title || !body) {
            return res.status(400).json({message: "Title and body required"});
        }

        const article = await NewsArticle.findById(req.params.id);
        if (!article) return res.status(404).json({message: "Article not found"});

        const plainBody = getPlainText(body);
        const description = plainBody.length > 180 ? plainBody.substring(0, 180) + "..." : plainBody;

        article.title = title;
        article.description = description;
        article.content = body;
        article.source = source || article.source || "Admin Curated";
        article.url = url || article.url || undefined;
        article.seoTitle = seoTitle || title;
        article.metaDescription = metaDescription || description;
        article.keywords = keywords ? getKeywords(keywords) : [];
        article.slug = slug || slugify(title, {lower: true, strict: true});
        article.status = getValidStatus(status, article.status || "active");
        article.updatedAt = new Date();

        if (req.file) {
            article.imageUrl = `/uploads/${req.file.filename}`;
        } else if (imageUrl) {
            article.imageUrl = imageUrl;
        }

        const updatedArticle = await article.save();
        res.json({message: "News updated", article: updatedArticle});
    }),
);

router.patch(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {status} = req.body;
        const article = await NewsArticle.findByIdAndUpdate(req.params.id, {status, updatedAt: new Date()}, {new: true});
        if (!article) return res.status(404).json({message: "Not found"});
        res.json(article);
    }),
);

router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const article = await NewsArticle.findByIdAndDelete(req.params.id);
        if (!article) return res.status(404).json({message: "Article not found"});
        await NewsComment.deleteMany({article: req.params.id});
        res.json({message: "News deleted successfully"});
    }),
);

export default router;
