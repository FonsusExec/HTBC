import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: false, // Optional for now
        },
        googleId: {
            type: String,
            required: false,
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: false, // Changed to false for easier creation
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    },
);

// Generate JWT Token as a method
userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role,
            isAdmin: this.isAdmin,
        },
        process.env.JWT_SECRET,
        {expiresIn: "30d"},
    );
};

const User = mongoose.model("User", userSchema);

export default User;
