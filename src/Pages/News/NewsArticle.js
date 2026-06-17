import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Loading from "../../components/Loading";
import {isDemoMode} from "../../demo/demoMode";
import {demoNews} from "../../demo/demoData";
import "./newsArticle.css";

const fallbackImage = require("../../assets/img/htbc-new1.png");
const PAGE_LIMIT = 9;

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
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const formatDate = (dateValue) => {
    if (!dateValue) return "Recent";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Recent";

    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getSummary = (article) => article.description || article.metaDescription || stripHtml(article.content || "") || "Read the latest update from How To Be Catholic.";

const getPaginationPages = (currentPage, totalPages) => {
    if (totalPages <= 5) {
        return Array.from({length: totalPages}, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("start-dots");

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    if (end < totalPages - 1) pages.push("end-dots");

    pages.push(totalPages);
    return pages;
};

export default function News() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [featuredArticle, setFeaturedArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalArticles, setTotalArticles] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setCurrentPage(1);
        }, 350);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        let isActive = true;

        const fetchNews = async () => {
            try {
                setLoading(true);
                setError("");

                if (isDemoMode) {
                    const normalizedSearch = debouncedSearch.toLowerCase();
                    const filteredNews = demoNews
                        .filter((article) => !normalizedSearch || article.title.toLowerCase().includes(normalizedSearch) || getSummary(article).toLowerCase().includes(normalizedSearch))
                        .sort((a, b) => {
                            const first = new Date(a.pubDate || a.createdAt || 0);
                            const second = new Date(b.pubDate || b.createdAt || 0);
                            return sortOrder === "oldest" ? first - second : second - first;
                        });
                    const start = (currentPage - 1) * PAGE_LIMIT;
                    const nextArticles = filteredNews.slice(start, start + PAGE_LIMIT);

                    if (!isActive) return;
                    setFeaturedArticle(nextArticles[0] || null);
                    setArticles(nextArticles);
                    setTotalArticles(filteredNews.length);
                    return;
                }

                const {data} = await axios.get("/api/news", {
                    params: {
                        page: currentPage,
                        limit: PAGE_LIMIT,
                        search: debouncedSearch,
                        sort: sortOrder,
                    },
                });

                if (!isActive) return;

                const nextArticles = data.articles || [];
                setFeaturedArticle(nextArticles[0] || null);
                setArticles(nextArticles);
                setTotalArticles(data.total || 0);
            } catch (err) {
                if (!isActive) return;
                setArticles([]);
                setFeaturedArticle(null);
                setTotalArticles(0);
                setError(err.response?.data?.message || "Unable to load news right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchNews();

        return () => {
            isActive = false;
        };
    }, [currentPage, debouncedSearch, sortOrder, refreshKey]);

    const articleCards = useMemo(() => articles.slice(featuredArticle ? 1 : 0), [articles, featuredArticle]);
    const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_LIMIT));
    const paginationPages = useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages]);

    const handleArticleOpen = (article) => {
        if (article?._id) navigate(`/news/${article._id}`);
    };

    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="news-page">
            <section className="news-banner">
                <div className="news-banner-content">
                    <span>HTBC Newsroom</span>
                    <h1>News</h1>
                </div>
            </section>

            <main className="news-container">
                <section className="news-controls" aria-label="News controls">
                    <div>
                        <p className="news-eyebrow">Latest Updates</p>
                        <h2>Church news and community stories</h2>
                    </div>

                    <div className="news-control-fields">
                        <label className="news-search">
                            <span>Search</span>
                            <input type="search" placeholder="Search news" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </label>

                        <label className="news-sort">
                            <span>Sort</span>
                            <select value={sortOrder} onChange={handleSortChange}>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </label>
                    </div>
                </section>

                {loading ? (
                    <section className="news-state">
                        <Loading message="Loading news..." />
                    </section>
                ) : error ? (
                    <section className="news-state news-state--error">
                        <p>{error}</p>
                        <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
                            Retry
                        </button>
                    </section>
                ) : articles.length === 0 ? (
                    <section className="news-state">
                        <h3>No news found</h3>
                        <p>Try a different search term or check back soon.</p>
                    </section>
                ) : (
                    <>
                        {featuredArticle && (
                            <section className="news-featured">
                                <div className="news-featured-image">
                                    <img src={getImageSrc(featuredArticle.imageUrl)} alt={featuredArticle.title} />
                                </div>
                                <div className="news-featured-copy">
                                    <span className="news-source">{featuredArticle.source || "How To Be Catholic"}</span>
                                    <h2>{featuredArticle.title}</h2>
                                    <p>{getSummary(featuredArticle)}</p>
                                    <div className="news-meta">
                                        <time>{formatDate(featuredArticle.pubDate || featuredArticle.createdAt)}</time>
                                    </div>
                                    <button type="button" className="news-read-btn" onClick={() => handleArticleOpen(featuredArticle)}>
                                        Read More
                                    </button>
                                </div>
                            </section>
                        )}

                        <section className="news-list-section">
                            <div className="news-section-heading">
                                <h3>More News</h3>
                                <span>{totalArticles} articles</span>
                            </div>

                            <div className="news-grid">
                                {articleCards.map((article) => (
                                    <article className="news-card" key={article._id}>
                                        <img src={getImageSrc(article.imageUrl)} alt={article.title} />
                                        <div className="news-card-body">
                                            <span className="news-source">{article.source || "How To Be Catholic"}</span>
                                            <h4>{article.title}</h4>
                                            <p>{getSummary(article)}</p>
                                            <div className="news-card-footer">
                                                <time>{formatDate(article.pubDate || article.createdAt)}</time>
                                                <button type="button" onClick={() => handleArticleOpen(article)}>
                                                    Read
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>

                        {totalPages > 1 && (
                            <div className="news-pagination">
                                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                                    Previous
                                </button>

                                <div className="news-page-numbers" aria-label="News pagination pages">
                                    {paginationPages.map((page) =>
                                        typeof page === "number" ? (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`news-page-number ${currentPage === page ? "is-active" : ""}`}
                                                onClick={() => setCurrentPage(page)}
                                                aria-current={currentPage === page ? "page" : undefined}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span key={page} className="news-page-dots">
                                                ...
                                            </span>
                                        ),
                                    )}
                                </div>

                                <span className="news-pagination__status">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

        </div>
    );
}
