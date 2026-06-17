import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Loading from "../../components/Loading";
import {isDemoMode} from "../../demo/demoMode";
import {demoBlogs} from "../../demo/demoData";
import "./blog.css";

const fallbackBlogImage = require("../../assets/img/htbc-blog.jpg");
const PAGE_LIMIT = 7;

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
    if (typeof imageUrl !== "string") return imageUrl;
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

const getSummary = (post) =>
    stripHtml(post?.excerpt || post?.metaDescription || post?.content || "") || "Read the latest reflection from How To Be Catholic.";

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

export default function Blog() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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

        const fetchPosts = async () => {
            try {
                setLoading(true);
                setError("");

                if (isDemoMode) {
                    const normalizedSearch = debouncedSearch.toLowerCase();
                    const filteredPosts = demoBlogs.filter((post) => !normalizedSearch || post.title.toLowerCase().includes(normalizedSearch) || getSummary(post).toLowerCase().includes(normalizedSearch));
                    const start = (currentPage - 1) * PAGE_LIMIT;
                    if (!isActive) return;
                    setPosts(filteredPosts.slice(start, start + PAGE_LIMIT));
                    setTotalPosts(filteredPosts.length);
                    return;
                }

                const {data} = await axios.get("/api/blogs", {
                    params: {
                        page: currentPage,
                        limit: PAGE_LIMIT,
                        type: "blog",
                        search: debouncedSearch,
                    },
                });

                if (!isActive) return;
                setPosts(data.posts || []);
                setTotalPosts(data.total || 0);
            } catch (err) {
                if (!isActive) return;
                setPosts([]);
                setTotalPosts(0);
                setError(err.response?.data?.message || "Unable to load blog posts right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchPosts();

        return () => {
            isActive = false;
        };
    }, [currentPage, debouncedSearch, refreshKey]);

    const featuredPost = posts[0] || null;
    const postCards = useMemo(() => posts.slice(featuredPost ? 1 : 0), [posts, featuredPost]);
    const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_LIMIT));

    const handlePostOpen = (post) => {
        if (post?._id) navigate(`/blog/${post._id}`);
    };

    const paginationPages = useMemo(() => getPaginationPages(currentPage, totalPages), [currentPage, totalPages]);

    return (
        <div className="public-blog-page">
            <section className="public-blog-banner">
                <div className="public-blog-banner-content">
                    <span>HTBC Reflections</span>
                    <h1>Blog</h1>
                </div>
            </section>

            <main className="public-blog-container">
                <section className="public-blog-controls" aria-label="Blog controls">
                    <div>
                        <p className="public-blog-eyebrow">Latest Reflections</p>
                        <h2>Faith, formation, and Catholic living</h2>
                    </div>

                    <label className="public-blog-search">
                        <span>Search</span>
                        <input type="search" placeholder="Search blog posts" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </label>
                </section>

                {loading ? (
                    <section className="public-blog-state">
                        <Loading message="Loading blog posts..." />
                    </section>
                ) : error ? (
                    <section className="public-blog-state public-blog-state--error">
                        <p>{error}</p>
                        <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>
                            Retry
                        </button>
                    </section>
                ) : posts.length === 0 ? (
                    <section className="public-blog-state">
                        <h3>No blog posts found</h3>
                        <p>Try a different search term or check back soon.</p>
                    </section>
                ) : (
                    <>
                        {featuredPost && (
                            <section className="public-blog-featured">
                                <div className="public-blog-featured-image">
                                    <img src={getImageSrc(featuredPost.imageUrl)} alt={featuredPost.title} />
                                </div>
                                <div className="public-blog-featured-copy">
                                    <span className="public-blog-category-label">{featuredPost.category || "Reflection"}</span>
                                    <h2>{featuredPost.title}</h2>
                                    <p>{getSummary(featuredPost)}</p>
                                    <div className="public-blog-list-meta">
                                        <time>{formatDate(featuredPost.createdAt)}</time>
                                    </div>
                                    <button type="button" className="public-blog-read-btn" onClick={() => handlePostOpen(featuredPost)}>
                                        Read More
                                    </button>
                                </div>
                            </section>
                        )}

                        {postCards.length > 0 && (
                            <section className="public-blog-list-section">
                                <div className="public-blog-section-heading">
                                    <h3>More Blog Posts</h3>
                                    <span>{totalPosts} posts</span>
                                </div>

                                <div className="public-blog-grid">
                                    {postCards.map((post) => (
                                        <article className="public-blog-card" key={post._id}>
                                            <img src={getImageSrc(post.imageUrl)} alt={post.title} />
                                            <div className="public-blog-card-body">
                                                <span className="public-blog-category-label">{post.category || "Reflection"}</span>
                                                <h4>{post.title}</h4>
                                                <p>{getSummary(post)}</p>
                                                <div className="public-blog-card-footer">
                                                    <time>{formatDate(post.createdAt)}</time>
                                                    <button type="button" onClick={() => handlePostOpen(post)}>
                                                        Read
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}

                        {totalPages > 1 && (
                            <div className="public-blog-pagination">
                                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                                    Previous
                                </button>

                                <div className="public-blog-page-numbers" aria-label="Blog pagination pages">
                                    {paginationPages.map((page) =>
                                        typeof page === "number" ? (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`public-blog-page-number ${currentPage === page ? "is-active" : ""}`}
                                                onClick={() => setCurrentPage(page)}
                                                aria-current={currentPage === page ? "page" : undefined}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span key={page} className="public-blog-page-dots">
                                                ...
                                            </span>
                                        ),
                                    )}
                                </div>

                                <span className="public-blog-pagination__status">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                >
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
