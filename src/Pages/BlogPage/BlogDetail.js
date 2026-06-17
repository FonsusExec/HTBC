import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {Helmet} from "react-helmet-async";
import {Link, useNavigate, useParams} from "react-router-dom";
import {FaArrowLeft} from "react-icons/fa";
import Loading from "../../components/Loading";
import CommunityComments from "../../components/CommunityComments";
import {isDemoMode} from "../../demo/demoMode";
import {getDemoBlogById} from "../../demo/demoData";
import "./blogDetailPage.css";

const fallbackBlogImage = require("../../assets/img/htbc-blog.jpg");

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
            .replace(/<[^>]*>/g, " "),
    )
        .replace(/\s+/g, " ")
        .trim();
};

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return fallbackBlogImage;
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

const cleanHtml = (value = "") =>
    decodeHtmlEntities(value)
        .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
        .trim();

export default function BlogDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [commentCount, setCommentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "smooth"});
    }, [id]);

    useEffect(() => {
        let isActive = true;

        const fetchPost = async () => {
            try {
                setLoading(true);
                setError("");
                if (isDemoMode) {
                    const demoPost = getDemoBlogById(id);
                    if (!isActive) return;
                    setPost(demoPost || null);
                    setError(demoPost ? "" : "This demo blog post could not be found.");
                    return;
                }

                const {data} = await axios.get(`/api/blogs/${id}`, {params: {type: "blog"}});

                if (!isActive) return;
                setPost(data);
            } catch (err) {
                if (!isActive) return;
                setPost(null);
                setError(err.response?.data?.message || "Unable to load this blog post right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchPost();

        return () => {
            isActive = false;
        };
    }, [id]);

    const pageTitle = post?.seoTitle || post?.title || "Blog";
    const pageDescription = post?.metaDescription || post?.excerpt || stripHtml(post?.content || "");
    const articleHtml = useMemo(() => cleanHtml(post?.content || ""), [post]);

    if (loading) {
        return (
            <main className="public-blog-detail">
                <section className="public-blog-state">
                    <Loading message="Loading blog post..." />
                </section>
            </main>
        );
    }

    if (error || !post) {
        return (
            <main className="public-blog-detail">
                <section className="public-blog-state public-blog-state--error">
                    <h1>Blog post unavailable</h1>
                    <p>{error || "This blog post could not be found."}</p>
                    <button type="button" onClick={() => navigate("/blog")}>
                        <FaArrowLeft aria-hidden="true" />
                        Back to Blog
                    </button>
                </section>
            </main>
        );
    }

    return (
        <>
            <Helmet>
                <title>{pageTitle} | How To Be Catholic</title>
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={post.keywords?.join(", ") || ""} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:image" content={getImageSrc(post.imageUrl)} />
                <meta property="og:type" content="article" />
            </Helmet>

            <main className="public-blog-detail">
                <section className="public-blog-hero">
                    <img src={getImageSrc(post.imageUrl)} alt={post.title} />
                    <div className="public-blog-hero-overlay">
                        <Link to="/blog" className="public-blog-back">
                            <FaArrowLeft aria-hidden="true" />
                            Back to Blog
                        </Link>
                        {post.category && <span className="public-blog-category">{post.category}</span>}
                        <h1>{post.title}</h1>
                        <time>{formatDate(post.createdAt)}</time>
                    </div>
                </section>

                <article className="public-blog-article">
                    <div className="public-blog-meta">
                        {post.category && <span>{post.category}</span>}
                        <time>{formatDate(post.createdAt)}</time>
                        <span>
                            {commentCount} {commentCount === 1 ? "comment" : "comments"}
                        </span>
                    </div>

                    {articleHtml ? (
                        <div className="public-blog-body" dangerouslySetInnerHTML={{__html: articleHtml}} />
                    ) : (
                        <p className="public-blog-empty">No blog content is available yet.</p>
                    )}
                </article>

                <section className="public-blog-comments">
                    <CommunityComments contentType="blog" contentId={id} title="Discussion" onCountChange={setCommentCount} />
                </section>
            </main>
        </>
    );
}
