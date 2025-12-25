import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {type: String, required: true},
    excerpt: {type: String, required: true},
    imageUrl: {type: String, required: true}, // e.g., "https://example.com/img.jpg"
    category: {type: String, required: true}, // e.g., "Faith Formation"
    content: {type: String}, // Full post body (for single post view later)
    createdAt: {type: Date, default: Date.now},
});

export default mongoose.model("BlogPost", blogSchema);
