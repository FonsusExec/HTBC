import blogModel from "../models/blogModel.js";

export const createBlog = async (req, res) => {
    try {
        const {title, body} = req.body;
        const excerpt = body.substring(0, 120) + "...";

        const blog = await blogModel.create({
            title,
            body,
            excerpt,
            media: req.file ? `/uploads/${req.file.filename}` : null,
            status: req.body.status || "active",
        });

        res.status(201).json(blog);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};
