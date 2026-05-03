import express from "express"; // Fixed import
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import expressAsyncHandler from "express-async-handler";
import {generateToken} from "../utils.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import {googleAuth} from "../controllers/authControllers.js";

const userRouter = express.Router(); // Use express.Router()

export const auth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({message: "No token provided"});
    }
    try {
        // Matches your generateToken: decodes { _id, isAdmin }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // req.user = { _id: "...", isAdmin: ... }
        next();
    } catch (err) {
        res.status(401).json({message: "Invalid token"});
    }
};

// Signup Route (POST /api/users/signup)
userRouter.post(
    "/signup",
    expressAsyncHandler(async (req, res) => {
        const {name, email, password} = req.body; // Assuming 'name' for fullName
        if (!name || !email || !password) {
            res.status(400).send({message: "Name, email, and password are required"});
            return;
        }

        const existingUser = await User.findOne({email});
        if (existingUser) {
            res.status(400).send({message: "User already exists"});
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const authUser = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin,
        };

        res.send({
            ...authUser,
            token: generateToken(user),
            user: authUser,
        });
    })
);

// Signin Route (POST /api/users/signin) - Fixed logic
userRouter.post(
    "/signin",
    expressAsyncHandler(async (req, res) => {
        const {email, password} = req.body;
        const user = await User.findOne({email}).populate("role", "name slug"); // Fixed: Query by email

        if (user && bcrypt.compareSync(password, user.password)) {
            // Fixed: Proper if condition
            const authUser = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
            };

            res.send({
                ...authUser,
                token: generateToken(user),
                user: authUser,
            });
            return;
        }

        res.status(401).send({message: "Invalid email or password"});
    })
);

// Optional: Get current user (for token verification, e.g., /api/users/me)
userRouter.get(
    "/me",
    auth, // ← Apply middleware here
    expressAsyncHandler(async (req, res) => {
        // No need to extract/verify token—middleware did it
        const user = await User.findById(req.user._id).populate("role", "name slug").select("-password"); // Uses decoded _id
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin,
        });
    })
);

// Google auth route (initiate login/signup)
userRouter.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}));

// Google callback
userRouter.get("/auth/google/callback", passport.authenticate("google", {session: false}), (req, res) => {
    // Generate token (your utils)
    const token = generateToken(req.user);
    res.json({token, user: {_id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role, isAdmin: req.user.isAdmin}});
});

userRouter.post("/google-auth", googleAuth);

// Optional: Logout route
userRouter.get("/auth/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
    });
    res.redirect("/"); // Or frontend login
});

export default userRouter;
