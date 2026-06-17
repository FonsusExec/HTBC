import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        role: {type: String, default: "", trim: true},
        quote: {type: String, required: true, trim: true},
        imageUrl: {type: String, default: ""},
        order: {type: Number, default: 0},
        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active",
        },
    },
    {timestamps: true},
);

export default mongoose.model("Testimonial", testimonialSchema);
