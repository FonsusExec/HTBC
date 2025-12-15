import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const auth = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({error: "No token provided"});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ← FIXED: Use _id (matches generateToken payload)
        req.user = await User.findById(decoded._id).select("-password"); // Was: decoded.id

        if (!req.user) {
            console.log("Auth: User not found for ID:", decoded._id); // ← ADD: Debug log
            return res.status(401).json({error: "User not found"});
        }

        console.log("Auth: User loaded for ID:", req.user._id); // ← ADD: Success log
        next();
    } catch (err) {
        console.error("Auth error:", err.message); // ← ADD: Log for invalid/expired
        return res.status(401).json({error: "Invalid or expired token"});
    }
};

export default auth;
