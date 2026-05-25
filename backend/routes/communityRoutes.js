import express from "express";
import mongoose from "mongoose";
import expressAsyncHandler from "express-async-handler";
import BlogPost from "../models/blogModel.js";
import NewsArticle from "../models/NewsArticle.js";
import CommunityComment from "../models/communityCommentModel.js";
import CommunityEvent from "../models/communityEventModel.js";
import auth, {isSuperAdminUser, optionalAuth, requireSuperAdmin} from "../middleware/auth.js";

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const allowedCommentStatuses = ["pending", "approved", "rejected"];
const allowedEventStatuses = ["active", "draft", "archived"];

const getValidStatus = (status, allowed, fallback) => (allowed.includes(status) ? status : fallback);

const getContentModel = (contentType) => {
    if (contentType === "blog") return BlogPost;
    if (contentType === "news") return NewsArticle;
    return null;
};

const ensureContentExists = async (contentType, contentId) => {
    const Model = getContentModel(contentType);
    if (!Model || !isValidObjectId(contentId)) return null;
    return Model.findById(contentId).select("_id title");
};

const buildThreadedComments = (comments = []) => {
    const commentMap = new Map();
    const roots = [];

    comments.forEach((comment) => {
        const commentObject = comment.toObject ? comment.toObject() : comment;
        commentObject.replies = [];
        commentMap.set(String(commentObject._id), commentObject);
    });

    commentMap.forEach((comment) => {
        const parentId = comment.parent ? String(comment.parent) : "";
        const parent = parentId ? commentMap.get(parentId) : null;

        if (parent) {
            parent.replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
};

const withRsvpCount = (event, includeRsvps = false) => {
    const eventObject = event.toObject ? event.toObject({virtuals: true}) : event;
    eventObject.rsvpCount = (eventObject.rsvps || []).filter((rsvp) => rsvp.status === "going").length;
    if (!includeRsvps) delete eventObject.rsvps;
    return eventObject;
};

router.get(
    "/comments",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        const {contentType, contentId} = req.query;

        if (!["blog", "news"].includes(contentType) || !isValidObjectId(contentId)) {
            return res.status(400).json({message: "Valid content type and content ID are required"});
        }

        const requestedStatus = req.query.status || "";
        const status = isSuperAdminUser(req.user) ? requestedStatus : "approved";
        const query = {contentType, contentId};

        if (status && status !== "all") {
            query.status = getValidStatus(status, allowedCommentStatuses, "approved");
        }

        const comments = await CommunityComment.find(query).sort({createdAt: 1});
        res.json({comments: buildThreadedComments(comments), total: comments.length});
    }),
);

router.post(
    "/comments",
    expressAsyncHandler(async (req, res) => {
        const {contentType, contentId, parentId, name, email, body} = req.body;
        const commentBody = String(body || "").trim();
        const commenterName = String(name || "").trim();
        const commenterEmail = String(email || "").trim().toLowerCase();

        if (!["blog", "news"].includes(contentType) || !isValidObjectId(contentId)) {
            return res.status(400).json({message: "Valid content type and content ID are required"});
        }

        if (!commenterName || !commentBody) {
            return res.status(400).json({message: "Name and comment are required"});
        }

        const content = await ensureContentExists(contentType, contentId);
        if (!content) return res.status(404).json({message: "The post you are commenting on was not found"});

        let parent = null;
        if (parentId) {
            if (!isValidObjectId(parentId)) return res.status(400).json({message: "Invalid reply target"});
            parent = await CommunityComment.findOne({_id: parentId, contentType, contentId, status: "approved"}).select("_id");
            if (!parent) return res.status(404).json({message: "The comment you are replying to was not found"});
        }

        const comment = await CommunityComment.create({
            contentType,
            contentId,
            parent: parent?._id || null,
            name: commenterName,
            email: commenterEmail,
            body: commentBody,
            status: "pending",
        });

        res.status(201).json({
            message: "Comment submitted for moderation",
            comment,
        });
    }),
);

router.patch(
    "/comments/:id/reaction",
    expressAsyncHandler(async (req, res) => {
        const {reaction} = req.body;
        if (!["like", "dislike"].includes(reaction)) {
            return res.status(400).json({message: "Reaction must be like or dislike"});
        }

        const field = reaction === "like" ? "likes" : "dislikes";
        const comment = await CommunityComment.findOneAndUpdate({_id: req.params.id, status: "approved"}, {$inc: {[field]: 1}}, {new: true});

        if (!comment) return res.status(404).json({message: "Comment not found"});
        res.json({message: "Reaction saved", comment});
    }),
);

router.get(
    "/admin/comments",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const status = req.query.status || "pending";
        const contentType = req.query.contentType || "";
        const query = {};

        if (status !== "all") query.status = getValidStatus(status, allowedCommentStatuses, "pending");
        if (["blog", "news"].includes(contentType)) query.contentType = contentType;

        const comments = await CommunityComment.find(query).sort({createdAt: -1}).limit(200);
        const enrichedComments = await Promise.all(
            comments.map(async (comment) => {
                const commentObject = comment.toObject();
                const content = await ensureContentExists(comment.contentType, comment.contentId);
                commentObject.contentTitle = content?.title || "Deleted post";
                return commentObject;
            }),
        );

        res.json({comments: enrichedComments});
    }),
);

