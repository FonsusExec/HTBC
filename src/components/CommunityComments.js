import React, {useEffect, useState} from "react";
import axios from "axios";
import {FaRegCommentDots, FaRegThumbsDown, FaRegThumbsUp, FaReply} from "react-icons/fa";
import {useAuth} from "../AuthContext";
import Loading from "./Loading";
import "./communityComments.css";

const getReactionKey = (commentId) => `htbc-community-comment-reaction-${commentId}`;

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
        // Backend reaction still saves when local storage is unavailable.
    }
};

const countComments = (comments = []) =>
    comments.reduce((total, comment) => total + 1 + countComments(comment.replies || []), 0);

const updateCommentTree = (comments, updatedComment) =>
    comments.map((comment) => {
        if (comment._id === updatedComment._id) {
            return {...comment, ...updatedComment, replies: comment.replies || []};
        }

        return {...comment, replies: updateCommentTree(comment.replies || [], updatedComment)};
    });

export default function CommunityComments({contentType, contentId, title = "Discussion", onCountChange}) {
    const {user} = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({name: "", email: "", body: ""});
    const [replyBody, setReplyBody] = useState("");
    const [replyTo, setReplyTo] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [reactingId, setReactingId] = useState("");
    const [reactedComments, setReactedComments] = useState({});

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

        const loadComments = async () => {
            try {
                setLoading(true);
                setError("");

                const {data} = await axios.get("/api/community/comments", {
                    params: {contentType, contentId},
                });

                if (!isActive) return;

                const nextComments = data.comments || [];
                const nextReactions = {};

                const collectReactions = (items = []) => {
                    items.forEach((comment) => {
                        const reaction = getStoredReaction(comment._id);
                        if (reaction) nextReactions[comment._id] = reaction;
                        collectReactions(comment.replies || []);
                    });
                };

                collectReactions(nextComments);
                setComments(nextComments);
                setReactedComments(nextReactions);
                onCountChange?.(countComments(nextComments));
            } catch (err) {
                if (!isActive) return;
                setError(err.response?.data?.message || "Unable to load comments right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        if (contentType && contentId) loadComments();

        return () => {
            isActive = false;
        };
    }, [contentType, contentId, onCountChange]);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setForm((currentForm) => ({...currentForm, [name]: value}));
        setError("");
        setMessage("");
    };

    const submitComment = async ({parentId = "", body}) => {
        const name = form.name.trim();
        const email = form.email.trim();
        const commentBody = body.trim();

        if (!name || !commentBody) {
            setError("Please enter your name and comment before posting.");
            return;
        }

        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            await axios.post("/api/community/comments", {
                contentType,
                contentId,
                parentId,
                name,
                email,
                body: commentBody,
            });

            if (parentId) {
                setReplyBody("");
                setReplyTo("");
            } else {
                setForm((currentForm) => ({...currentForm, body: ""}));
            }

            setMessage("Your comment was submitted and is awaiting approval.");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to post your comment right now.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        submitComment({body: form.body});
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        submitComment({parentId, body: replyBody});
    };

    const handleReaction = async (commentId, reaction) => {
        if (reactedComments[commentId]) return;

        try {
            setReactingId(`${commentId}-${reaction}`);
            setError("");

            const {data} = await axios.patch(`/api/community/comments/${commentId}/reaction`, {reaction});
            setComments((currentComments) => updateCommentTree(currentComments, data.comment));
            setReactedComments((currentReactions) => ({...currentReactions, [commentId]: reaction}));
            saveStoredReaction(commentId, reaction);
        } catch (err) {
            setError(err.response?.data?.message || "Unable to save your reaction right now.");
        } finally {
            setReactingId("");
        }
    };

    const totalComments = countComments(comments);

    const renderComment = (comment, depth = 0) => {
        const storedReaction = reactedComments[comment._id];
        const isReacting = reactingId.startsWith(comment._id);
        const replies = comment.replies || [];

        return (
            <article className={`community-comment-card ${depth > 0 ? "community-comment-card--reply" : ""}`} key={comment._id}>
                <div className="community-comment-card-header">
                    <div>
                        <h3>{comment.name}</h3>
                        <time>{new Date(comment.createdAt).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"})}</time>
                    </div>
                    <button className="community-comment-reply-trigger" type="button" onClick={() => setReplyTo(replyTo === comment._id ? "" : comment._id)}>
                        <FaReply aria-hidden="true" />
                        Reply
                    </button>
                </div>

                <p>{comment.body}</p>

                <div className="community-comment-actions">
                    <button type="button" className={storedReaction === "like" ? "is-selected" : ""} disabled={Boolean(storedReaction) || isReacting} onClick={() => handleReaction(comment._id, "like")}>
                        <FaRegThumbsUp aria-hidden="true" />
                        <span>{comment.likes || 0}</span>
                    </button>
                    <button type="button" className={storedReaction === "dislike" ? "is-selected" : ""} disabled={Boolean(storedReaction) || isReacting} onClick={() => handleReaction(comment._id, "dislike")}>
                        <FaRegThumbsDown aria-hidden="true" />
                        <span>{comment.dislikes || 0}</span>
                    </button>
                </div>

                {replyTo === comment._id && (
                    <form className="community-reply-form" onSubmit={(e) => handleReplySubmit(e, comment._id)}>
                        <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder={`Reply to ${comment.name}`} rows="3" />
                        <div>
                            <button type="button" className="community-comment-secondary" onClick={() => setReplyTo("")}>
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}>
                                {submitting ? "Submitting..." : "Submit Reply"}
                            </button>
                        </div>
                    </form>
                )}

                {replies.length > 0 && <div className="community-comment-replies">{replies.map((reply) => renderComment(reply, depth + 1))}</div>}
            </article>
        );
    };

    return (
        <aside className="community-comments" aria-label={`${title} comments`}>
            <div className="community-comments-heading">
                <div>
                    <span>{title}</span>
                    <h2>Comments</h2>
                </div>
                <strong>{totalComments}</strong>
            </div>

            <form className="community-comment-form" onSubmit={handleCommentSubmit}>
                <div className="community-comment-form-row">
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
                    <textarea name="body" value={form.body} onChange={handleInputChange} placeholder="Share your thoughts" rows="5" />
                </label>

                {error && <p className="community-comment-message community-comment-message--error">{error}</p>}
                {message && <p className="community-comment-message community-comment-message--success">{message}</p>}

                <button type="submit" disabled={submitting}>
                    <FaRegCommentDots aria-hidden="true" />
                    {submitting ? "Submitting..." : "Post Comment"}
                </button>
            </form>

            <div className="community-comment-list">
                {loading ? (
                    <Loading message="Loading comments..." />
                ) : comments.length === 0 ? (
                    <div className="community-comment-empty">
                        <FaRegCommentDots aria-hidden="true" />
                        <p>Be the first to start the conversation.</p>
                    </div>
                ) : (
                    comments.map((comment) => renderComment(comment))
                )}
            </div>
        </aside>
    );
}
