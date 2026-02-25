import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {type: String, required: true},
    excerpt: {type: String, required: true}, // Auto-generated from body
    imageUrl: {type: String}, // Optional, from upload
    category: {type: String},
    content: {type: String, required: true}, // Full body
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    seoTitle: {type: String},
    metaDescription: {type: String},
    keywords: [{type: String}],
    slug: {type: String, unique: true},

    type: {
        type: String,
        enum: ["blog", "news"],
        default: "blog",
        required: true,
    },
});

blogSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("BlogPost", blogSchema);
