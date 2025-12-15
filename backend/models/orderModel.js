import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        orderId: {type: String, required: true, unique: true},
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, // ← ADD THIS LINE (references User model)
        shipping: {
            // Loose object—accepts any strings
            firstName: {type: String, default: ""},
            lastName: {type: String, default: ""},
            email: {type: String, default: ""},
            shippingAddress: {type: String, default: ""},
            houseNumber: {type: String, default: ""},
            state: {type: String, default: ""},
            zip: {type: String, default: ""},
        },
        items: [
            {
                // Flexible array items
                name: {type: String, default: ""},
                qty: {type: Number, default: 0},
                price: {type: Number, default: 0},
                // Allow extras (e.g., image, _id) without failing
            },
        ],
        subtotal: {type: Number, default: 0},
        total: {type: Number, required: true},
        paymentId: {type: String, default: ""},
        status: {type: String, default: "confirmed"},
        createdAt: {type: Date, default: Date.now},
    },
    {
        strict: false, // Key: Ignores unknown fields from cart
        toJSON: {virtuals: true}, // Optional: For cleaner output
        toObject: {virtuals: true},
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
