import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        name: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {
            type: String,
            required: function () {
                return !this.googleId; // require password ONLY if not using Google login
            },
        },
        googleId: {
            type: String,
            required: false,
        },
        isAdmin: {type: Boolean, default: false, required: true},
    },
    {
        timestamps: true,
    }
);

userSchema.methods.generateToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
        },
        process.env.JWT_SECRET,
        {expiresIn: "30d"}
    );
};

const User = mongoose.model("User", userSchema);

export default User;
