import React, {useState} from "react";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import slugify from "slugify";
import {useNavigate} from "react-router-dom";
import "./createResources.css";
import {getAuthHeaders} from "../../utils/authHeaders";

export default function CreateResources() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [resourceType, setResourceType] = useState("link"); // "link" or "pdf"
    const [link, setLink] = useState("");
    const [pdf, setPdf] = useState(null);
    const [seoTitle, setSeoTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [keywords, setKeywords] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);

    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setSeoTitle(newTitle);
        setSlug(slugify(newTitle, {lower: true, strict: true}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.warning("Title is required");
            return;
        }

        // No validation for link or pdf — both are optional now
        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("body", body);
        formData.append("type", "resource");

        if (resourceType === "link" && link.trim()) {
            formData.append("link", link);
        }
        if (resourceType === "pdf" && pdf) {
            formData.append("pdf", pdf);
        }

        formData.append("seoTitle", seoTitle || title);
        formData.append("metaDescription", metaDescription);
        formData.append("keywords", keywords);
        formData.append("slug", slug || slugify(title, {lower: true, strict: true}));

        try {
            const res = await fetch("/api/resources", {
                method: "POST",
                headers: getAuthHeaders(),
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to create resource");

            toast.success("Resource created successfully!");

            // Reset form
            setTitle("");
            setBody("");
            setLink("");
            setPdf(null);
            setResourceType("link");
            setSeoTitle("");
            setMetaDescription("");
            setKeywords("");
            setSlug("");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Quill config
    const modules = {
        toolbar: [[{header: [1, 2, false]}], ["bold", "italic", "underline", "strike"], [{list: "ordered"}, {list: "bullet"}], ["link"], [{align: []}], [{color: []}, {background: []}], ["clean"]],
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "align", "color", "background"];

    return (
        <div className="admin-page">
            <div className="admin-card">
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2>Create Resource</h2>
                </div>

                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Resource Title</label>
                            <input type="text" placeholder="Enter resource title" value={title} onChange={handleTitleChange} required />
                        </div>

                        {/* Resource Type Selection */}
                        <div className="form-group">
                            <label>Resource Type</label>
                            <div style={{display: "flex", gap: "20px", marginTop: "8px"}}>
                                <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                                    <input type="radio" name="resourceType" value="link" checked={resourceType === "link"} onChange={() => setResourceType("link")} />
                                    External Link
                                </label>

                                <label style={{display: "flex", alignItems: "center", gap: "8px", cursor: "pointer"}}>
                                    <input type="radio" name="resourceType" value="pdf" checked={resourceType === "pdf"} onChange={() => setResourceType("pdf")} />
                                    PDF File
                                </label>
                            </div>
                        </div>

                        {/* Conditional Fields - Optional */}
                        {resourceType === "link" && (
                            <div className="form-group">
                                <label>External Link (Optional)</label>
                                <input type="url" placeholder="https://example.com/resource" value={link} onChange={(e) => setLink(e.target.value)} />
                            </div>
                        )}

                        {resourceType === "pdf" && (
                            <div className="form-group">
                                <label>Upload PDF File (Optional)</label>
                                <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
                                {pdf && (
                                    <div style={{marginTop: "8px"}}>
                                        <small>Selected: {pdf.name}</small>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SEO Fields */}
                        <div className="form-group">
                            <label>SEO Title (Optional)</label>
                            <input type="text" placeholder="Custom title for search results" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={60} />
                        </div>

                        <div className="form-group">
                            <label>Meta Description (Optional)</label>
                            <textarea placeholder="Short summary for search results" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} rows={3} />
                        </div>

                        <div className="form-group">
                            <label>Keywords (Comma-separated)</label>
                            <input type="text" placeholder="catholic, prayer, liturgy, download" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Slug (Auto-generated)</label>
                            <input type="text" placeholder="Auto-filled from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Description / Notes (Optional)</label>
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            modules={modules}
                            formats={formats}
                            placeholder="Add any additional notes about this resource..."
                            style={{height: "300px", marginBottom: "40px"}}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? "Saving..." : "Save Resource"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
