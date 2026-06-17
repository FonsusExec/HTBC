import express from "express";
import expressAsyncHandler from "express-async-handler";
import AboutPage from "../models/aboutPageModel.js";
import TeamMember from "../models/teamMemberModel.js";
import Testimonial from "../models/testimonialModel.js";
import auth, {requireSuperAdmin} from "../middleware/auth.js";
import imageUpload from "../middleware/imageUpload.js";
import {uploadImageToCloudinary} from "../utils/cloudinary.js";

const router = express.Router();

const fallbackMission =
    "Our mission is to bring the light of Christ into every heart, home, and community we serve. Rooted in the teachings of the Catholic faith, we are dedicated to evangelizing the Gospel with love, humility, and courage.";

const getValidStatus = (status, fallback = "active") => (["active", "draft", "archived"].includes(status) ? status : fallback);
const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const getAboutPage = async () => {
    const existingPage = await AboutPage.findOne().sort({createdAt: -1});
    if (existingPage) return existingPage;

    return AboutPage.create({
        missionText: fallbackMission,
    });
};

router.get(
    "/",
    expressAsyncHandler(async (req, res) => {
        const [page, teamMembers, testimonials] = await Promise.all([
            getAboutPage(),
            TeamMember.find({status: "active"}).sort({order: 1, createdAt: -1}).limit(12),
            Testimonial.find({status: "active"}).sort({order: 1, createdAt: -1}).limit(8),
        ]);

        res.json({page, teamMembers, testimonials});
    }),
);

router.get(
    "/admin",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const [page, teamMembers] = await Promise.all([getAboutPage(), TeamMember.find({}).sort({order: 1, createdAt: -1})]);
        res.json({page, teamMembers});
    }),
);

router.put(
    "/admin",
    auth,
    requireSuperAdmin,
    imageUpload.single("heroImage"),
    expressAsyncHandler(async (req, res) => {
        const page = await getAboutPage();
        const {heroTitle, missionTitle, missionText, teamTitle, testimonialTitle} = req.body;

        if (!missionText?.trim()) {
            return res.status(400).json({message: "Mission text is required"});
        }

        page.heroTitle = heroTitle?.trim() || "About Us";
        page.missionTitle = missionTitle?.trim() || "Our Mission";
        page.missionText = missionText.trim();
        page.teamTitle = teamTitle?.trim() || "Our Team";
        page.testimonialTitle = testimonialTitle?.trim() || "Testimonials";

        if (req.file) {
            const uploadedImage = await uploadImageToCloudinary(req.file, "about/page");
            page.heroImageUrl = uploadedImage.url;
        }

        const updatedPage = await page.save();
        res.json({message: "About page updated", page: updatedPage});
    }),
);

router.post(
    "/team",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {name, role, bio, order, status} = req.body;

        if (!name?.trim() || !req.file) {
            return res.status(400).json({message: "Name and image are required"});
        }

        const uploadedImage = await uploadImageToCloudinary(req.file, "about/team");
        const teamMember = await TeamMember.create({
            name: name.trim(),
            role: role?.trim() || "",
            bio: bio?.trim() || "",
            imageUrl: uploadedImage.url,
            order: toNumber(order),
            status: getValidStatus(status),
        });

        res.status(201).json({message: "Team member created", teamMember});
    }),
);

router.put(
    "/team/:id",
    auth,
    requireSuperAdmin,
    imageUpload.single("image"),
    expressAsyncHandler(async (req, res) => {
        const {name, role, bio, order, status} = req.body;
        const teamMember = await TeamMember.findById(req.params.id);

        if (!teamMember) return res.status(404).json({message: "Team member not found"});
        if (!name?.trim()) return res.status(400).json({message: "Name is required"});

        teamMember.name = name.trim();
        teamMember.role = role?.trim() || "";
        teamMember.bio = bio?.trim() || "";
        teamMember.order = toNumber(order);
        teamMember.status = getValidStatus(status, teamMember.status);

        if (req.file) {
            const uploadedImage = await uploadImageToCloudinary(req.file, "about/team");
            teamMember.imageUrl = uploadedImage.url;
        }

        const updatedTeamMember = await teamMember.save();
        res.json({message: "Team member updated", teamMember: updatedTeamMember});
    }),
);

router.delete(
    "/team/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const teamMember = await TeamMember.findByIdAndDelete(req.params.id);
        if (!teamMember) return res.status(404).json({message: "Team member not found"});
        res.json({message: "Team member deleted"});
    }),
);

export default router;
