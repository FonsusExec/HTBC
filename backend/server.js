import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/userRoutes.js";
import data from "./data.js";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(express.json());
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
