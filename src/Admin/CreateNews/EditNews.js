import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import axios from "axios";
import "./createNews.css"; // Reuse styles
import Loading from "../../components/Loading";

export default function EditNews() {
    const {id} = useParams(); // Get post ID from URL
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState(""); // Rich HTML
    const [media, setMedia] = useState(null); // New media file (optional)
    const [seoTitle, setSeoTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [keywords, setKeywords] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentImage, setCurrentImage] = useState(""); // Preview current image

    // Fetch post on mount
    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/news/${id}`); // ← Use /api/news/:id
                setTitle(data.title);
                setBody(data.content || ""); // Full content as HTML
                setSeoTitle(data.seoTitle || data.title || "");
                setMetaDescription(data.metaDescription || "");
                setKeywords(data.keywords ? data.keywords.join(", ") : "");
                setSlug(data.slug || "");
                setCurrentImage(data.imageUrl || "");
            } catch (err) {
                console.error("Error fetching news:", err);
                toast.error("Failed to load news article. Redirecting...");
                navigate("/admin/newslist"); // Back to news list on error
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id, navigate]);

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
        if (media) formData.append("media", media); // Optional new image

        // SEO fields
        formData.append("seoTitle", seoTitle || title);
        formData.append("metaDescription", metaDescription);
        formData.append("keywords", keywords);
        formData.append("slug", slug || slugify(title, {lower: true}));

        try {
            await axios.put(`/api/news/${id}`, formData, {
                headers: {"Content-Type": "multipart/form-data"},
            }); // PUT /api/news/:id

            toast.success("News article updated successfully!");
            navigate("/admin/newslist"); // Back to news list
        } catch (err) {
            console.error("Update error:", err);
            toast.error(err.response?.data?.message || "Failed to update news article");
        } finally {
            setSaving(false);
        }
    };

    // Quill config (same as CreateNews)
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
                    <button className="back-btn" onClick={() => navigate("/admin/news")}>
                        ← Back to News List
                    </button>
                    <h2>Edit News Article</h2>
                </div>

                {/* Form */}
                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Title</label>
                            <input type="text" placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        {/* Removed Category */}

                        <div className="form-group">
                            <label>SEO Title (Optional)</label>
                            <input type="text" placeholder="Custom title for search results (under 60 chars)" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} />
                        </div>

                        <div className="form-group">
                            <label>Meta Description (Optional)</label>
                            <textarea
                                placeholder="Short summary for search results (under 160 chars)"
                                value={metaDescription}
                                onChange={(e) => setMetaDescription(e.target.value)}
                                maxLength={160}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label>Keywords (Comma-separated)</label>
                            <input type="text" placeholder="catholic, vatican, faith" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Slug (Auto-generated)</label>
                            <input type="text" placeholder="Auto-filled from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Media (Optional - replaces current)</label>
                            <input type="file" accept="image/*" onChange={(e) => setMedia(e.target.files[0])} />
                            {currentImage && (
                                <div className="current-image">
                                    <p>Current Image:</p>
                                    <img src={currentImage} alt="Current" style={{width: "100px", height: "auto", marginTop: "5px"}} />
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
                            placeholder="Edit your news article here..."
                            style={{height: "300px", marginBottom: "20px"}}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel" onClick={() => navigate("/admin/news")}>
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={saving}>
                            {saving ? "Saving..." : "Update News Article"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
