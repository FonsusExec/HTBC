import React, {useEffect, useState} from "react";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import slugify from "slugify";
import {useNavigate} from "react-router-dom";
import "./createBlog.css";
import {getAuthHeaders} from "../../utils/authHeaders";

export default function CreateBlog() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [media, setMedia] = useState(null);
    const [mediaPreview, setMediaPreview] = useState("");
    const [category, setCategory] = useState("Faith Formation");
    const [seoTitle, setSeoTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [keywords, setKeywords] = useState("");
    const [slug, setSlug] = useState("");
    const [status, setStatus] = useState("active");
    const [loading, setLoading] = useState(false);

    const categories = ["Faith Formation", "Apologetics", "Spirituality"];

    useEffect(() => {
        if (!media) {
            setMediaPreview("");
            return;
        }

        const previewUrl = URL.createObjectURL(media);
        setMediaPreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [media]);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setSeoTitle(newTitle);
        setSlug(slugify(newTitle, {lower: true, strict: true}));
    };

    const handleMediaChange = (e) => {
        const file = e.target.files?.[0];
        setMedia(file || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !body.trim()) {
            toast.warning("Title and body are required");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("body", body);
        formData.append("category", category);
        formData.append("type", "blog");
        formData.append("status", status);
        formData.append("seoTitle", seoTitle || title);
        formData.append("metaDescription", metaDescription);
        formData.append("keywords", keywords);
        formData.append("slug", slug || slugify(title, {lower: true, strict: true}));

        if (media) {
            formData.append("media", media);
        }

        try {
            const res = await fetch("/api/blogs", {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create post");
            }

            toast.success("Blog post created successfully!");

            // Reset form
            setTitle("");
            setBody("");
            setMedia(null);
            setMediaPreview("");
            setCategory("Faith Formation");
            setSeoTitle("");
            setMetaDescription("");
            setKeywords("");
            setSlug("");
            setStatus("active");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Quill configuration
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

    return (
        <div className="admin-page">
            <div className="admin-card">
                {/* Header */}
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2>Create Post</h2>
                </div>

                {/* Form */}
                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Title</label>
                            <input type="text" placeholder="Enter title" value={title} onChange={handleTitleChange} className="inputTitle" />
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
                            <input type="text" placeholder="faith, catholic, spirituality" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Slug (Auto-generated)</label>
                            <input type="text" placeholder="Auto-filled from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Media (optional)</label>
                            <input type="file" accept="image/*" onChange={handleMediaChange} />
                            {media && (
                                <div className="admin-image-preview">
                                    <p>Image Preview: {media.name}</p>
                                    <img src={mediaPreview} alt="Selected blog media preview" />
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
                            placeholder="Write your post here..."
                            style={{height: "300px", marginBottom: "40px"}}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
