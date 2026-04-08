import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {type: String, required: true},
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    subCategory: {
        type: String, // We store the slug of the subcategory
        required: false,
    },
    description: {type: String, required: true},
    price: {type: Number, required: true, min: 0},
    stock: {type: Number, required: true, min: 0, default: 0},
    sku: {type: String, unique: true, sparse: true},
    mainImage: {type: String}, // path to main image
    images: [{type: String}], // additional images
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});

productSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model("Product", productSchema);
