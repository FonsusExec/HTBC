import React, {useState, useEffect} from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import "./blog.css";
import Loading from "../../components/Loading";

const fallbackBlogImage = require("../../assets/img/htbc-blog.jpg");

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return fallbackBlogImage;
    if (typeof imageUrl !== "string") return imageUrl;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

export default function Blog() {
    const [posts, setPosts] = useState([]); // Current page's posts
    const [totalPosts, setTotalPosts] = useState(0); // For pagination calc
    const [currentPage, setCurrentPage] = useState(1); // Track page
    const [searchTerm, setSearchTerm] = useState(""); // Search input
    const [loading, setLoading] = useState(true); // Spinner state
    const [categories, setCategories] = useState([]); // Unique categories
    const limit = 4; // Posts per page (match your grid)

    // Fetch posts for current page + total count
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const params = {page: currentPage, limit, type: "blog"};
                if (searchTerm) params.search = searchTerm; // Pass search to backend for server-side filtering

                const {data} = await axios.get("/api/blogs", {params});
                setPosts(data.posts || []); // Array of current page
                setTotalPosts(data.total || 0); // Total for pagination

                // Extract unique categories (from current page or refetch all if needed)
                const uniqueCategories = [...new Set((data.posts || []).map((post) => post.category).filter(Boolean))];
                setCategories(uniqueCategories);
            } catch (error) {
                console.error("Error fetching posts:", error);
                // Fallback: Static posts for page 1
                setPosts([
                    {_id: 1, title: "Why Attending Mass Regularly...", excerpt: "Support our mission...", imageUrl: require("../../assets/img/blog-htbc1.png"), category: "Faith Formation"},
                    {_id: 2, title: "Catholic Teachings on Forgiveness...", excerpt: "Helping maintain...", imageUrl: require("../../assets/img/blog-htbc2.png"), category: "Apologetics"},
                    {_id: 3, title: "Exploring the Seven Sacraments...", excerpt: "Learn how sacraments...", imageUrl: require("../../assets/img/blog-htbc3.png"), category: "Spirituality"},
                    {_id: 4, title: "How to Live Out Your Catholic Faith...", excerpt: "Growing spiritually...", imageUrl: require("../../assets/img/blog-htbc4.png"), category: "Faith Formation"},
                ]);
                setTotalPosts(11); // Assume 11 for fallback pagination
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [currentPage, searchTerm]); // Refetch on page/search change

    const totalPages = Math.ceil(totalPosts / limit);
    const handlePageChange = (page) => setCurrentPage(page);
    const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    // Render page buttons (simple: show first/last + dots if >5 pages)
    const renderPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <button key={i} className={`page-number ${currentPage === i ? "active" : ""}`} onClick={() => handlePageChange(i)}>
                        {i}
                    </button>,
                );
            }
        } else {
            pages.push(
                <button key={1} className={`page-number ${currentPage === 1 ? "active" : ""}`} onClick={() => handlePageChange(1)}>
                    1
                </button>,
            );
            if (currentPage > 3)
                pages.push(
                    <span key="dots1" className="dots">
                        …
                    </span>,
                );
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                pages.push(
                    <button key={i} className={`page-number ${currentPage === i ? "active" : ""}`} onClick={() => handlePageChange(i)}>
                        {i}
                    </button>,
                );
            }
            if (currentPage < totalPages - 2)
                pages.push(
                    <span key="dots2" className="dots">
                        …
                    </span>,
                );
            pages.push(
                <button key={totalPages} className={`page-number ${currentPage === totalPages ? "active" : ""}`} onClick={() => handlePageChange(totalPages)}>
                    {totalPages}
                </button>,
            );
        }
        return pages;
    };

    if (loading) {
        return (
            <div className="loading">
                <Loading />
            </div>
        );
    }

    return (
        <div className="blog-wrapper">
            {/* ---- Banner ---- */}
            <section className="blog-hero">
                <h1>Blog</h1>
            </section>

            {/* ---- Body Layout ---- */}
            <section className="blog-content-page">
                {/* Left: Featured Posts */}
                <div className="left-section">
                    <h2 className="featured-blog-title">Featured Posts</h2>
                    <div className="blog-grid">
                        {posts.map((post) => (
                            <Link key={post._id} to={`/blog/${post._id}`} className="blog-card">
                                <div className="blog-card-content">
                                    <img src={getImageSrc(post.imageUrl)} alt={post.title} />
                                    <h4>{post.title}</h4>
                                    <p>{post.excerpt}</p>
                                    <span className="category-tag">{post.category}</span>
                                </div>
                            </Link>
                        ))}
                        {posts.length === 0 && <p>No posts found. Try a different search or page.</p>}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <aside className="blog-sidebar">
                    {/* Search */}
                    <div className="blog-search">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>

                    {/* Categories */}
                    <div className="blog-categories">
                        <h3>Categories</h3>
                        <ul>
                            {categories.map((cat) => (
                                <li key={cat}>{cat}</li> // Add onClick for filter later
                            ))}
                        </ul>
                    </div>
                </aside>
            </section>

            {/* Pagination */}
            <div className="pagination-wrapper">
                <button className="page-btn prev" onClick={handlePrev} disabled={currentPage === 1}>
                    ‹ Previous
                </button>

                <div className="page-numbers">{renderPageNumbers()}</div>

                <button className="page-btn next" onClick={handleNext} disabled={currentPage === totalPages}>
                    Next ›
                </button>
            </div>
        </div>
    );
}
