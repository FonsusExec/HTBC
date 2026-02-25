import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async"; // For SEO (as previously set up)
import axios from "axios";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {toast} from "react-toastify";
import "./blogDetail.css"; // New or shared with createBlog.css
import Loading from "../../components/Loading";

export default function BlogDetail() {
    const {id} = useParams(); // Use :id (or change to :slug later)
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch post by ID
    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/blogs/${id}`);
                setPost(data);
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Failed to load blog post.");
                toast.error("Post not found.");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    // SEO Helmet (dynamic, same as before)
    if (post) {
        const pageTitle = post.seoTitle || post.title;
        const pageDesc = post.metaDescription || post.excerpt;
        const ogImage = post.imageUrl || "https://yourdomain.com/default-og.jpg";
        const canonical = `${window.location.origin}/blog/${id}`;

        <Helmet>
            <title>{pageTitle} | Your Blog</title>
            <meta name="description" content={pageDesc} />
            <meta name="keywords" content={post.keywords?.join(", ") || "blog, faith"} />
            <link rel="canonical" href={canonical} />

            <meta property="og:title" content={pageTitle} />
            <meta property="og:description" content={pageDesc} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:url" content={canonical} />
            <meta property="og:type" content="article" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={pageTitle} />
            <meta name="twitter:description" content={pageDesc} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>;
    }

    if (loading) {
        return (
            <div className="loading">
                <Loading />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <div className="card-header">
                        <button className="back-btn" onClick={() => navigate("/admin/blog")}>
                            ← Back
                        </button>
                        <h2>Error</h2>
                    </div>
                    <div style={{padding: "20px", textAlign: "center"}}>
                        <p>Post not found or an error occurred.</p>
                        <button className="btn save" onClick={() => navigate("/blog")}>
                            Back to Blog List
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-card">
                {/* Header – exact same as Create/Edit */}
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate("/admin/bloglist")}>
                        ← Back
                    </button>
                    <h2>{post.title}</h2> {/* Post title as "header" */}
                </div>

                {/* Content – matches form layout but read-only */}
                <div className="post-detail-content">
                    {/* Featured Image (if exists) */}
                    {post.imageUrl && (
                        <div className="form-group full">
                            <img src={post.imageUrl} alt={post.title} className="post-hero-image" style={{width: "100%", borderRadius: "8px", marginBottom: "20px"}} />
                        </div>
                    )}

                    {/* Category & Dates */}
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Category</label>
                            <p className="readonly-field">{post.category}</p>
                        </div>

                        <div className="form-group">
                            <label>Published</label>
                            <p className="readonly-field">
                                {new Date(post.createdAt).toLocaleString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>

                        {post.updatedAt && post.updatedAt !== post.createdAt && (
                            <div className="form-group">
                                <label>Last Updated</label>
                                <p className="readonly-field">
                                    {new Date(post.updatedAt).toLocaleString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Body – read-only Quill */}
                    <div className="form-group full">
                        <label>Content</label>
                        <div className="readonly-quill">
                            <ReactQuill
                                value={post.content}
                                readOnly={true}
                                theme="bubble" // Clean, no-toolbar view
                                modules={{toolbar: false}}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="form-actions">
                        <button className="btn cancel" onClick={() => navigate("/admin/bloglist")}>
                            Back to List
                        </button>
                        {/* Optional: Edit button here if admin */}
                        <button className="btn save" onClick={() => navigate(`/admin/edit-blog/${post._id}`)}>
                            Edit Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
