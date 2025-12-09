import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import data from "./data.js";
import cors from "cors";
import Stripe from "stripe";
const stripe = new Stripe("sk_test_51SUrTpIFfcTcOPno1EYXJ2FnfDMstABAfREiGAxkGfaHYS5BOgjNcI25g0MTRzcd9rMlI34Tzai8q5fLrjmOfge100T7jjL9AC");
import * as paypal from "@paypal/checkout-server-sdk";

dotenv.config();
const app = express();
app.use(express.json());

app.use(cors({origin: "http://localhost:3000"}));

const paypalEnvironment = new paypal.core.SandboxEnvironment("YOUR_PAYPAL_CLIENT_ID", "YOUR_PAYPAL_SECRET");
const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);

app.post("/api/create-order", async (req, res) => {
    try {
        const {shipping, items, total, paymentId} = req.body;
        console.log("🆕 New Order:", {shipping, items: items.length, total, paymentId}); // Log for debug

        // TODO: Save to DB (e.g., MongoDB collection 'orders')
        // await db.collection('orders').insertOne({ shipping, items, total, paymentId, createdAt: new Date() });

        res.json({success: true, orderId: "order_" + Date.now()}); // Mock response
    } catch (error) {
        console.error("❌ Order Creation Error:", error);
        res.status(400).json({error: error.message});
    }
});

app.post("/api/create-payment-intent", async (req, res) => {
    try {
        const {amount} = req.body; // In cents
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {enabled: true},
        });
        res.json({clientSecret: paymentIntent.client_secret});
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

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

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
