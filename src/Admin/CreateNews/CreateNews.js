import React, {useState, useEffect} from "react";
import {toast} from "react-toastify";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import slugify from "slugify";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./createNews.css";

export default function CreateNews() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [seoTitle, setSeoTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [keywords, setKeywords] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingFull, setFetchingFull] = useState(false);

    // Auto-population states
    const [sources, setSources] = useState([]);
    const [selectedSource, setSelectedSource] = useState("");
    const [headlines, setHeadlines] = useState([]);
    const [selectedHeadlineUrl, setSelectedHeadlineUrl] = useState("");

    // Load sources on mount
    useEffect(() => {
        axios
            .get("/api/news/sources")
            .then((res) => setSources(res.data))
            .catch((err) => {
                console.error("Sources fetch failed:", err);
                toast.error("Could not load news sources");
            });
    }, []);

    // Load headlines when source changes
    useEffect(() => {
        if (!selectedSource) {
            setHeadlines([]);
            return;
        }

        setLoading(true);
        axios
            .get(`/api/news/headlines/${selectedSource}`)
            .then((res) => {
                setHeadlines(res.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Headlines fetch failed:", err);
                toast.error(`Could not load headlines: ${err.response?.data?.message || err.message}`);
                setLoading(false);
            });
    }, [selectedSource]);

    // When headline selected → auto-fill title, slug, SEO title, body (summary)
    const handleHeadlineSelect = (e) => {
        const selectedUrl = e.target.value;
        setSelectedHeadlineUrl(selectedUrl);

        if (!selectedUrl) {
            setTitle("");
            setBody("");
            setSeoTitle("");
            setSlug("");
            return;
        }

        const selected = headlines.find((h) => h.url === selectedUrl);
        if (!selected) return;

        setTitle(selected.title);
        setSeoTitle(selected.title);
        setSlug(slugify(selected.title, {lower: true, strict: true}));

        // Default to RSS summary
        setBody(selected.description || selected.contentSnippet || "No summary available");
    };

    // Optional: Load full article body
    const loadFullArticle = async () => {
        if (!selectedHeadlineUrl) {
            toast.warn("Select a headline first");
            return;
        }

        setFetchingFull(true);
        try {
            const {data} = await axios.get(`/api/news/article?url=${encodeURIComponent(selectedHeadlineUrl)}`);
            if (data.content) {
                setBody(data.content);
                toast.success("Full article loaded!");
            } else {
                toast.info("No full content available");
            }
        } catch (err) {
            console.warn("Full fetch skipped:", err.message);
            toast.info("Could not load full article — using summary");
        } finally {
            setFetchingFull(false);
        }
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
        formData.append("type", "news");
        formData.append("seoTitle", seoTitle || title);
        formData.append("metaDescription", metaDescription);
        formData.append("keywords", keywords);
        formData.append("slug", slug || slugify(title, {lower: true, strict: true}));

        try {
            const res = await fetch("/api/blogs", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to create news");

            toast.success("News article created successfully!");
            navigate("/admin/newslist");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    // Quill config with image upload enabled
    const modules = {
        toolbar: [
            [{header: [1, 2, false]}],
            ["bold", "italic", "underline", "strike"],
            [{list: "ordered"}, {list: "bullet"}],
            ["link", "image"], // ← Image button for manual upload/insert
            [{align: []}],
            [{color: []}, {background: []}],
            ["clean"],
        ],
    };

    const formats = ["header", "bold", "italic", "underline", "strike", "list", "bullet", "link", "image", "align", "color", "background"];

    return (
        <div className="admin-page">
            <div className="admin-card">
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2>Create News</h2>
                </div>

                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Source</label>
                            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
                                <option value="">Select Source</option>
                                {sources.map((src) => (
                                    <option key={src.value} value={src.value}>
                                        {src.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Title</label>
                            <select value={selectedHeadlineUrl} onChange={handleHeadlineSelect} disabled={!selectedSource || loading}>
                                <option value="">Select Headline or type manually</option>
                                {headlines.map((h) => (
                                    <option key={h.url} value={h.url}>
                                        {h.title}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Or enter custom title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    setSeoTitle(e.target.value);
                                    setSlug(slugify(e.target.value, {lower: true, strict: true}));
                                }}
                                style={{marginTop: "8px", width: "100%"}}
                            />
                        </div>

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
                            <input type="text" placeholder="catholic, vatican, faith" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label>Slug (Auto-generated)</label>
                            <input type="text" placeholder="Auto-filled from title" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group full">
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px"}}>
                            <label>Body</label>
                            {selectedHeadlineUrl && (
                                <button
                                    type="button"
                                    onClick={loadFullArticle}
                                    disabled={fetchingFull}
                                    style={{
                                        background: "#007bff",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 12px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {fetchingFull ? "Fetching..." : "Load Full Article"}
                                </button>
                            )}
                        </div>
                        <ReactQuill
                            theme="snow"
                            value={body}
                            onChange={setBody}
                            modules={modules}
                            formats={formats}
                            placeholder="News body (summary auto-filled; load full text or edit manually)"
                            style={{height: "300px", marginBottom: "40px"}}
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? "Saving..." : "Save News"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