router.patch(
    "/admin/comments/:id/status",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid comment ID"});

        const status = getValidStatus(req.body.status, allowedCommentStatuses, "");
        if (!status) return res.status(400).json({message: "Valid status is required"});

        const comment = await CommunityComment.findByIdAndUpdate(req.params.id, {status}, {new: true});
        if (!comment) return res.status(404).json({message: "Comment not found"});

        res.json({message: "Comment updated", comment});
    }),
);

router.delete(
    "/admin/comments/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid comment ID"});

        await CommunityComment.deleteMany({$or: [{_id: req.params.id}, {parent: req.params.id}]});
        res.json({message: "Comment deleted"});
    }),
);

router.get(
    "/events",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        const requestedStatus = req.query.status || "";
        const status = isSuperAdminUser(req.user) ? requestedStatus : "active";
        const sortDirection = req.query.sort === "desc" ? -1 : 1;
        const type = String(req.query.type || "").trim();
        const query = {};

        if (status && status !== "all") query.status = getValidStatus(status, allowedEventStatuses, "active");
        if (!isSuperAdminUser(req.user)) query.startDate = {$gte: new Date(new Date().setHours(0, 0, 0, 0))};
        if (type) query.eventType = {$regex: type, $options: "i"};

        const includeRsvps = isSuperAdminUser(req.user);
        const events = await CommunityEvent.find(query).sort({startDate: sortDirection, createdAt: -1});
        res.json({events: events.map((event) => withRsvpCount(event, includeRsvps))});
    }),
);

router.post(
    "/events",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {title, description, eventType, startDate, endDate, location, isOnline, onlineUrl, capacity, status} = req.body;

        if (!title?.trim() || !description?.trim() || !startDate) {
            return res.status(400).json({message: "Title, description and start date are required"});
        }

        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({message: "Enter a valid event date"});
        }

        const event = await CommunityEvent.create({
            title: title.trim(),
            description: description.trim(),
            eventType: eventType?.trim() || "Community",
            startDate: start,
            endDate: endDate ? new Date(endDate) : undefined,
            location: location?.trim() || "",
            isOnline: Boolean(isOnline),
            onlineUrl: onlineUrl?.trim() || "",
            capacity: Math.max(0, Number.parseInt(capacity, 10) || 0),
            status: getValidStatus(status, allowedEventStatuses, "active"),
        });

        res.status(201).json({message: "Event created", event: withRsvpCount(event, true)});
    }),
);

router.get(
    "/events/:id",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid event ID"});

        const event = await CommunityEvent.findById(req.params.id);
        if (!event || (!isSuperAdminUser(req.user) && event.status !== "active")) {
            return res.status(404).json({message: "Event not found"});
        }

        res.json({event: withRsvpCount(event, isSuperAdminUser(req.user))});
    }),
);

router.put(
    "/events/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid event ID"});

        const {title, description, eventType, startDate, endDate, location, isOnline, onlineUrl, capacity, status} = req.body;
        const event = await CommunityEvent.findById(req.params.id);
        if (!event) return res.status(404).json({message: "Event not found"});

        if (!title?.trim() || !description?.trim() || !startDate) {
            return res.status(400).json({message: "Title, description and start date are required"});
        }

        const start = new Date(startDate);
        if (Number.isNaN(start.getTime())) {
            return res.status(400).json({message: "Enter a valid event date"});
        }

        event.title = title.trim();
        event.description = description.trim();
        event.eventType = eventType?.trim() || "Community";
        event.startDate = start;
        event.endDate = endDate ? new Date(endDate) : undefined;
        event.location = location?.trim() || "";
        event.isOnline = Boolean(isOnline);
        event.onlineUrl = onlineUrl?.trim() || "";
        event.capacity = Math.max(0, Number.parseInt(capacity, 10) || 0);
        event.status = getValidStatus(status, allowedEventStatuses, "active");

        await event.save();
        res.json({message: "Event updated", event: withRsvpCount(event, true)});
    }),
);

router.delete(
    "/events/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid event ID"});

        const event = await CommunityEvent.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({message: "Event not found"});
        res.json({message: "Event deleted"});
    }),
);

router.post(
    "/events/:id/rsvp",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        if (!isValidObjectId(req.params.id)) return res.status(400).json({message: "Invalid event ID"});

        const event = await CommunityEvent.findById(req.params.id);
        if (!event || event.status !== "active") return res.status(404).json({message: "Event not found"});

        const name = String(req.body.name || req.user?.name || "").trim();
        const email = String(req.body.email || req.user?.email || "").trim().toLowerCase();
        const phone = String(req.body.phone || "").trim();

        if (!name || !email) {
            return res.status(400).json({message: "Name and email are required to RSVP"});
        }

        const existingRsvp = event.rsvps.find((rsvp) => rsvp.email === email);
        const activeRsvpCount = event.rsvps.filter((rsvp) => rsvp.status === "going").length;
        if (!existingRsvp && event.capacity > 0 && activeRsvpCount >= event.capacity) {
            return res.status(409).json({message: "This event is already full"});
        }

        if (existingRsvp) {
            existingRsvp.name = name;
            existingRsvp.phone = phone;
            existingRsvp.user = req.user?._id || existingRsvp.user || null;
            existingRsvp.status = "going";
        } else {
            event.rsvps.push({name, email, phone, user: req.user?._id || null});
        }

        await event.save();
        res.status(201).json({message: "RSVP saved", event: withRsvpCount(event)});
    }),
);

export default router;
