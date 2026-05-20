import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new"; // Your fixed Quill import
import "react-quill-new/dist/quill.snow.css";
import axios from "axios"; // For API calls
import "./createBlog.css"; // Reuse styles from CreateBlog
import Loading from "../../components/Loading";

export default function EditBlog() {
    const {id} = useParams(); // Get post ID from URL
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [body, setBody] = useState(""); // Rich HTML
    const [media, setMedia] = useState(null); // New media file (optional)
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("active");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentImage, setCurrentImage] = useState(""); // Preview current image
    const [mediaPreview, setMediaPreview] = useState("");

    const categories = ["Faith Formation", "Apologetics", "Spirituality"];

    // Fetch post on mount
    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/blogs/${id}`); // GET /api/blogs/:id
                setTitle(data.title);
                setBody(data.content || ""); // Full content as HTML
                setCategory(data.category || "Faith Formation");
                setStatus(data.status || "active");
                setCurrentImage(data.imageUrl || ""); // For preview
            } catch (err) {
                console.error("Error fetching post:", err);
                toast.error("Failed to load post. Redirecting...");
                navigate("/admin/blogs"); // Back to list on error
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id, navigate]);

    useEffect(() => {
        if (!media) {
            setMediaPreview("");
            return;
        }

        const previewUrl = URL.createObjectURL(media);
        setMediaPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [media]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !body.trim()) {
            toast.warning("Title and body are required");
            return;
        }

        setSaving(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("body", body); // HTML from Quill
        formData.append("category", category);
        formData.append("status", status);
        formData.append("type", "blog");
        if (media) formData.append("media", media); // Optional new image

        try {
            await axios.put(`/api/blogs/${id}`, formData, {
                headers: {"Content-Type": "multipart/form-data"},
            }); // PUT /api/blogs/:id

            toast.success("Blog post updated successfully!");
            navigate("/admin/bloglist"); // Back to list
        } catch (err) {
            console.error("Update error:", err);
            toast.error(err.response?.data?.message || "Failed to update post");
        } finally {
            setSaving(false);
        }
    };

    // Quill config (same as CreateBlog)
    const modules = {
        toolbar: [
            [{header: [1, 2, false]}],
            ["bold", "italic", "underline", "strike"],
            [{list: "ordered"}, {list: "bullet"}],
            ["link", "image"],
            [{align: []}],
            [{color: []}, {background: []}],
            ["clean"],
        ],
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "image", "align", "color", "background"];

    if (loading) {
        return (
            <div className="loading">
                <Loading />
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-card">
                {/* Header */}
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate("/admin/bloglist")}>
                        ← Back to List
                    </button>
                    <h2>Edit Post</h2>
                </div>

                {/* Form */}
                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Title</label>
                            <input type="text" placeholder="Enter" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="active">Active - visible on site</option>
                                <option value="draft">Draft - admin only</option>
                                <option value="archived">Archived - hidden</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Media (Optional - replaces current)</label>
                            <input type="file" accept="image/*" onChange={(e) => setMedia(e.target.files?.[0] || null)} />
                            {(mediaPreview || currentImage) && (
                                <div className="admin-image-preview">
                                    <p>{mediaPreview ? `New Image Preview: ${media.name}` : "Current Image:"}</p>
                                    <img src={mediaPreview || currentImage} alt={mediaPreview ? "Selected blog media preview" : "Current blog media"} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Body</label>
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            modules={modules}
                            formats={formats}
                            placeholder="Edit your post here..."
                            style={{height: "300px", marginBottom: "20px"}}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel" onClick={() => navigate("/admin/bloglist")}>
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={saving}>
                            {saving ? "Saving..." : "Update Post"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
