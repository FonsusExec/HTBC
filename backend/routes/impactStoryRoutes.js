import express from "express";
import expressAsyncHandler from "express-async-handler";
import ImpactStory from "../models/impactStoryModel.js";
import auth, {requireSuperAdmin} from "../middleware/auth.js";
import imageUpload from "../middleware/imageUpload.js";
import {uploadImageToCloudinary} from "../utils/cloudinary.js";

const router = express.Router();

router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const search = req.query.search || "";
        const skip = (page - 1) * limit;

        const query = search
            ? {
                  $or: [{title: {$regex: search, $options: "i"}}, {description: {$regex: search, $options: "i"}}],
              }
            : {};

        const stories = await ImpactStory.find(query).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await ImpactStory.countDocuments(query);

        res.json({stories, total, page, limit});
    }),
);

router.post(
    "/",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {title, description} = req.body;

        if (!title || !description || !req.file) {
            return res.status(400).json({message: "Title, image and description are required"});
        }

        const uploadedImage = await uploadImageToCloudinary(req.file, "impact-stories");

        const story = await ImpactStory.create({
            title: title.trim(),
            description: description.trim(),
            imageUrl: uploadedImage.url,
        });

        res.status(201).json({message: "Impact story created", story});
    }),
);

router.get(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const story = await ImpactStory.findById(req.params.id);
        if (!story) return res.status(404).json({message: "Impact story not found"});
        res.json(story);
    }),
);

router.put(
    "/:id",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {title, description} = req.body;

        const story = await ImpactStory.findById(req.params.id);
        if (!story) return res.status(404).json({message: "Impact story not found"});

        if (!title || !description) {
            return res.status(400).json({message: "Title and description are required"});
        }

        story.title = title.trim();
        story.description = description.trim();
        if (req.file) {
            const uploadedImage = await uploadImageToCloudinary(req.file, "impact-stories");
            story.imageUrl = uploadedImage.url;
        }

        const updatedStory = await story.save();
        res.json({message: "Impact story updated", story: updatedStory});
    }),
);

router.delete(
    "/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const story = await ImpactStory.findByIdAndDelete(req.params.id);
        if (!story) return res.status(404).json({message: "Impact story not found"});
        res.json({message: "Impact story deleted"});
    }),
);

export default router;
