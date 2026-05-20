import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./blogList.css";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

export default function BlogList({contentType = "blog"}) {
    const navigate = useNavigate();
    const [blogs, setBlogs] = useState([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;
    const isNews = contentType === "news";

    const fetchContent = async () => {
        try {
            setLoading(true);
            setError(null);

            const endpoint = isNews ? "/api/news" : "/api/blogs";
            const status = filter === "all" ? "all" : filter;
            const params = isNews ? {page: currentPage, limit, status} : {page: currentPage, limit, type: "blog", status};
            const {data} = await axios.get(endpoint, {params});

            setBlogs(isNews ? data.articles || [] : data.posts || []);
            setTotalPosts(data.total || 0);
        } catch (err) {
            console.error(`Error fetching ${contentType}:`, err);
            setError(`Failed to load ${contentType} content.`);
        } finally {
            setLoading(false);
        }
    };

    // Reset state & fetch when contentType changes
    useEffect(() => {
        // Critical reset when switching between blog/news
        setBlogs([]);
        setTotalPosts(0);
        setCurrentPage(1);
        setFilter("all");
        setError(null);

        fetchContent();
    }, [contentType]);

    // Re-fetch when page or filter changes
    useEffect(() => {
        fetchContent();
    }, [currentPage, filter]);

    const totalPages = Math.ceil(totalPosts / limit);

    const handlePageChange = (page) => setCurrentPage(page);
    const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const handleFilterChange = (nextFilter) => {
        setFilter(nextFilter);
        setCurrentPage(1);
    };

    const handleDelete = (id) => {
        const endpoint = isNews ? `/api/news/${id}` : `/api/blogs/${id}`;

        toast.promise(axios.delete(endpoint), {
            pending: "Deleting...",
            success: {
                render() {
                    fetchContent();
                    return `${isNews ? "News" : "Blog"} deleted successfully!`;
                },
            },
            error: "Failed to delete.",
        });
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getStatusLabel = (status) => {
        const statusValue = status || "active";
        return statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
    };

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

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="blog-page">
            <div className="blog-card">
                {/* Debug panel – remove after testing */}
                {/* <div style={{background: "#e0ffe0", padding: "10px", margin: "10px 0", borderRadius: "4px"}}>
                    Debug: Type = {contentType} | Filter = {filter} | Loaded = {blogs.length} items
                </div> */}

                {/* Header */}
                <div className="blog-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2>{isNews ? "News Management" : "Blog Management"}</h2>
                </div>

                {/* Filters + Action */}
                <div className="blog-toolbar">
                    <div className="blog-filters">
                        <button
                            className={`filter-btn ${filter === "all" ? "active" : ""}`}
                            onClick={() => handleFilterChange("all")}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${filter === "active" ? "active" : ""}`}
                            onClick={() => handleFilterChange("active")}
                        >
                            Active
                        </button>
                        <button
                            className={`filter-btn ${filter === "draft" ? "active" : ""}`}
                            onClick={() => handleFilterChange("draft")}
                        >
                            Draft
                        </button>
                        <button
                            className={`filter-btn ${filter === "archived" ? "active" : ""}`}
                            onClick={() => handleFilterChange("archived")}
                        >
                            Archived
                        </button>
                    </div>

                    <button className="create-btn" onClick={() => navigate(`/admin/create-${contentType}`)}>
                        Create {isNews ? "News Article" : "Blog Post"}
                    </button>
                </div>

                {/* Table */}
                <div className="blog-table-wrapper">
                    <table className="blog-table">
                        <thead>
                            <tr>
                                <th>Post title</th>
                                <th>Status</th>
                                <th>Date created</th>
                                <th>Last modified</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {blogs.map((blog) => (
                                <tr key={blog._id || blog.id}>
                                    <td>{blog.title}</td>
                                    <td>
                                        <span className={`status-badge status-badge--${blog.status || "active"}`}>{getStatusLabel(blog.status)}</span>
                                    </td>
                                    <td>{formatDate(blog.createdAt)}</td>
                                    <td>{formatDate(blog.updatedAt || blog.createdAt)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="view-btn" onClick={() => navigate(`/admin/view-${contentType}/${blog._id || blog.id}`)}>
                                                View
                                            </button>
                                            <button className="edit-btn" onClick={() => navigate(`/admin/edit-${contentType}/${blog._id}`)}>
                                                Edit
                                            </button>
                                            <button className="delete-btn" onClick={() => handleDelete(blog._id || blog.id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {blogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{textAlign: "center"}}>
                                        No {contentType === "news" ? "news" : "blog"} found for "{filter}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination-wrapper">
                        <button className="page-btn prev" onClick={handlePrev} disabled={currentPage === 1}>
                            ‹ Previous
                        </button>

                        <div className="page-numbers">{renderPageNumbers()}</div>

                        <button className="page-btn next" onClick={handleNext} disabled={currentPage === totalPages}>
                            Next ›
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
