import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {FaArrowLeft, FaExternalLinkAlt, FaRegCommentDots, FaRegThumbsDown, FaRegThumbsUp} from "react-icons/fa";
import {useAuth} from "../../AuthContext";
import Loading from "../../components/Loading";
import "./newsDetail.css";

const fallbackImage = require("../../assets/img/htbc-new1.png");

const decodeHtmlEntities = (value = "") => {
    let text = String(value).replace(/&nbsp;|&#160;|\u00a0/gi, " ");

    if (typeof document === "undefined") return text;

    const textarea = document.createElement("textarea");
    for (let i = 0; i < 2; i += 1) {
        textarea.innerHTML = text;
        text = textarea.value;
    }

    return text.replace(/&nbsp;|&#160;|\u00a0/gi, " ");
};

const stripHtml = (value = "") => {
    const decodedValue = decodeHtmlEntities(value);

    return decodeHtmlEntities(
        decodedValue
            .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, "\n\n")
            .replace(/<[^>]*>/g, " "),
    )
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s+/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const formatDate = (dateValue) => {
    if (!dateValue) return "Recent";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recent";

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

const getReactionKey = (commentId) => `htbc-news-comment-reaction-${commentId}`;

const getStoredReaction = (commentId) => {
    try {
        return localStorage.getItem(getReactionKey(commentId));
    } catch {
        return "";
    }
};

const saveStoredReaction = (commentId, reaction) => {
    try {
        localStorage.setItem(getReactionKey(commentId), reaction);
    } catch {
        // The vote still saves on the backend if storage is unavailable.
    }
};

export default function NewsDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const {user} = useAuth();
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [form, setForm] = useState({name: "", email: "", body: ""});
    const [formError, setFormError] = useState("");
    const [formSuccess, setFormSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reactingId, setReactingId] = useState("");
    const [reactedComments, setReactedComments] = useState({});

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "smooth"});
    }, [id]);

    useEffect(() => {
        if (!user) return;
        setForm((currentForm) => ({
            ...currentForm,
            name: currentForm.name || user.name || "",
            email: currentForm.email || user.email || "",
        }));
    }, [user]);

    useEffect(() => {
        let isActive = true;

        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError("");

                const [articleResponse, commentsResponse] = await Promise.all([axios.get(`/api/news/${id}`), axios.get(`/api/news/${id}/comments`)]);
                if (!isActive) return;

                const nextComments = commentsResponse.data.comments || [];
                const nextReactions = nextComments.reduce((storedReactions, comment) => {
                    const reaction = getStoredReaction(comment._id);
                    if (reaction) storedReactions[comment._id] = reaction;
                    return storedReactions;
                }, {});

                setArticle(articleResponse.data);
                setComments(nextComments);
                setReactedComments(nextReactions);
            } catch (err) {
                if (!isActive) return;
                setError(err.response?.data?.message || "Unable to load this news article right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchArticle();

        return () => {
            isActive = false;
        };
    }, [id]);

    const articleParagraphs = useMemo(() => {
        const text = stripHtml(article?.content || article?.description || article?.metaDescription || "");
        return text ? text.split(/\n{2,}/).filter(Boolean) : [];
    }, [article]);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setForm((currentForm) => ({...currentForm, [name]: value}));
        setFormError("");
        setFormSuccess("");
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        const name = form.name.trim();
        const body = form.body.trim();
        const email = form.email.trim();

        if (!name || !body) {
            setFormError("Please enter your name and comment before posting.");
            return;
        }

        try {
            setSubmitting(true);
            setFormError("");
            setFormSuccess("");

            const {data} = await axios.post(`/api/news/${id}/comments`, {name, email, body});
            setComments((currentComments) => [data.comment, ...currentComments]);
            setForm((currentForm) => ({...currentForm, body: ""}));
            setFormSuccess("Your comment has been posted.");
        } catch (err) {
            setFormError(err.response?.data?.message || "Unable to post your comment right now.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReaction = async (commentId, reaction) => {
        if (reactedComments[commentId]) return;

        try {
            setReactingId(`${commentId}-${reaction}`);
            setFormError("");

            const {data} = await axios.patch(`/api/news/${id}/comments/${commentId}/reaction`, {reaction});
            setComments((currentComments) => currentComments.map((comment) => (comment._id === commentId ? data.comment : comment)));
            setReactedComments((currentReactions) => ({...currentReactions, [commentId]: reaction}));
            saveStoredReaction(commentId, reaction);
        } catch (err) {
            setFormError(err.response?.data?.message || "Unable to save your reaction right now.");
        } finally {
            setReactingId("");
        }
    };

    if (loading) {
        return (
            <main className="news-detail-page">
                <section className="news-detail-state">
                    <Loading message="Loading article..." />
                </section>
            </main>
        );
    }

    if (error || !article) {
        return (
            <main className="news-detail-page">
                <section className="news-detail-state news-detail-state--error">
                    <h1>Article unavailable</h1>
                    <p>{error || "This article could not be found."}</p>
                    <button type="button" onClick={() => navigate("/news")}>
                        <FaArrowLeft aria-hidden="true" />
                        Back to News
                    </button>
                </section>
            </main>
        );
    }

    return (
        <main className="news-detail-page">
            <section className="news-detail-hero">
                <div className="news-detail-hero-copy">
                    <button type="button" className="news-detail-back" onClick={() => navigate("/news")}>
                        <FaArrowLeft aria-hidden="true" />
                        Back to News
                    </button>
                    <span className="news-detail-source">{article.source || "How To Be Catholic"}</span>
                    <h1>{article.title}</h1>
                    <div className="news-detail-meta">
                        <time>{formatDate(article.pubDate || article.createdAt)}</time>
                        <span>{comments.length} comments</span>
                    </div>
                </div>
                <div className="news-detail-hero-image">
                    <img src={getImageSrc(article.imageUrl)} alt={article.title} />
                </div>
            </section>

            <section className="news-detail-content-shell">
                <article className="news-detail-article">
                    <div className="news-detail-body">
                        {articleParagraphs.length > 0 ? (
                            articleParagraphs.map((paragraph, index) => <p key={`${paragraph.slice(0, 30)}-${index}`}>{paragraph}</p>)
                        ) : (
                            <p>No article body is available yet. Please check the original source for the full story.</p>
                        )}
                    </div>

                    {article.url && (
                        <a className="news-detail-source-link" href={article.url} target="_blank" rel="noreferrer">
                            <FaExternalLinkAlt aria-hidden="true" />
                            Read from original source
                        </a>
                    )}
                </article>

                <aside className="news-detail-comments" aria-label="Article comments">
                    <div className="news-comments-heading">
                        <div>
                            <span>Discussion</span>
                            <h2>Comments</h2>
                        </div>
                        <strong>{comments.length}</strong>
                    </div>

                    <form className="news-comment-form" onSubmit={handleCommentSubmit}>
                        <div className="news-comment-form-row">
                            <label>
                                <span>Name</span>
                                <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Your name" />
                            </label>
                            <label>
                                <span>Email</span>
                                <input type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="Optional email" />
                            </label>
                        </div>

                        <label>
                            <span>Comment</span>
                            <textarea name="body" rows="5" value={form.body} onChange={handleInputChange} placeholder="Share your thoughts" />
                        </label>

                        {formError && <p className="news-comment-message news-comment-message--error">{formError}</p>}
                        {formSuccess && <p className="news-comment-message news-comment-message--success">{formSuccess}</p>}

                        <button type="submit" disabled={submitting}>
                            <FaRegCommentDots aria-hidden="true" />
                            {submitting ? "Posting..." : "Post Comment"}
                        </button>
                    </form>

                    <div className="news-comment-list">
                        {comments.length === 0 ? (
                            <div className="news-comment-empty">
                                <FaRegCommentDots aria-hidden="true" />
                                <p>Be the first to comment on this article.</p>
                            </div>
                        ) : (
                            comments.map((comment) => {
                                const storedReaction = reactedComments[comment._id];
                                const isReacting = reactingId.startsWith(comment._id);

                                return (
                                    <article className="news-comment-card" key={comment._id}>
                                        <div className="news-comment-card-header">
                                            <div>
                                                <h3>{comment.name}</h3>
                                                <time>{formatDate(comment.createdAt)}</time>
                                            </div>
                                        </div>
                                        <p>{comment.body}</p>
                                        <div className="news-comment-actions">
                                            <button
                                                type="button"
                                                className={storedReaction === "like" ? "is-selected" : ""}
                                                onClick={() => handleReaction(comment._id, "like")}
                                                disabled={Boolean(storedReaction) || isReacting}
                                            >
                                                <FaRegThumbsUp aria-hidden="true" />
                                                <span>{comment.likes || 0}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className={storedReaction === "dislike" ? "is-selected" : ""}
                                                onClick={() => handleReaction(comment._id, "dislike")}
                                                disabled={Boolean(storedReaction) || isReacting}
                                            >
                                                <FaRegThumbsDown aria-hidden="true" />
                                                <span>{comment.dislikes || 0}</span>
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </aside>
            </section>
        </main>
    );
}
