import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import data from "./data.js";
import cors from "cors";
import Stripe from "stripe";
import * as paypal from "@paypal/checkout-server-sdk";
import Order from "./models/orderModel.js";
import auth, {optionalAuth, requireSuperAdmin} from "./middleware/auth.js";
// import {auth} from "../backend/routes/userRoutes.js";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import User from "./models/userModel.js";
import Product from "./models/products.js";
import Donation from "./models/donationModel.js";
import InventoryReservation from "./models/inventoryReservationModel.js";
import passport from "passport";
import {sendOrderConfirmation} from "./utils/mailer.js";
import fs from "fs";
import path from "path";
import expressAsyncHandler from "express-async-handler";
import blogRouter from "./routes/blogRoutes.js";
import newsRouter from "./routes/newsRoutes.js";
import resourceRouter from "./routes/resourceRoutes.js";
import impactStoryRouter from "./routes/impactStoryRoutes.js";
import contactMessageRouter from "./routes/contactMessageRoutes.js";
import communityRouter from "./routes/communityRoutes.js";
import Category from "./models/categoryModel.js";
import Role from "./models/roleModel.js";
import imageUpload from "./middleware/imageUpload.js";
import {uploadImagesToCloudinary} from "./utils/cloudinary.js";
// ← ADD THIS POLYFILL: For ES modules
import {fileURLToPath} from "url";
import {dirname} from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: path.join(__dirname, ".env")});

const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const corsOrigins = Array.from(
    new Set(
        [clientUrl, ...(process.env.CORS_ORIGIN || "").split(",")]
            .map((origin) => origin.trim())
            .filter(Boolean),
    ),
);
const isAllowedCorsOrigin = (origin) => !origin || corsOrigins.includes(origin) || process.env.NODE_ENV !== "production";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const paypalClient =
    process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? new paypal.core.PayPalHttpClient(new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)) : null;

// Keep local uploads mounted for existing media and PDF resources while new image uploads use Cloudinary.
const uploadDir = path.join(__dirname, "uploads");
console.log(__dirname);
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {recursive: true}); // Creates folder if gone
    console.log("📁 Created uploads directory at:", uploadDir);
}

console.log("Loaded GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Success" : "Missing - check .env");
const app = express();
app.use(express.json());

app.use("/uploads", express.static(uploadDir));

