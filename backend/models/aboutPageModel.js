import mongoose from "mongoose";

const aboutPageSchema = new mongoose.Schema(
    {
        heroTitle: {type: String, default: "About Us", trim: true},
        heroImageUrl: {type: String, default: ""},
        missionTitle: {type: String, default: "Our Mission", trim: true},
        missionText: {type: String, required: true, trim: true},
        teamTitle: {type: String, default: "Our Team", trim: true},
        testimonialTitle: {type: String, default: "Testimonials", trim: true},
    },
    {timestamps: true},
);

export default mongoose.model("AboutPage", aboutPageSchema);
