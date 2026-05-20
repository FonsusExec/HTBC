import mongoose from "mongoose";

const reservationItemSchema = new mongoose.Schema(
    {
        productId: {type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true},
        qty: {type: Number, required: true, min: 1},
    },
    {_id: false},
);

const inventoryReservationSchema = new mongoose.Schema(
    {
        reservationId: {type: String, required: true, unique: true},
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
        paymentId: {type: String, sparse: true},
        items: [reservationItemSchema],
        status: {
            type: String,
            enum: ["reserved", "completed", "released", "expired"],
            default: "reserved",
        },
        expiresAt: {type: Date, required: true},
        completedAt: Date,
        releasedAt: Date,
    },
    {timestamps: true},
);

export default mongoose.model("InventoryReservation", inventoryReservationSchema);