app.use(
    cors({
        origin: (origin, callback) => {
            if (isAllowedCorsOrigin(origin)) {
                callback(null, true);
                return;
            }

            const corsError = new Error("Not allowed by CORS");
            corsError.statusCode = 403;
            callback(corsError);
        },
        credentials: true,
    }),
);
// CSP middleware to allow DevTools and localhost (add after cors)
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        `default-src 'self' ${clientUrl} ${apiUrl} 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ${apiUrl} ${clientUrl} ws://localhost:9222; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`,
    );
    next();
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || `${apiUrl}/api/users/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({googleId: profile.id});

                if (!user) {
                    user = await User.create({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        googleId: profile.id,
                        isAdmin: false,
                    });
                }

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        },
    ),
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

app.use(passport.initialize());

const createHttpError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const normalizeRoleName = (role) => {
    if (!role) return "";
    const roleValue = typeof role === "string" ? role : role.name || role.slug || "";
    return roleValue.toLowerCase().replace(/[-_]+/g, " ").trim();
};

const isSuperAdminUser = (user) => normalizeRoleName(user?.role) === "super admin";

const getOrderItemProductId = (item = {}) => item.productId || item.product || item._id || item.id;

const normalizeOrderItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw createHttpError("Your cart is empty");
    }

    return items.map((item) => {
        const productId = String(getOrderItemProductId(item) || "").trim();
        const qty = Number.parseInt(item.qty ?? item.quantity, 10);
        const price = Number.parseFloat(item.price);

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            throw createHttpError("One or more cart items are missing a valid product ID");
        }

        if (!Number.isInteger(qty) || qty < 1) {
            throw createHttpError("One or more cart items have an invalid quantity");
        }

        if (!Number.isFinite(price) || price < 0) {
            throw createHttpError("One or more cart items have an invalid price");
        }

        return {
            product: productId,
            productId,
            name: item.name || item.title || "Product",
            qty,
            quantity: qty,
            price,
            image: item.image || "",
        };
    });
};

const getGroupedStockItems = (items) => {
    const grouped = new Map();

    items.forEach((item) => {
        const existing = grouped.get(item.productId);
        if (existing) {
            existing.qty += item.qty;
            return;
        }

        grouped.set(item.productId, {productId: item.productId, qty: item.qty});
    });

    return [...grouped.values()];
};

const validateProductStock = async (items) => {
    const groupedItems = getGroupedStockItems(items);
    const productIds = groupedItems.map((item) => item.productId);
    const products = await Product.find({_id: {$in: productIds}}).select("title stock").lean();
    const productById = new Map(products.map((product) => [String(product._id), product]));

    for (const item of groupedItems) {
        const product = productById.get(item.productId);

        if (!product) {
            throw createHttpError("One or more products in your cart no longer exist", 400);
        }

        if (Number(product.stock || 0) < item.qty) {
            throw createHttpError(`${product.title} has only ${product.stock || 0} left in stock`, 409);
        }
    }

    return {groupedItems, productById};
};

const deductProductStock = async (items) => {
    const {groupedItems, productById} = await validateProductStock(items);

    const deductedItems = [];

    try {
        for (const item of groupedItems) {
            const result = await Product.updateOne({_id: item.productId, stock: {$gte: item.qty}}, {$inc: {stock: -item.qty}});

            if (result.modifiedCount !== 1) {
                const product = productById.get(item.productId);
                throw createHttpError(`${product?.title || "This product"} does not have enough stock anymore`, 409);
            }

            deductedItems.push(item);
        }

        return deductedItems;
    } catch (error) {
        await restoreProductStock(deductedItems);
        throw error;
    }
};

const restoreProductStock = async (items = []) => {
    await Promise.all(items.map((item) => Product.updateOne({_id: item.productId}, {$inc: {stock: item.qty}})));
};

const getReservationItems = (items = []) => items.map((item) => ({productId: item.productId, qty: item.qty}));

const releaseReservation = async (reservation, status = "released") => {
    if (!reservation || reservation.status !== "reserved") return reservation;

    await restoreProductStock(reservation.items.map((item) => ({productId: String(item.productId), qty: item.qty})));
    reservation.status = status;
    reservation.releasedAt = new Date();
    await reservation.save();
    return reservation;
};

const releaseExpiredReservations = async () => {
    const expiredReservations = await InventoryReservation.find({
        status: "reserved",
        expiresAt: {$lte: new Date()},
    }).limit(50);

    for (const reservation of expiredReservations) {
        await releaseReservation(reservation, "expired");
    }
};

const startReservationCleanup = () => {
    const cleanupReservations = () => {
        releaseExpiredReservations().catch((error) => {
            console.error("Reservation cleanup failed:", error.message);
        });
    };

    cleanupReservations();
    setInterval(cleanupReservations, 5 * 60 * 1000);
};

const createInventoryReservation = async ({items, userId, paymentId = ""}) => {
    await releaseExpiredReservations();

    let deductedItems = [];

    try {
        deductedItems = await deductProductStock(items);
        return await InventoryReservation.create({
            reservationId: "reservation_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
            user: userId || undefined,
            paymentId,
            items: getReservationItems(deductedItems),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        });
    } catch (error) {
        if (deductedItems.length > 0) {
            await restoreProductStock(deductedItems);
        }
        throw error;
    }
};

const verifyStripePayment = async ({paymentId, total}) => {
    if (!paymentId) {
        throw createHttpError("Payment ID is required");
    }

    if (!String(paymentId).startsWith("pi_")) {
        return;
    }

    if (!stripe) {
        throw createHttpError("Stripe is not configured. Add STRIPE_SECRET_KEY to backend/.env.", 500);
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    const expectedAmount = Math.round(Number(total) * 100);

    if (paymentIntent.status !== "succeeded") {
        throw createHttpError("Payment has not succeeded");
    }

    if ((paymentIntent.amount_received || 0) < expectedAmount) {
        throw createHttpError("Payment amount does not match the order total");
    }

    return paymentIntent;
};

const refundStripePayment = async (paymentId) => {
    if (!stripe || !String(paymentId || "").startsWith("pi_")) return;

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        if (!paymentIntent.latest_charge) return;
        await stripe.refunds.create({charge: paymentIntent.latest_charge});
    } catch (error) {
        console.error("Stripe refund failed:", error.message);
    }
};

const getOrderReservation = async ({reservationId, paymentId}) => {
    if (reservationId) {
        return InventoryReservation.findOne({reservationId});
    }

    if (paymentId) {
        return InventoryReservation.findOne({paymentId});
    }

    return null;
};

const completeReservation = async (reservation, paymentId) => {
    if (!reservation) return;

    reservation.paymentId = reservation.paymentId || paymentId;
    reservation.status = "completed";
    reservation.completedAt = new Date();
    await reservation.save();
};

const reservationMatchesOrderItems = (reservation, orderItems) => {
    if (!reservation) return false;

    const reservedItems = getGroupedStockItems(
        reservation.items.map((item) => ({
            productId: String(item.productId),
            qty: item.qty,
        })),
    );
    const groupedOrderItems = getGroupedStockItems(orderItems);

    if (reservedItems.length !== groupedOrderItems.length) return false;

    const reservedMap = new Map(reservedItems.map((item) => [item.productId, item.qty]));
    return groupedOrderItems.every((item) => reservedMap.get(item.productId) === item.qty);
};

app.post("/api/create-order", auth, async (req, res) => {
    // Safeguard: Ensure user from auth (before destructuring)
    if (!req.user || !req.user._id) {
        console.log("Order creation: No user from token", req.user); // Debug
        return res.status(401).json({error: "Authentication required for orders"});
    }

    let deductedItems = [];
    let orderSaved = false;
    let reservation = null;
    let shouldRefundPayment = false;
    let shouldReleaseReservation = false;

    try {
        const {shipping, items, total, paymentId, reservationId} = req.body;
        console.log("🆕 New Order Input:", {shipping, items: items ? items.length : "MISSING", total, paymentId});
        console.log("📦 Items sample:", items && items.length > 0 ? items[0] : "Empty/No items");

        // Validate total (number)
        const parsedTotal = parseFloat(total);
        if (isNaN(parsedTotal) || parsedTotal <= 0) {
            return res.status(400).json({error: "Invalid total amount"});
        }

        const orderItems = normalizeOrderItems(items);

        if (!paymentId) {
            return res.status(400).json({error: "Payment ID is required"});
        }

        const existingOrder = await Order.findOne({paymentId});
        if (existingOrder) {
            return res.json({success: true, orderId: existingOrder.orderId, alreadyRecorded: true});
        }

        const paymentIntent = await verifyStripePayment({paymentId, total: parsedTotal});

        if (paymentIntent?.metadata?.userId && String(paymentIntent.metadata.userId) !== String(req.user._id)) {
            return res.status(403).json({error: "This payment does not belong to your account"});
        }

        shouldRefundPayment = true;
        reservation = await getOrderReservation({
            reservationId: reservationId || paymentIntent?.metadata?.reservationId,
            paymentId,
        });

        if (reservation) {
            if (reservation.user && String(reservation.user) !== String(req.user._id) && !isSuperAdminUser(req.user)) {
                shouldRefundPayment = false;
                return res.status(403).json({error: "This stock reservation does not belong to your account"});
            }

            if (reservation.status !== "reserved") {
                throw createHttpError("This checkout reservation is no longer active. Your payment will be refunded.", 409);
            }

            shouldReleaseReservation = true;

            if (reservation.expiresAt && reservation.expiresAt <= new Date()) {
                throw createHttpError("Your checkout reservation expired. Your payment will be refunded. Please try again.", 409);
            }

            if (!reservationMatchesOrderItems(reservation, orderItems)) {
                throw createHttpError("Your cart changed after payment setup. Your payment will be refunded. Please try again.", 409);
            }
        } else {
            deductedItems = await deductProductStock(orderItems);
        }

        const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

        const newOrder = new Order({
            orderId,
            user: req.user._id,
            shipping,
            items: orderItems,
            subtotal: parsedTotal,
            total: parsedTotal,
            paymentId,
            reservationId: reservation?.reservationId || reservationId || paymentIntent?.metadata?.reservationId || "",
        });

        console.log("🔨 About to save order:", {orderId, total: parsedTotal, userId: req.user._id});

        const savedOrder = await newOrder.save();
        orderSaved = true;

        if (reservation) {
            await completeReservation(reservation, paymentId);
            shouldReleaseReservation = false;
        }
        console.log(`✅ Save Result:`, {id: savedOrder._id, orderId: savedOrder.orderId});

        const userEmail = req.user.email || savedOrder.shipping?.email;
        const emailResult = await sendOrderConfirmation(savedOrder, userEmail);

        if (!emailResult.success) {
            console.warn(`⚠️ Email failed for ${savedOrder.orderId}: ${emailResult.error}`);
            // Order still succeeds
        }

        const verify = await Order.findOne({orderId});
        console.log(`🔍 Immediate Verify:`, !!verify ? "Found!" : "NOT FOUND!");

        res.json({success: true, orderId});
    } catch (error) {
        if (!orderSaved) {
            if (shouldReleaseReservation && reservation) {
                await releaseReservation(reservation, reservation.expiresAt && reservation.expiresAt <= new Date() ? "expired" : "released");
            } else if (!reservation && deductedItems.length > 0) {
                await restoreProductStock(deductedItems);
            }

            if (shouldRefundPayment) {
                await refundStripePayment(req.body.paymentId);
            }
        }

        console.error("❌ Order Creation Error:", {
            message: error.message,
            name: error.name,
            isValidation: error.name === "ValidationError",
            stack: error.stack,
        });
        console.error("📤 Full req.body:", req.body);
        res.status(error.statusCode || 400).json({error: error.message});
    }
});

app.get("/api/orders/:id", auth, async (req, res) => {
    try {
        const {id} = req.params;
        console.log(`🔍 Fetching order: ${id}`);

        const order = await Order.findOne({orderId: id});
        if (!order) {
            return res.status(404).json({error: "Order not found"});
        }

        if (String(order.user) !== String(req.user._id) && !isSuperAdminUser(req.user)) {
            return res.status(403).json({error: "You do not have access to this order"});
        }

        // Transform for frontend: Add 'date' as formatted string
        const orderDetails = {
            ...order.toObject(), // All fields
            date: new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric", // e.g., "Nov 30, 2025" – customize format
            }),
        };
        // Remove Mongoose extras
        delete orderDetails._id;
        delete orderDetails.__v;

        res.json(orderDetails);
    } catch (error) {
        console.error("❌ Order Fetch Error:", error);
        res.status(500).json({error: "Failed to fetch order"});
    }
});

app.post("/api/create-payment-intent", optionalAuth, async (req, res) => {
    let reservation = null;

    try {
        if (!stripe) {
            return res.status(500).json({error: "Stripe is not configured. Add STRIPE_SECRET_KEY to backend/.env."});
        }

        const {amount, items = []} = req.body;
        console.log("Payment intent amount:", amount); // Debug

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
            return res.status(400).json({error: "Invalid payment amount"});
        }

        if (Array.isArray(items) && items.length > 0 && !req.user) {
            return res.status(401).json({error: "Please log in before checking out"});
        }

        if (Array.isArray(items) && items.length > 0) {
            const orderItems = normalizeOrderItems(items);
            reservation = await createInventoryReservation({items: orderItems, userId: req.user?._id});
        }

        const paymentMetadata = {};
        if (reservation) paymentMetadata.reservationId = reservation.reservationId;
        if (req.user?._id) paymentMetadata.userId = String(req.user._id);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: parsedAmount,
            currency: "usd",
            automatic_payment_methods: {enabled: true},
            metadata: paymentMetadata,
        });

        if (reservation) {
            reservation.paymentId = paymentIntent.id;
            await reservation.save();
        }

        const response = {clientSecret: paymentIntent.client_secret}; // Explicit
        console.log("Sent clientSecret:", response.clientSecret ? "Yes" : "No"); // Debug
        res.json({...response, reservationId: reservation?.reservationId || ""}); // Always return this
    } catch (error) {
        if (reservation) {
            await releaseReservation(reservation);
        }
        console.error("Stripe intent error:", error.message);
        res.status(error.statusCode || 400).json({error: error.message});
    }
});

app.post(
    "/api/payment-reservations/:reservationId/release",
    optionalAuth,
    expressAsyncHandler(async (req, res) => {
        const reservation = await InventoryReservation.findOne({reservationId: req.params.reservationId});
        if (!reservation) return res.status(404).json({message: "Reservation not found"});

        if (reservation.user) {
            if (!req.user) return res.status(401).json({message: "Authentication required"});
            if (String(reservation.user) !== String(req.user._id) && !isSuperAdminUser(req.user)) {
                return res.status(403).json({message: "You do not have access to this reservation"});
            }
        }

        await releaseReservation(reservation);
        res.json({message: "Reservation released"});
    }),
);

app.post(
    "/api/donations",
    expressAsyncHandler(async (req, res) => {
        const {campaignId, campaignTitle, donor, amount, currency = "usd", paymentId} = req.body;
        const parsedAmount = parseFloat(amount);

        if (!campaignId || !campaignTitle || !donor?.fullName || !donor?.phone || !donor?.email || !paymentId || !parsedAmount || parsedAmount < 1) {
            return res.status(400).json({message: "Donation details are incomplete"});
        }

        const existingDonation = await Donation.findOne({paymentId});
        if (existingDonation) {
            return res.json({message: "Donation already recorded", donation: existingDonation});
        }

        if (!stripe) {
            return res.status(500).json({message: "Stripe is not configured. Add STRIPE_SECRET_KEY to backend/.env."});
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        const expectedAmount = Math.round(parsedAmount * 100);

        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({message: "Payment has not succeeded"});
        }

        if ((paymentIntent.amount_received || 0) < expectedAmount) {
            return res.status(400).json({message: "Payment amount does not match donation amount"});
        }

        const donation = await Donation.create({
            donationId: "donation_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9),
            campaignId,
            campaignTitle,
            donor: {
                fullName: donor.fullName.trim(),
                email: donor.email.toLowerCase().trim(),
                phone: donor.phone?.trim() || "",
            },
            amount: parsedAmount,
            currency: currency.toLowerCase(),
            paymentId,
            status: "confirmed",
        });

        res.status(201).json({message: "Donation recorded", donation});
    }),
);

app.get(
    "/api/admin/donations",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 25);
        const type = req.query.type || "All";
        const skip = (page - 1) * limit;

        const allDonations = await Donation.find().sort({createdAt: -1});
        const emailCounts = allDonations.reduce((counts, donation) => {
            const email = donation.donor?.email?.toLowerCase().trim();
            if (!email) return counts;
            counts[email] = (counts[email] || 0) + 1;
            return counts;
        }, {});

        const donationsWithType = allDonations.map((donation) => {
            const donationObject = donation.toObject();
            const email = donationObject.donor?.email?.toLowerCase().trim();
            const donationType = email && emailCounts[email] > 1 ? "Recurring" : "One-time";

            return {
                ...donationObject,
                type: donationType,
                donationType,
            };
        });

        const filteredDonations = ["One-time", "Recurring"].includes(type) ? donationsWithType.filter((donation) => donation.donationType === type) : donationsWithType;
        const donations = filteredDonations.slice(skip, skip + limit);
        const total = filteredDonations.length;

        res.json({donations, total, page, limit});
    }),
);

app.post("/api/capture-paypal-order", async (req, res) => {
    try {
        if (!paypalClient) {
            return res.status(500).json({error: "PayPal is not configured. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to backend/.env."});
        }

        const {orderID} = req.body;
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        const capture = await paypalClient.execute(request);
        res.json({success: true, capture});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing from backend/.env");
} else {
    mongoose
        .connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("MongoDB connected");
            startReservationCleanup();
        })
        .catch((err) => console.error("MongoDB connection error:", err));
}

app.use(express.urlencoded({extended: true}));

app.use("/api/users", userRouter);

// app.get("/api/products", (req, res) => {
//     res.send(data.products);
// });

// In server.js or your product route file

// CREATE User (Admin)
// CREATE User - Password is optional (default will be used)
app.post(
    "/api/admin/users",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {firstName, lastName, email, role} = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({message: "First name, last name and email are required"});
        }

        const existingUser = await User.findOne({email: email.toLowerCase()});
        if (existingUser) {
            return res.status(400).json({message: "User with this email already exists"});
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        const newUser = await User.create({
            name: fullName,
            email: email.toLowerCase().trim(),
            role: role || "Viewer",
            isAdmin: role === "Admin",
            // Password is optional - backend will handle it
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isAdmin: newUser.isAdmin,
            },
        });
    }),
);

// CREATE Role
// CREATE Role - No Authentication (for now)
app.post(
    "/api/roles",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {name} = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({message: "Role name is required"});
        }

        const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

        const existing = await Role.findOne({slug});
        if (existing) {
            return res.status(400).json({message: "Role with this name already exists"});
        }

        const role = await Role.create({
            name: name.trim(),
            slug,
        });

        res.status(201).json({
            message: "Role created successfully",
            role,
        });
    }),
);

// ====================== USER ROUTES ======================

// GET All Users (for User List)
app.get(
    "/api/admin/users",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const users = await User.find()
            .populate("role", "name") // Populate role name
            .sort({createdAt: -1});
        res.json(users);
    }),
);

// GET Single User by ID
app.get(
    "/api/admin/users/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const user = await User.findById(req.params.id).populate("role", "name");

        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        res.json(user);
    }),
);

// CREATE User
app.post(
    "/api/admin/users",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {firstName, lastName, email, role} = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({message: "First name, last name and email are required"});
        }

        const existingUser = await User.findOne({email: email.toLowerCase()});
        if (existingUser) {
            return res.status(400).json({message: "User with this email already exists"});
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        const newUser = await User.create({
            name: fullName,
            email: email.toLowerCase().trim(),
            role: role || null, // role is ObjectId or null
            isAdmin: role === "Admin" || false,
        });

        res.status(201).json({
            message: "User created successfully",
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isAdmin: newUser.isAdmin,
            },
        });
    }),
);

// UPDATE User
app.put(
    "/api/admin/users/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {firstName, lastName, email, role} = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({message: "User not found"});
        }

        if (firstName || lastName) {
            const fullName = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
            if (fullName) user.name = fullName;
        }

        if (email) user.email = email.toLowerCase().trim();
        if (role !== undefined) {
            user.role = role || null;
            user.isAdmin = role === "Admin";
        }

        await user.save();

        // Return updated user with populated role
        const updatedUser = await User.findById(user._id).populate("role", "name");

        res.json({
            message: "User updated successfully",
            user: updatedUser,
        });
    }),
);

// GET All Roles
app.get("/api/roles", auth, requireSuperAdmin, async (req, res) => {
    try {
        const roles = await Role.find().sort({name: 1});
        res.json(roles);
    } catch (err) {
        console.error("Error fetching roles:", err);
        res.status(500).json({message: "Failed to fetch roles"});
    }
});

app.post(
    "/api/products",
    auth,
    requireSuperAdmin,
    imageUpload.array("images", 10),
    expressAsyncHandler(async (req, res) => {
        const {title, category, subCategory, description, price, stock, sku, mainIndex} = req.body;

        if (!title?.trim() || !category || !description?.trim() || price === undefined || price === "" || stock === undefined || stock === "") {
            return res.status(400).json({message: "Required fields missing"});
        }

        const priceValue = Number(String(price).replace(/,/g, ""));
        const stockValue = Number.parseInt(stock, 10);

        if (!Number.isFinite(priceValue) || priceValue < 0) {
            return res.status(400).json({message: "Enter a valid product price"});
        }

        if (!Number.isFinite(stockValue) || stockValue < 0) {
            return res.status(400).json({message: "Enter a valid product stock"});
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({message: "Upload at least one product image"});
        }

        const categoryExists = await Category.exists({_id: category});
        if (!categoryExists) {
            return res.status(400).json({message: "Selected category was not found"});
        }

        const uploadedImages = await uploadImagesToCloudinary(req.files, "products");
        const requestedMainIndex = Number.parseInt(mainIndex, 10);
        const safeMainIndex = Number.isInteger(requestedMainIndex) && requestedMainIndex >= 0 && requestedMainIndex < uploadedImages.length ? requestedMainIndex : 0;
        const mainImage = uploadedImages[safeMainIndex];
        const additionalImages = uploadedImages.filter((_, index) => index !== safeMainIndex);

        const product = await Product.create({
            title: title.trim(),
            category,
            subCategory: subCategory || "",
            description: description.trim(),
            price: priceValue,
            stock: stockValue,
            sku: sku || `PROD-${Date.now()}`,
            mainImage,
            images: additionalImages,
        });

        res.status(201).json({message: "Product created", product});
    }),
);

// Updated GET /api/products with population
app.get(
    "/api/products",
    expressAsyncHandler(async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.max(1, parseInt(req.query.limit) || 10);
            const skip = (page - 1) * limit;

            const search = req.query.search || "";
            const category = req.query.category || "";

            let query = {};

            if (search) {
                query.$or = [{title: {$regex: search, $options: "i"}}, {description: {$regex: search, $options: "i"}}];
            }

            if (category) {
                query.category = category;
            }

            const products = await Product.find(query)
                .populate("category", "name") // ← This is the key line
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit);

            const total = await Product.countDocuments(query);

            // Transform the response so frontend gets clean category name
            const formattedProducts = products.map((product) => ({
                ...product.toObject(),
                category: product.category ? product.category.name : "Uncategorized",
            }));

            res.json({
                products: formattedProducts,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            });
        } catch (err) {
            console.error("GET /api/products error:", err);
            res.status(500).json({message: "Failed to fetch products"});
        }
    }),
);

// Get single product
app.get(
    "/api/products/:id",
    expressAsyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id).populate("category", "name"); // ← Add this

        if (!product) return res.status(404).json({message: "Product not found"});

        res.json(product);
    }),
);

// UPDATE Product - PUT /api/products/:id
app.put(
    "/api/products/:id",
    auth,
    requireSuperAdmin,
    imageUpload.array("images", 10),
    expressAsyncHandler(async (req, res) => {
        const {title, category, subCategory, description, price, stock, mainIndex} = req.body;
        const existingImages = req.body.existingImages ? (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]) : [];

        if (!title || !category) {
            return res.status(400).json({message: "Title and category are required"});
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        // Update basic fields
        product.title = title;
        product.category = category;
        product.subCategory = subCategory || product.subCategory;
        product.description = description || product.description;
        product.price = parseFloat(price) || product.price;
        product.stock = parseInt(stock) || product.stock;

        // Handle images
        let allImages = [...existingImages]; // Start with kept existing images

        // Add newly uploaded images
        if (req.files && req.files.length > 0) {
            const newImagePaths = await uploadImagesToCloudinary(req.files, "products");
            allImages = [...allImages, ...newImagePaths];
        }

        // If no images at all after update → error
        if (allImages.length === 0) {
            return res.status(400).json({message: "At least one image is required"});
        }

        // Determine mainImage
        let mainImageIndex = parseInt(mainIndex);
        if (isNaN(mainImageIndex) || mainImageIndex < 0 || mainImageIndex >= allImages.length) {
            mainImageIndex = 0; // Default to first image
        }

        product.mainImage = allImages[mainImageIndex];
        product.images = allImages.filter((_, idx) => idx !== mainImageIndex); // All except main

        const updatedProduct = await product.save();

        res.json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    }),
);

// DELETE Product
app.delete(
    "/api/products/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        // Optional: delete Cloudinary assets later if you start storing public IDs.

        res.json({message: "Product deleted successfully"});
    }),
);

// GET all categories (with subcategories)
app.get(
    "/api/categories",
    expressAsyncHandler(async (req, res) => {
        const categories = await Category.find().sort({name: 1});
        res.json(categories);
    }),
);

// CREATE Main Category
app.post(
    "/api/categories",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {name} = req.body;

        if (!name) return res.status(400).json({message: "Category name is required"});

        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const existing = await Category.findOne({slug});
        if (existing) return res.status(400).json({message: "Category already exists"});

        const category = await Category.create({
            name: name.trim(),
            slug,
            subCategories: [],
        });

        res.status(201).json({message: "Category created", category});
    }),
);

// ADD Subcategory to a Category
app.post(
    "/api/categories/:categoryId/subcategories",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {name} = req.body;
        const {categoryId} = req.params;

        if (!name) return res.status(400).json({message: "Subcategory name is required"});

        const slug = name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const category = await Category.findById(categoryId);
        if (!category) return res.status(404).json({message: "Category not found"});

        // Check if subcategory already exists
        if (category.subCategories.some((sub) => sub.slug === slug)) {
            return res.status(400).json({message: "Subcategory already exists"});
        }

        category.subCategories.push({name: name.trim(), slug});
        await category.save();

        res.status(201).json({
            message: "Subcategory added successfully",
            category,
        });
    }),
);

// UPDATE Category
app.put(
    "/api/categories/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const {name, subCategories} = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({message: "Category not found"});

        if (name) {
            category.name = name.trim();
            category.slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
        }

        if (subCategories) {
            category.subCategories = subCategories;
        }

        await category.save();
        res.json({message: "Category updated", category});
    }),
);

// GET Single Category by ID
app.get(
    "/api/categories/:id",
    expressAsyncHandler(async (req, res) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({message: "Category not found"});
        }

        res.json(category);
    }),
);

// DELETE Category - With Protection
app.delete(
    "/api/categories/:id",
    auth,
    requireSuperAdmin,
    expressAsyncHandler(async (req, res) => {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({message: "Category not found"});
        }

        // Check if any products are using this category
        const productsUsingCategory = await Product.countDocuments({category: req.params.id});

        if (productsUsingCategory > 0) {
            return res.status(400).json({
                message: `Cannot delete this category. It is currently used by ${productsUsingCategory} product(s). Please reassign or delete those products first.`,
            });
        }

        // Safe to delete
        await Category.findByIdAndDelete(req.params.id);

        res.json({
            message: "Category deleted successfully",
        });
    }),
);

app.get("/api/orders", auth, async (req, res) => {
    // ← Add auth here
    try {
        // Safeguard: Check req.user exists (extra safety)
        if (!req.user || !req.user._id) {
            return res.status(401).json({message: "User not authenticated"});
        }
        console.log("Fetching orders for user:", req.user._id);

        const userOrders = await Order.find({user: req.user._id}).sort({createdAt: -1}).select("-__v");
        console.log(`Found ${userOrders.length} orders for ${req.user._id}`);
        res.json(userOrders);
    } catch (error) {
        console.error("Orders fetch error:", error);
        res.status(500).json({error: "Failed to fetch orders"});
    }
});

// GET All Orders for Admin (with populated user name)
app.get("/api/admin/orders", auth, requireSuperAdmin, async (req, res) => {
    try {
        // Optional: Add admin check if you have isAdmin field
        // if (!req.user.isAdmin) return res.status(403).json({ message: "Admin access required" });

        const orders = await Order.find()
            .populate("user", "name email") // Get user name and email
            .sort({createdAt: -1});

        console.log(`Admin fetched ${orders.length} total orders`);

        res.json(orders);
    } catch (error) {
        console.error("Admin orders fetch error:", error);
        res.status(500).json({message: "Failed to fetch orders"});
    }
});

// GET Single Order by ID
app.get(
    "/api/orders/:id",
    auth, // ← This requires JWT
    async (req, res) => {
        try {
            const order = await Order.findOne({
                $or: [{_id: req.params.id}, {orderId: req.params.id}],
            });

            if (!order) {
                return res.status(404).json({message: "Order not found"});
            }

            if (String(order.user) !== String(req.user._id) && !isSuperAdminUser(req.user)) {
                return res.status(403).json({message: "You do not have access to this order"});
            }

            res.json(order);
        } catch (error) {
            console.error("Error fetching order:", error);
            res.status(500).json({message: "Failed to fetch order"});
        }
    },
);

app.get("/api/products/htbc/:htbc", (req, res) => {
    const htbc = req.params.htbc;
    const product = data.products.find((x) => x.htbc === htbc);
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({message: "Product not found"});
    }
});

app.use("/api/blogs", blogRouter);
app.use("/api/news", newsRouter);
app.use("/api/resources", resourceRouter);
app.use("/api/impact-stories", impactStoryRouter);
app.use("/api/contact-messages", contactMessageRouter);
app.use("/api/community", communityRouter);

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const validationError = err.name === "ValidationError" || err.name === "CastError";
    const uploadError = err.name === "MulterError";
    const statusCode = err.statusCode || err.status || (validationError || uploadError ? 400 : 500);

    console.error(`${req.method} ${req.originalUrl} error:`, {
        message: err.message,
        name: err.name,
        statusCode,
    });

    res.status(statusCode).json({
        message: err.message || "Server error",
    });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
