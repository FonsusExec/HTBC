import BlogPost from "./models/blogModel.js"; // Ensure imported

app.get("/api/blogs", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const search = req.query.search || ""; // For server-side search
        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (search) {
            query.$or = [{title: {$regex: search, $options: "i"}}, {excerpt: {$regex: search, $options: "i"}}];
        }

        // Fetch current page + total count
        const posts = await BlogPost.find(query).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await BlogPost.countDocuments(query);

        res.json({posts, total}); // { posts: [...], total: 11 }
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.status(500).json({error: "Failed to fetch posts"});
    }
});
