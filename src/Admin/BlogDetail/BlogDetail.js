import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {Helmet} from "react-helmet-async";
import axios from "axios";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {toast} from "react-toastify";
import "./blogDetail.css"; // Reuse your existing styles
import Loading from "../../components/Loading";

export default function PostDetail({contentType = "blog"}) {
    const {id} = useParams();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch post (unified endpoint since data is in one collection)
    useEffect(() => {
        const fetchPost = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/blogs/${id}`);
                setPost(data);
            } catch (err) {
                console.error("Error fetching post:", err);
                setError("Post not found.");
                toast.error("Post not found.");
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    if (loading)
        return (
            <div className="loading">
                <Loading />
            </div>
        );

    if (error || !post) {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <div className="card-header">
                        <button className="back-btn" onClick={() => navigate(`/admin/${contentType}`)}>
                            ← Back
                        </button>
                        <h2>Error</h2>
                    </div>
                    <div style={{padding: "40px", textAlign: "center"}}>
                        <p>Post not found or an error occurred.</p>
                        <button className="btn save" onClick={() => navigate(`/${contentType}`)}>
                            Back to {contentType === "news" ? "News" : "Blog"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Dynamic SEO Helmet
    const pageTitle = post.seoTitle || post.title;
    const pageDesc = post.metaDescription || post.excerpt || "";
    const ogImage = post.imageUrl || "https://yourdomain.com/default-og.jpg";
    const canonical = `${window.location.origin}/${contentType}/${id}`;

    return (
        <>
            <Helmet>
                <title>{pageTitle} | How To Be Catholic</title>
                <meta name="description" content={pageDesc} />
                <meta name="keywords" content={post.keywords?.join(", ") || ""} />
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
            </Helmet>

            <div className="admin-page">
                <div className="admin-card">
                    {/* Header */}
                    <div className="card-header">
                        <button className="back-btn" onClick={() => navigate(`/${contentType}`)}>
                            ← Back to {contentType === "news" ? "News" : "Blog"}
                        </button>
                        <h2>{post.title}</h2>
                    </div>

                    {/* Content */}
                    <div className="post-detail-content">
                        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="post-hero-image" style={{width: "100%", borderRadius: "8px", marginBottom: "20px"}} />}

                        <div className="form-grid">
                            {post.category && (
                                <div className="form-group">
                                    <label>Category</label>
                                    <p className="readonly-field">{post.category}</p>
                                </div>
                            )}

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
                        </div>

                        {/* Body */}
                        <div className="form-group full">
                            <div className="readonly-quill">
                                <ReactQuill value={post.content} readOnly={true} theme="bubble" modules={{toolbar: false}} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="form-actions">
                            <button className="btn cancel" onClick={() => navigate(`/${contentType}`)}>
                                Back to List
                            </button>
                            <button className="btn save" onClick={() => navigate(`/admin/edit-${contentType}/${post._id}`)}>
                                Edit {contentType === "news" ? "News" : "Blog"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
