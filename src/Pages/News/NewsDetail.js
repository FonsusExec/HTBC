import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {FaArrowLeft, FaExternalLinkAlt} from "react-icons/fa";
import Loading from "../../components/Loading";
import CommunityComments from "../../components/CommunityComments";
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

export default function NewsDetail() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [commentCount, setCommentCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "smooth"});
    }, [id]);

    useEffect(() => {
        let isActive = true;

        const fetchArticle = async () => {
            try {
                setLoading(true);
                setError("");

                const articleResponse = await axios.get(`/api/news/${id}`);
                if (!isActive) return;

                setArticle(articleResponse.data);
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
                        <span>
                            {commentCount} {commentCount === 1 ? "comment" : "comments"}
                        </span>
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

                <div className="news-detail-comments">
                    <CommunityComments contentType="news" contentId={id} title="Discussion" onCountChange={setCommentCount} />
                </div>
            </section>
        </main>
    );
}
