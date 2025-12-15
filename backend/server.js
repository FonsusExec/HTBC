import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import data from "./data.js";
import cors from "cors";
import Stripe from "stripe";
const stripe = new Stripe("");
import * as paypal from "@paypal/checkout-server-sdk";
import Order from "./models/orderModel.js";
import auth from "./middleware/auth.js";
// import {auth} from "../backend/routes/userRoutes.js";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import User from "./models/userModel.js";
import passport from "passport";
import {sendOrderConfirmation} from "./utils/mailer.js";
import {testEmailConnection} from "./utils/mailer.js";

dotenv.config({path: "./.env"});
console.log("Loaded GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "Success" : "Missing - check .env");
const app = express();
app.use(express.json());

app.use(cors({origin: "http://localhost:3000"}));
// CSP middleware to allow DevTools and localhost (add after cors)
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' http://localhost:3000 http://localhost:5000 'unsafe-inline' 'unsafe-eval'; connect-src 'self' http://localhost:5000 http://localhost:3000 ws://localhost:9222; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    next();
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/users/auth/google/callback",
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
        }
    )
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

const paypalEnvironment = new paypal.core.SandboxEnvironment("YOUR_PAYPAL_CLIENT_ID", "YOUR_PAYPAL_SECRET");
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

app.post("/api/create-order", auth, async (req, res) => {
    // Safeguard: Ensure user from auth (before destructuring)
    if (!req.user || !req.user._id) {
        console.log("Order creation: No user from token", req.user); // Debug
        return res.status(401).json({error: "Authentication required for orders"});
    }

    try {
        const {shipping, items, total, paymentId} = req.body;
        console.log("🆕 New Order Input:", {shipping, items: items ? items.length : "MISSING", total, paymentId});
        console.log("📦 Items sample:", items && items.length > 0 ? items[0] : "Empty/No items");

        // Validate total (number)
        const parsedTotal = parseFloat(total);
        if (isNaN(parsedTotal) || parsedTotal <= 0) {
            return res.status(400).json({error: "Invalid total amount"});
        }

        const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

        const newOrder = new Order({
            orderId,
            user: req.user._id, // Now safe
            shipping,
            items,
            subtotal: parsedTotal,
            total: parsedTotal,
            paymentId,
        });

        console.log("🔨 About to save order:", {orderId, total: parsedTotal, userId: req.user._id});

        const savedOrder = await newOrder.save();
        console.log(`✅ Save Result:`, {id: savedOrder._id, orderId: savedOrder.orderId});

        // ← NEW: Send confirmation email
        const userEmail = req.user.email || order.shipping.email; // Fallback to form email
        const emailResult = await sendOrderConfirmation(savedOrder, userEmail);

        if (!emailResult.success) {
            console.warn(`⚠️ Email failed for ${savedOrder.orderId}: ${emailResult.error}`);
            // Order still succeeds—retry manually if needed
        }

        const verify = await Order.findOne({orderId});
        console.log(`🔍 Immediate Verify:`, !!verify ? "Found!" : "NOT FOUND!");

        res.json({success: true, orderId});
    } catch (error) {
        console.error("❌ Order Creation Error:", {
            message: error.message,
            name: error.name,
            isValidation: error.name === "ValidationError",
            stack: error.stack,
        });
        console.error("📤 Full req.body:", req.body);
        res.status(400).json({error: error.message});
    }
});
// app.post("/api/create-order", auth, async (req, res) => {
//     try {
//         const {shipping, items, total, paymentId} = req.body;
//         console.log("🆕 New Order Input:", {shipping, items: items ? items.length : "MISSING", total, paymentId});
//         console.log("📦 Items sample:", items && items.length > 0 ? items[0] : "Empty/No items"); // Peek at first item structure

//         const orderId = "order_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

//         const newOrder = new Order({
//             orderId,
//             user: req.user._id, // Associate order with authenticated user
//             shipping,
//             items,
//             subtotal: total,
//             total,
//             paymentId,
//         });

//         console.log("🔨 About to save order:", {orderId, total}); // Pre-save

//         const savedOrder = await newOrder.save();
//         console.log(`✅ Save Result:`, {id: savedOrder._id, orderId: savedOrder.orderId});

//         // Verify query
//         const verify = await Order.findOne({orderId});
//         console.log(`🔍 Immediate Verify:`, !!verify ? "Found!" : "NOT FOUND!");

//         res.json({success: true, orderId});
//     } catch (error) {
//         console.error("❌ Order Creation Error:", {
//             message: error.message,
//             stack: error.stack, // Full trace
//             name: error.name, // e.g., "ValidationError"
//             isValidation: error.name === "ValidationError",
//         });
//         // Log full req.body for sanity
//         console.error("📤 Full req.body:", req.body);
//         res.status(400).json({error: error.message});
//     }
// });

app.get("/api/orders/:id", async (req, res) => {
    try {
        const {id} = req.params;
        console.log(`🔍 Fetching order: ${id}`);

        const order = await Order.findOne({orderId: id});
        if (!order) {
            return res.status(404).json({error: "Order not found"});
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

app.post("/api/create-payment-intent", async (req, res) => {
    try {
        const {amount} = req.body;
        console.log("Payment intent amount:", amount); // Debug

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {enabled: true},
        });

        const response = {clientSecret: paymentIntent.client_secret}; // Explicit
        console.log("Sent clientSecret:", response.clientSecret ? "Yes" : "No"); // Debug
        res.json(response); // Always return this
    } catch (error) {
        console.error("Stripe intent error:", error.message);
        res.status(400).json({error: error.message});
    }
});

// app.post("/api/create-payment-intent", async (req, res) => {
//     try {
//         const {amount} = req.body;
//         console.log("Stripe intent request: amount =", amount); // Debug: Log incoming amount

//         if (!amount || amount <= 0) {
//             return res.status(400).json({error: "Amount must be greater than 0"});
//         }

//         const paymentIntent = await stripe.paymentIntents.create({
//             amount,
//             currency: "usd",
//             automatic_payment_methods: {enabled: true},
//         });

//         res.json({clientSecret: paymentIntent.client_secret});
//     } catch (error) {
//         console.error("Stripe error details:", {
//             message: error.message,
//             type: error.type, // e.g., "invalid_request_error"
//             param: error.param, // e.g., "amount"
//             code: error.code, // e.g., "parameter_missing"
//         });
//         res.status(400).json({error: error.message});
//     }
// });

app.post("/api/capture-paypal-order", async (req, res) => {
    try {
        const {orderID} = req.body;
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        const capture = await paypalClient.execute(request);
        res.json({success: true, capture});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.urlencoded({extended: true}));

app.use("/api/users", userRouter);

app.get("/api/products", (req, res) => {
    res.send(data.products);
});

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

app.get("/api/products/htbc/:htbc", (req, res) => {
    const htbc = req.params.htbc;
    const product = data.products.find((x) => x.htbc === htbc);
    if (product) {
        res.send(product);
    } else {
        res.status(404).send({message: "Product not found"});
    }
});

app.use((err, req, res, next) => {
    res.status(500).send({message: err.message});
});

const port = process.env.PORT || 5000;

testEmailConnection();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
