import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
    title: {type: String, required: true},
    link: {type: String}, // External URL
    pdfUrl: {type: String}, // Uploaded PDF path
    body: {type: String}, // Description / notes
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
    seoTitle: {type: String},
    metaDescription: {type: String},
    keywords: [{type: String}],
    slug: {type: String, unique: true},
    type: {type: String, default: "resource"}, // Fixed type
});

resourceSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("Resource", resourceSchema);
