import express from "express";
import expressAsyncHandler from "express-async-handler";
import ContactMessage from "../models/contactMessageModel.js";
import {sendContactMessageEmail} from "../utils/mailer.js";

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

router.post(
    "/",
    expressAsyncHandler(async (req, res) => {
        const body = req.body || {};
        const fullName = normalizeText(body.fullName);
        const email = normalizeText(body.email).toLowerCase();
        const message = normalizeText(body.message);
        const newsletter = Boolean(body.newsletter);

        if (!fullName || !email || !message) {
            return res.status(400).json({message: "Full name, email and message are required"});
        }

        if (!emailPattern.test(email)) {
            return res.status(400).json({message: "Please enter a valid email address"});
        }

        if (message.length < 10) {
            return res.status(400).json({message: "Message should be at least 10 characters"});
        }

        const contactMessage = await ContactMessage.create({
            fullName,
            email,
            message,
            newsletter,
        });

        const emailResult = await sendContactMessageEmail(contactMessage);

        if (!emailResult.success) {
            console.warn(`Contact message saved but email failed for ${contactMessage._id}: ${emailResult.error}`);
        }

        res.status(201).json({
            message: "Thanks for reaching out. Your message has been sent.",
            contactMessage: {
                id: contactMessage._id,
                fullName: contactMessage.fullName,
                email: contactMessage.email,
                newsletter: contactMessage.newsletter,
                createdAt: contactMessage.createdAt,
            },
        });
    }),
);

export default router;
