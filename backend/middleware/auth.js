import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const normalizeRole = (role) => {
    if (!role) return "";
    const roleValue = typeof role === "string" ? role : role.name || role.slug || "";
    return roleValue.toLowerCase().replace(/[-_]+/g, " ").trim();
};

export const isSuperAdminUser = (user) => normalizeRole(user?.role) === "super admin";

const loadUserFromToken = async (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return User.findById(decoded._id).populate("role", "name slug").select("-password");
};

const auth = async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return res.status(401).json({error: "No token provided"});
    }

    try {
        req.user = await loadUserFromToken(token);

        if (!req.user) {
            return res.status(401).json({error: "User not found"});
        }

        next();
    } catch (err) {
        return res.status(401).json({error: "Invalid or expired token"});
    }
};

export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
        return next();
    }

    try {
        req.user = await loadUserFromToken(token);
    } catch (err) {
        req.user = null;
    }

    next();
};

export const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({error: "Authentication required"});
    }

    if (!isSuperAdminUser(req.user)) {
        return res.status(403).json({error: "Super admin access required"});
    }

    next();
};

export default auth;
