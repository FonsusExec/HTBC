import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./resourceList.css"; // Reuse the same styles
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

const ResourceList = () => {
    const navigate = useNavigate();

    const [resources, setResources] = useState([]);
    const [totalPosts, setTotalPosts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 10;

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: currentPage,
                limit,
            };

            const {data} = await axios.get("/api/resources", {params});

            setResources(data.resources || []);
            setTotalPosts(data.total || 0);
        } catch (err) {
            console.error("Error fetching resources:", err);
            setError("Failed to load resources. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [currentPage]);

    const totalPages = Math.ceil(totalPosts / limit);

    const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
    const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

    const handleDelete = (id) => {
        toast.promise(axios.delete(`/api/resources/${id}`), {
            pending: "Deleting resource...",
            success: {
                render() {
                    fetchResources();
                    return "Resource deleted successfully!";
                },
            },
            error: "Failed to delete resource.",
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

    const renderPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(
                    <button key={i} className={`page-number ${currentPage === i ? "active" : ""}`} onClick={() => setCurrentPage(i)}>
                        {i}
                    </button>,
                );
            }
        } else {
            pages.push(
                <button key={1} className={`page-number ${currentPage === 1 ? "active" : ""}`} onClick={() => setCurrentPage(1)}>
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
                    <button key={i} className={`page-number ${currentPage === i ? "active" : ""}`} onClick={() => setCurrentPage(i)}>
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
                <button key={totalPages} className={`page-number ${currentPage === totalPages ? "active" : ""}`} onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                </button>,
            );
        }
        return pages;
    };

    if (loading)
        return (
            <div className="loading">
                <Loading />
            </div>
        );
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="blog-page">
            <div className="blog-card">
                {/* Header */}
                <div className="blog-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2>Resources Management</h2>
                </div>

                {/* Create Button */}
                <div className="blog-toolbar">
                    <button className="create-btn" onClick={() => navigate("/admin/create-resource")}>
                        Create New Resource
                    </button>
                </div>

                {/* Table */}
                <div className="blog-table-wrapper">
                    <table className="blog-table">
                        <thead>
                            <tr>
                                <th>Resource Title</th>
                                <th>Type</th>
                                <th>Action</th>
                                <th>Date Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {resources.map((resource) => {
                                const isLink = resource.link && resource.link.trim() !== "";
                                const isPdf = resource.pdfUrl;

                                return (
                                    <tr key={resource._id}>
                                        <td>{resource.title}</td>

                                        <td>
                                            <span className={`type-badge ${isLink ? "link-badge" : isPdf ? "pdf-badge" : "none-badge"}`}>{isLink ? "🔗 Link" : isPdf ? "📄 PDF" : "—"}</span>
                                        </td>

                                        <td>
                                            {isLink ? (
                                                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-action-btn link-btn">
                                                    Open Link
                                                </a>
                                            ) : isPdf ? (
                                                <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer" className="resource-action-btn pdf-btn" download>
                                                    Download PDF
                                                </a>
                                            ) : (
                                                <span style={{color: "#999"}}>No file</span>
                                            )}
                                        </td>

                                        <td>{formatDate(resource.createdAt)}</td>

                                        <td>
                                            <div className="action-buttons">
                                                {/* <button className="view-btn" onClick={() => navigate(`/resources/${resource._id}`)}>
                                                    View
                                                </button> */}
                                                <button className="edit-btn" onClick={() => navigate(`/admin/edit-resource/${resource._id}`)}>
                                                    Edit
                                                </button>
                                                <button className="delete-btn" onClick={() => handleDelete(resource._id)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {resources.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{textAlign: "center"}}>
                                        No resources found yet.
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
};

export default ResourceList;
