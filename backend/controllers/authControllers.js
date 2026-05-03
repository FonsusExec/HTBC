import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import {OAuth2Client} from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req, res) => {
    try {
        const {credential} = req.body;

        if (!credential) {
            return res.status(400).json({success: false, message: "No Google credential received"});
        }

        // 1️⃣ Verify token from Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const name = payload.name;
        const email = payload.email;
        const googleId = payload.sub; // Google unique user ID

        // 2️⃣ Check if user exists
        let user = await User.findOne({email});

        if (!user) {
            // 3️⃣ Create new user
            user = await User.create({
                name,
                email,
                googleId,
            });
        } else if (!user.googleId) {
            // 4️⃣ Attach Google ID to existing account
            user.googleId = googleId;
            await user.save();
        }

        // 5️⃣ Create JWT token
        const token = user.generateToken();
        const authUser = await User.findById(user._id).populate("role", "name slug").select("-password");

        res.status(200).json({
            success: true,
            message: "Google login successful",
            token,
            user: authUser,
        });
    } catch (error) {
        console.error("GOOGLE AUTH ERROR:", error);
        res.status(500).json({success: false, message: "Google authentication failed"});
    }
};
