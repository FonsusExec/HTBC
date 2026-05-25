import mongoose from "mongoose";

const eventRsvpSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 120,
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 40,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        status: {
            type: String,
            enum: ["going", "cancelled"],
            default: "going",
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {_id: true},
);

const communityEventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 160,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        eventType: {
            type: String,
            default: "Community",
            trim: true,
            maxlength: 80,
        },
        startDate: {
            type: Date,
            required: true,
            index: true,
        },
        endDate: {
            type: Date,
        },
        location: {
            type: String,
            default: "",
            trim: true,
            maxlength: 180,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        onlineUrl: {
            type: String,
            default: "",
            trim: true,
        },
        capacity: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["active", "draft", "archived"],
            default: "active",
            index: true,
        },
        rsvps: [eventRsvpSchema],
    },
    {timestamps: true},
);

communityEventSchema.virtual("rsvpCount").get(function () {
    return this.rsvps.filter((rsvp) => rsvp.status === "going").length;
});

communityEventSchema.set("toJSON", {virtuals: true});
communityEventSchema.set("toObject", {virtuals: true});

export default mongoose.model("CommunityEvent", communityEventSchema);
