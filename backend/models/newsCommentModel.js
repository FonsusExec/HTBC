import mongoose from "mongoose";

const newsCommentSchema = new mongoose.Schema(
    {
        article: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NewsArticle",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 120,
        },
        body: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1200,
        },
        likes: {
            type: Number,
            default: 0,
            min: 0,
        },
        dislikes: {
            type: Number,
            default: 0,
            min: 0,
        },
    },
    {timestamps: true},
);

export default mongoose.model("NewsComment", newsCommentSchema);
