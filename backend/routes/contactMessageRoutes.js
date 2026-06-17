import express from "express";
import expressAsyncHandler from "express-async-handler";
import ContactMessage from "../models/contactMessageModel.js";
import {sendContactMessageEmail} from "../utils/mailer.js";
import auth, {requireSuperAdmin} from "../middleware/auth.js";

const router = express.Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const getValidStatus = (status) => (["new", "read", "archived"].includes(status) ? status : "");

router.get(
    "/",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const search = normalizeText(req.query.search);
        const status = getValidStatus(req.query.status);
        const newsletter = req.query.newsletter;
        const skip = (page - 1) * limit;
        const query = {};

        if (status) query.status = status;
        if (newsletter === "true" || newsletter === "false") query.newsletter = newsletter === "true";

        if (search) {
            query.$or = [
                {fullName: {$regex: search, $options: "i"}},
                {email: {$regex: search, $options: "i"}},
                {message: {$regex: search, $options: "i"}},
            ];
        }

        const [messages, total, unreadCount] = await Promise.all([
            ContactMessage.find(query).sort({createdAt: -1}).skip(skip).limit(limit),
            ContactMessage.countDocuments(query),
            ContactMessage.countDocuments({status: "new"}),
        ]);

        res.json({messages, total, unreadCount, page, limit});
    }),
);

router.get(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const contactMessage = await ContactMessage.findById(req.params.id);

        if (!contactMessage) {
            return res.status(404).json({message: "Contact message not found"});
        }

        if (contactMessage.status === "new") {
            contactMessage.status = "read";
            await contactMessage.save();
        }

        res.json({contactMessage});
    }),
);

router.patch(
    "/:id/status",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const status = getValidStatus(req.body?.status);

        if (!status) {
            return res.status(400).json({message: "Status must be new, read or archived"});
        }

        const contactMessage = await ContactMessage.findByIdAndUpdate(req.params.id, {status}, {new: true, runValidators: true});

        if (!contactMessage) {
            return res.status(404).json({message: "Contact message not found"});
        }

        res.json({message: "Contact message updated", contactMessage});
    }),
);

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

router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const contactMessage = await ContactMessage.findByIdAndDelete(req.params.id);

        if (!contactMessage) {
            return res.status(404).json({message: "Contact message not found"});
        }

        res.json({message: "Contact message deleted"});
    }),
);

export default router;
