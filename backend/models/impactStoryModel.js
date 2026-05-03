import mongoose from "mongoose";

const impactStorySchema = new mongoose.Schema({
    title: {type: String, required: true, trim: true},
    description: {type: String, required: true, trim: true},
    imageUrl: {type: String, required: true},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});

impactStorySchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("ImpactStory", impactStorySchema);
