import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
    {
        donationId: {type: String, required: true, unique: true},
        campaignId: {type: String, required: true},
        campaignTitle: {type: String, required: true},
        donor: {
            fullName: {type: String, required: true},
            email: {type: String, required: true},
            phone: {type: String, default: ""},
        },
        amount: {type: Number, required: true, min: 1},
        currency: {type: String, default: "usd"},
        paymentId: {type: String, required: true, unique: true},
        status: {type: String, default: "confirmed"},
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Donation", donationSchema);
