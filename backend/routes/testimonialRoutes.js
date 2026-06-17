import express from "express";
import expressAsyncHandler from "express-async-handler";
import Testimonial from "../models/testimonialModel.js";
import auth, {requireSuperAdmin} from "../middleware/auth.js";
import imageUpload from "../middleware/imageUpload.js";
import {uploadImageToCloudinary} from "../utils/cloudinary.js";

const router = express.Router();

const getValidStatus = (status, fallback = "active") => (["active", "draft", "archived"].includes(status) ? status : fallback);
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const testimonials = await Testimonial.find({status: "active"}).sort({order: 1, createdAt: -1});
        res.json({testimonials});
    }),
);

router.get(
    "/admin",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
        const status = req.query.status || "";
        const search = req.query.search || "";
        const skip = (page - 1) * limit;
        const query = {};

        if (["active", "draft", "archived"].includes(status)) query.status = status;
        if (search) {
            query.$or = [{name: {$regex: search, $options: "i"}}, {role: {$regex: search, $options: "i"}}, {quote: {$regex: search, $options: "i"}}];
        }

        const [testimonials, total] = await Promise.all([
            Testimonial.find(query).sort({order: 1, createdAt: -1}).skip(skip).limit(limit),
            Testimonial.countDocuments(query),
        ]);

        res.json({testimonials, total, page, limit});
    }),
);

router.post(
    "/",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {name, role, quote, order, status} = req.body;

        if (!name?.trim() || !quote?.trim()) {
            return res.status(400).json({message: "Name and quote are required"});
        }

        const uploadedImage = req.file ? await uploadImageToCloudinary(req.file, "testimonials") : null;
        const testimonial = await Testimonial.create({
            name: name.trim(),
            role: role?.trim() || "",
            quote: quote.trim(),
            imageUrl: uploadedImage?.url || "",
            order: toNumber(order),
            status: getValidStatus(status),
        });

        res.status(201).json({message: "Testimonial created", testimonial});
    }),
);

router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {name, role, quote, order, status} = req.body;
        const testimonial = await Testimonial.findById(req.params.id);

        if (!testimonial) return res.status(404).json({message: "Testimonial not found"});
        if (!name?.trim() || !quote?.trim()) return res.status(400).json({message: "Name and quote are required"});

        testimonial.name = name.trim();
        testimonial.role = role?.trim() || "";
        testimonial.quote = quote.trim();
        testimonial.order = toNumber(order);
        testimonial.status = getValidStatus(status, testimonial.status);

        if (req.file) {
            const uploadedImage = await uploadImageToCloudinary(req.file, "testimonials");
            testimonial.imageUrl = uploadedImage.url;
        }

        const updatedTestimonial = await testimonial.save();
        res.json({message: "Testimonial updated", testimonial: updatedTestimonial});
    }),
);

router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
        if (!testimonial) return res.status(404).json({message: "Testimonial not found"});
        res.json({message: "Testimonial deleted"});
    }),
);

export default router;
