import {useCallback, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";
import "./impactStories.css";

const PAGE_SIZE = 5;

export default function ImpactStories() {
    const navigate = useNavigate();
    const [stories, setStories] = useState([]);
    const [totalStories, setTotalStories] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStory, setSelectedStory] = useState(null);
    const [storyToDelete, setStoryToDelete] = useState(null);
    const [deletingStoryId, setDeletingStoryId] = useState("");

    const fetchStories = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const {data} = await axios.get("/api/impact-stories", {
                params: {
                    page: currentPage,
                    limit: PAGE_SIZE,
                },
            });

            setStories(data.stories || []);
            setTotalStories(data.total || 0);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load impact stories.");
        } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    const totalPages = Math.ceil(totalStories / PAGE_SIZE);

    const handleDelete = (story) => {
        setStoryToDelete(story);
    };

    const executeDelete = async () => {
        if (!storyToDelete?._id) return;

        try {
            setDeletingStoryId(storyToDelete._id);
            await axios.delete(`/api/impact-stories/${storyToDelete._id}`);
            toast.success("Impact story deleted.");

            if (stories.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
            } else {
                fetchStories();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete impact story.");
        } finally {
            setDeletingStoryId("");
            setStoryToDelete(null);
        }
    };

    const goTo = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({length: totalPages}, (_, i) => i + 1);
        const pages = [1];
        if (currentPage > 3) pages.push("...");
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="is-page">
            <div className="is-container">
                <div className="is-topbar">
                    <div className="is-topbar-left">
                        <button className="is-back-btn" onClick={() => navigate(-1)}>
                            <span className="is-back-arrow">&#8249;</span> Back
                        </button>
                        <h1 className="is-title">Impact Stories</h1>
                    </div>
                    <button className="is-create-btn" onClick={() => navigate("/admin/create-impact-story")}>
                        Create Post
                    </button>
                </div>

                {loading ? (
                    <div className="is-loading">
                        <Loading message="Loading impact stories..." />
                    </div>
                ) : error ? (
                    <div className="is-empty">{error}</div>
                ) : (
                    <>
                        <div className="is-table-wrapper">
                            <table className="is-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Post title</th>
                                        <th>Date created</th>
                                        <th>Last modified</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stories.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="is-empty">
                                                No impact stories found.
                                            </td>
                                        </tr>
                                    ) : (
                                        stories.map((story) => (
                                            <tr key={story._id} className="is-row">
                                                <td className="is-cell">
                                                    <img className="is-thumb" src={story.imageUrl} alt={story.title} />
                                                </td>
                                                <td className="is-cell is-cell--title">{story.title}</td>
                                                <td className="is-cell">{formatDate(story.createdAt)}</td>
                                                <td className="is-cell is-cell--muted">{formatDate(story.updatedAt)}</td>
                                                <td className="is-cell">
                                                    <div className="is-actions">
                                                        <button className="is-action-btn" onClick={() => setSelectedStory(story)}>
                                                            View
                                                        </button>
                                                        <button className="is-action-btn" onClick={() => navigate(`/admin/edit-impact-story/${story._id}`)}>
                                                            Edit
                                                        </button>
                                                        <button className="is-action-btn is-action-btn--delete" onClick={() => handleDelete(story)}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="is-pagination">
                                <span className="is-page-info">
                                    Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, totalStories)} of {totalStories}
                                </span>
                                <div className="is-page-controls">
                                    <button className="is-page-btn is-page-btn--nav" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>
                                        &#8249;
                                    </button>
                                    {getPageNumbers().map((p, i) =>
                                        p === "..." ? (
                                            <span key={`ellipsis-${i}`} className="is-page-ellipsis">
                                                ...
                                            </span>
                                        ) : (
                                            <button key={p} className={`is-page-btn ${currentPage === p ? "is-page-btn--active" : ""}`} onClick={() => goTo(p)}>
                                                {p}
                                            </button>
                                        ),
                                    )}
                                    <button className="is-page-btn is-page-btn--nav" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>
                                        &#8250;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedStory && (
                <div className="is-modal-overlay" onClick={() => setSelectedStory(null)}>
                    <div className="is-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="is-modal-close" onClick={() => setSelectedStory(null)}>
                            x
                        </button>
                        <img className="is-modal-image" src={selectedStory.imageUrl} alt={selectedStory.title} />
                        <h2>{selectedStory.title}</h2>
                        <p>{selectedStory.description}</p>
                    </div>
                </div>
            )}

            {storyToDelete && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">
                        <div className="confirm-modal__icon">!</div>
                        <h3 className="confirm-modal__title">Confirm Deletion</h3>
                        <p className="confirm-modal__body">
                            Are you sure you want to delete <strong>{storyToDelete.title}</strong>?
                            <br />
                            This action cannot be undone.
                        </p>
                        <div className="confirm-modal__actions">
                            <button className="confirm-btn confirm-btn--cancel" onClick={() => setStoryToDelete(null)} disabled={Boolean(deletingStoryId)}>
                                Cancel
                            </button>
                            <button className="confirm-btn confirm-btn--delete" onClick={executeDelete} disabled={Boolean(deletingStoryId)}>
                                {deletingStoryId ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
