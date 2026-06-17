import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        role: {type: String, default: "", trim: true},
        bio: {type: String, default: "", trim: true},
        imageUrl: {type: String, required: true},
        order: {type: Number, default: 0},
        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active",
        },
    },
    {timestamps: true},
);

export default mongoose.model("TeamMember", teamMemberSchema);
