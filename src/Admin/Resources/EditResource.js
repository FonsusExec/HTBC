import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import slugify from "slugify";
import axios from "axios";
import "./createResources.css"; // Reuse the same styles
import Loading from "../../components/Loading";

export default function EditResources() {
    const {id} = useParams(); // Get resource ID from URL
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentPdf, setCurrentPdf] = useState(""); // Show existing PDF name if any
    const [currentLink, setCurrentLink] = useState(""); // Show existing link if any

    // Fetch existing resource
    useEffect(() => {
        const fetchResource = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/resources/${id}`);

                setTitle(data.title || "");
                setBody(data.body || "");
                setSeoTitle(data.seoTitle || data.title || "");
                setMetaDescription(data.metaDescription || "");
                setKeywords(data.keywords ? data.keywords.join(", ") : "");
                setSlug(data.slug || "");

                // Determine type and pre-fill
                if (data.link) {
                    setResourceType("link");
                    setLink(data.link);
                    setCurrentLink(data.link);
                } else if (data.pdfUrl) {
                    setResourceType("pdf");
                    setCurrentPdf(data.pdfUrl.split("/").pop()); // Show filename
                }
            } catch (err) {
                console.error("Error fetching resource:", err);
                toast.error("Failed to load resource. Redirecting...");
                navigate("/admin/resourcelist");
            } finally {
                setLoading(false);
            }
        };

        fetchResource();
    }, [id, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.warning("Title is required");
            return;
        }

        // At least one of Link or PDF is required
        if (resourceType === "link" && !link.trim()) {
            toast.warning("Please enter a valid Link");
            return;
        }
        if (resourceType === "pdf" && !pdf && !currentPdf) {
            toast.warning("Please upload a PDF file");
            return;
        }

        setSaving(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("body", body);
        formData.append("type", "resource");

        if (resourceType === "link") {
            formData.append("link", link);
        } else if (resourceType === "pdf") {
            if (pdf) formData.append("pdf", pdf);
        }

        formData.append("seoTitle", seoTitle || title);
        formData.append("metaDescription", metaDescription);
        formData.append("keywords", keywords);
        formData.append("slug", slug || slugify(title, {lower: true, strict: true}));

        try {
            const res = await fetch(`/api/resources/${id}`, {
                method: "PUT",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to update resource");

            toast.success("Resource updated successfully!");
            navigate("/admin/resourcelist");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    // Quill config
    const modules = {
        toolbar: [[{header: [1, 2, false]}], ["bold", "italic", "underline", "strike"], [{list: "ordered"}, {list: "bullet"}], ["link"], [{align: []}], [{color: []}, {background: []}], ["clean"]],
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "align", "color", "background"];

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
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate("/admin/resourcelist")}>
                        ← Back to Resources
                    </button>
                    <h2>Edit Resource</h2>
                </div>

                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Resource Title</label>
                            <input
                                type="text"
                                placeholder="Enter resource title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setSeoTitle(e.target.value);
                                    setSlug(slugify(e.target.value, {lower: true, strict: true}));
                                }}
                                required
                            />
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

                        {/* Conditional Fields */}
                        {resourceType === "link" && (
                            <div className="form-group">
                                <label>External Link</label>
                                <input type="url" placeholder="https://example.com/resource" value={link} onChange={(e) => setLink(e.target.value)} />
                                {currentLink && (
                                    <div style={{marginTop: "8px"}}>
                                        <small>
                                            Current link:{" "}
                                            <a href={currentLink} target="_blank" rel="noopener noreferrer">
                                                {currentLink}
                                            </a>
                                        </small>
                                    </div>
                                )}
                            </div>
                        )}

                        {resourceType === "pdf" && (
                            <div className="form-group">
                                <label>Upload PDF File (Optional - replaces current)</label>
                                <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files[0])} />
                                {pdf && (
                                    <div style={{marginTop: "8px"}}>
                                        <small>Selected: {pdf.name}</small>
                                    </div>
                                )}
                                {currentPdf && !pdf && (
                                    <div style={{marginTop: "8px"}}>
                                        <small>
                                            Current PDF:{" "}
                                            <a href={currentPdf} target="_blank" rel="noopener noreferrer">
                                                Download
                                            </a>
                                        </small>
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
                        <button type="button" className="btn cancel" onClick={() => navigate("/admin/resources")}>
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? "Saving..." : "Update Resource"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
