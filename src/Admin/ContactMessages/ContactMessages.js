import {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import {FaEnvelope, FaEye, FaInbox, FaSearch, FaTrash} from "react-icons/fa";
import Loading from "../../components/Loading";
import {getAuthHeaders} from "../../utils/authHeaders";
import "./contactMessages.css";

const PAGE_SIZE = 10;

const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const truncateText = (value = "", length = 82) => {
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length > length ? `${text.slice(0, length)}...` : text;
};

export default function ContactMessages() {
    const [messages, setMessages] = useState([]);
    const [totalMessages, setTotalMessages] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [newsletterFilter, setNewsletterFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [messageToDelete, setMessageToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState("");

    const authConfig = {headers: getAuthHeaders()};
    const totalPages = Math.max(1, Math.ceil(totalMessages / PAGE_SIZE));

    const fetchMessages = useCallback(async () => {
        try {
            setLoading(true);
            const {data} = await axios.get("/api/contact-messages", {
                ...authConfig,
                params: {
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: searchTerm.trim(),
                    status: statusFilter,
                    newsletter: newsletterFilter,
                },
            });

            setMessages(data.messages || []);
            setTotalMessages(data.total || 0);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to load contact messages");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm, statusFilter, newsletterFilter]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const openMessage = async (message) => {
        try {
            const {data} = await axios.get(`/api/contact-messages/${message._id}`, authConfig);
            setSelectedMessage(data.contactMessage);
            fetchMessages();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to open contact message");
        }
    };

    const executeDelete = async () => {
        if (!messageToDelete?._id) return;

        try {
            setDeletingId(messageToDelete._id);
            await axios.delete(`/api/contact-messages/${messageToDelete._id}`, authConfig);
            toast.success("Contact message deleted");
            setMessageToDelete(null);

            if (messages.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
            } else {
                fetchMessages();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to delete contact message");
        } finally {
            setDeletingId("");
        }
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({length: totalPages}, (_, index) => index + 1);

        const pages = [1];
        if (currentPage > 3) pages.push("...");

        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
            pages.push(page);
        }

        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setNewsletterFilter("");
        setCurrentPage(1);
    };

    const showingStart = totalMessages === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const showingEnd = Math.min(currentPage * PAGE_SIZE, totalMessages);

    return (
        <div className="contact-admin-page">
            <div className="contact-admin-card">
                <div className="contact-admin-header">
                    <div>
                        <p className="contact-admin-eyebrow">Community Management</p>
                        <h1>Contact Messages</h1>
                        <p>Review messages submitted through the public footer contact form.</p>
                    </div>
                    <span className="contact-admin-icon">
                        <FaEnvelope />
                    </span>
                </div>

                <div className="contact-admin-stats">
                    <div className="contact-admin-stat">
                        <span>
                            <FaInbox />
                        </span>
                        <strong>{totalMessages}</strong>
                        <small>Total messages</small>
                    </div>
                    <div className="contact-admin-stat">
                        <span>
                            <FaEnvelope />
                        </span>
                        <strong>{unreadCount}</strong>
                        <small>New messages</small>
                    </div>
                </div>

                <div className="contact-admin-toolbar">
                    <label className="contact-admin-search">
                        <span>
                            <FaSearch />
                        </span>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            placeholder="Search name, email or message"
                        />
                    </label>

                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All status</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="archived">Archived</option>
                    </select>

                    <select
                        value={newsletterFilter}
                        onChange={(e) => {
                            setNewsletterFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">Newsletter: all</option>
                        <option value="true">Newsletter: yes</option>
                        <option value="false">Newsletter: no</option>
                    </select>

                    <button type="button" onClick={resetFilters}>
                        Reset
                    </button>
                </div>

                {loading ? (
                    <div className="contact-admin-loading">
                        <Loading message="Loading contact messages..." />
                    </div>
                ) : (
                    <>
                        <div className="contact-admin-table-wrapper">
                            <table className="contact-admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Message</th>
                                        <th>Newsletter</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="contact-admin-empty">
                                                No contact messages found.
                                            </td>
                                        </tr>
                                    ) : (
                                        messages.map((message) => (
                                            <tr key={message._id}>
                                                <td className="contact-admin-name">{message.fullName}</td>
                                                <td>
                                                    <a href={`mailto:${message.email}`}>{message.email}</a>
                                                </td>
                                                <td className="contact-admin-message">{truncateText(message.message)}</td>
                                                <td>{message.newsletter ? "Yes" : "No"}</td>
                                                <td>
                                                    <span className={`contact-admin-status contact-admin-status--${message.status}`}>{message.status}</span>
                                                </td>
                                                <td>{formatDate(message.createdAt)}</td>
                                                <td>
                                                    <div className="contact-admin-actions">
                                                        <button type="button" onClick={() => openMessage(message)}>
                                                            <FaEye />
                                                            View
                                                        </button>
                                                        <button type="button" className="contact-admin-action-danger" onClick={() => setMessageToDelete(message)}>
                                                            <FaTrash />
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
                            <div className="contact-admin-pagination">
                                <span>
                                    Showing {showingStart}-{showingEnd} of {totalMessages}
                                </span>
                                <div className="contact-admin-page-controls">
                                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                        &#8249;
                                    </button>
                                    {getPageNumbers().map((page, index) =>
                                        page === "..." ? (
                                            <span key={`dots-${index}`} className="contact-admin-page-dots">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                className={currentPage === page ? "is-active" : ""}
                                                onClick={() => goToPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ),
                                    )}
                                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                        &#8250;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedMessage && (
                <div className="contact-admin-modal-overlay" onClick={() => setSelectedMessage(null)}>
                    <div className="contact-admin-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="contact-admin-modal-close" onClick={() => setSelectedMessage(null)}>
                            x
                        </button>
                        <span className={`contact-admin-status contact-admin-status--${selectedMessage.status}`}>{selectedMessage.status}</span>
                        <h2>{selectedMessage.fullName}</h2>
                        <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                        <div className="contact-admin-modal-meta">
                            <span>{formatDate(selectedMessage.createdAt)}</span>
                            <span>Newsletter: {selectedMessage.newsletter ? "Yes" : "No"}</span>
                        </div>
                        <p>{selectedMessage.message}</p>
                    </div>
                </div>
            )}

            {messageToDelete && (
                <div className="contact-confirm-overlay">
                    <div className="contact-confirm-modal">
                        <div className="contact-confirm-modal__icon">!</div>
                        <h3>Confirm Deletion</h3>
                        <p>
                            Are you sure you want to delete the message from <strong>{messageToDelete.fullName}</strong>?
                            <br />
                            This action cannot be undone.
                        </p>
                        <div className="contact-confirm-actions">
                            <button type="button" onClick={() => setMessageToDelete(null)} disabled={Boolean(deletingId)}>
                                Cancel
                            </button>
                            <button type="button" className="contact-confirm-delete" onClick={executeDelete} disabled={Boolean(deletingId)}>
                                {deletingId ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
