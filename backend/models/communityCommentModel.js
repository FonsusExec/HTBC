import mongoose from "mongoose";

const communityCommentSchema = new mongoose.Schema(
    {
        contentType: {
            type: String,
            enum: ["blog", "news"],
            required: true,
            index: true,
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CommunityComment",
            default: null,
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
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
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

communityCommentSchema.index({contentType: 1, contentId: 1, status: 1, createdAt: -1});

export default mongoose.model("CommunityComment", communityCommentSchema);
