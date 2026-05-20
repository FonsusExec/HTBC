import mongoose from "mongoose";

const newsArticleSchema = new mongoose.Schema({
    source: {type: String, required: true}, // "Vatican News", "CNA", etc.
    title: {type: String, required: true},
    description: String,
    content: String, // Full text or summary
    url: {
        type: String,
        sparse: true, // Allows multiple documents with url: null
    }, // Original article link
    imageUrl: String, // Pulled from RSS
    pubDate: {type: Date, required: true},
    guid: String,
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    categories: [String],
    fetchedAt: {type: Date, default: Date.now},
    seoTitle: String,
    metaDescription: String,
    keywords: [String],
    slug: {type: String, unique: true, sparse: true},
    status: {
        type: String,
        enum: ["active", "draft", "archived"],
        default: "active",
    },
});

export default mongoose.model("NewsArticle", newsArticleSchema);
