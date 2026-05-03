import express from "express";
import expressAsyncHandler from "express-async-handler";
import fs from "fs";
import multer from "multer";
import path from "path";
import {dirname} from "path";
import {fileURLToPath} from "url";
import ImpactStory from "../models/impactStoryModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true});
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({storage});

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
    upload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {title, description} = req.body;

        if (!title || !description || !req.file) {
            return res.status(400).json({message: "Title, image and description are required"});
        }

        const story = await ImpactStory.create({
            title: title.trim(),
            description: description.trim(),
            imageUrl: `/uploads/${req.file.filename}`,
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
    upload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {title, description} = req.body;

        const story = await ImpactStory.findById(req.params.id);
        if (!story) return res.status(404).json({message: "Impact story not found"});

        if (!title || !description) {
            return res.status(400).json({message: "Title and description are required"});
        }

        story.title = title.trim();
        story.description = description.trim();
        if (req.file) story.imageUrl = `/uploads/${req.file.filename}`;

        const updatedStory = await story.save();
        res.json({message: "Impact story updated", story: updatedStory});
    }),
);

router.delete(
    "/:id",
    expressAsyncHandler(async (req, res) => {
        const story = await ImpactStory.findByIdAndDelete(req.params.id);
        if (!story) return res.status(404).json({message: "Impact story not found"});
        res.json({message: "Impact story deleted"});
    }),
);

export default router;
