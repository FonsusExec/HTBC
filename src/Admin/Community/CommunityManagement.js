import React, {useEffect, useState} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import {FaCalendarAlt, FaCheck, FaComments, FaEdit, FaTimes, FaTrash, FaUsers} from "react-icons/fa";
import Loading from "../../components/Loading";
import {getAuthHeaders} from "../../utils/authHeaders";
import "./communityManagement.css";

const emptyEventForm = {
    title: "",
    description: "",
    eventType: "Community",
    startDate: "",
    endDate: "",
    location: "",
    isOnline: false,
    onlineUrl: "",
    capacity: "",
    status: "active",
};

const formatDateTime = (dateValue) => {
    if (!dateValue) return "Not set";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Not set";
    return date.toLocaleString("en-US", {month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"});
};

const toDateTimeInputValue = (dateValue) => {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
};

export default function CommunityManagement() {
    const [comments, setComments] = useState([]);
    const [events, setEvents] = useState([]);
    const [commentStatus, setCommentStatus] = useState("pending");
    const [eventForm, setEventForm] = useState(emptyEventForm);
    const [editingEventId, setEditingEventId] = useState("");
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [savingEvent, setSavingEvent] = useState(false);

    const authConfig = {headers: getAuthHeaders()};

    const fetchComments = async () => {
        try {
            setLoadingComments(true);
            const {data} = await axios.get("/api/community/admin/comments", {
                ...authConfig,
                params: {status: commentStatus},
            });
            setComments(data.comments || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to load comments");
        } finally {
            setLoadingComments(false);
        }
    };

    const fetchEvents = async () => {
        try {
            setLoadingEvents(true);
            const {data} = await axios.get("/api/community/events", {
                ...authConfig,
                params: {status: "all", sort: "asc"},
            });
            setEvents(data.events || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to load events");
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [commentStatus]);

    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleEventInputChange = (e) => {
        const {name, value, type, checked} = e.target;
        setEventForm((currentForm) => ({...currentForm, [name]: type === "checkbox" ? checked : value}));
    };

    const resetEventForm = () => {
        setEventForm(emptyEventForm);
        setEditingEventId("");
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();

        if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.startDate) {
            toast.warning("Title, description and start date are required");
            return;
        }

        const payload = {
            ...eventForm,
            capacity: eventForm.capacity || 0,
        };

        try {
            setSavingEvent(true);
            if (editingEventId) {
                await axios.put(`/api/community/events/${editingEventId}`, payload, authConfig);
                toast.success("Event updated");
            } else {
                await axios.post("/api/community/events", payload, authConfig);
                toast.success("Event created");
            }

            resetEventForm();
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to save event");
        } finally {
            setSavingEvent(false);
        }
    };

    const editEvent = (event) => {
        setEditingEventId(event._id);
        setEventForm({
            title: event.title || "",
            description: event.description || "",
            eventType: event.eventType || "Community",
            startDate: toDateTimeInputValue(event.startDate),
            endDate: toDateTimeInputValue(event.endDate),
            location: event.location || "",
            isOnline: Boolean(event.isOnline),
            onlineUrl: event.onlineUrl || "",
            capacity: event.capacity || "",
            status: event.status || "active",
        });
    };

    const updateCommentStatus = async (commentId, status) => {
        try {
            await axios.patch(`/api/community/admin/comments/${commentId}/status`, {status}, authConfig);
            toast.success(status === "approved" ? "Comment approved" : "Comment updated");
            fetchComments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to update comment");
        }
    };

    const deleteComment = async (commentId) => {
        try {
            await axios.delete(`/api/community/admin/comments/${commentId}`, authConfig);
            toast.success("Comment deleted");
            fetchComments();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to delete comment");
        }
    };

    const deleteEvent = async (eventId) => {
        try {
            await axios.delete(`/api/community/events/${eventId}`, authConfig);
            toast.success("Event deleted");
            fetchEvents();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to delete event");
        }
    };

    return (
        <div className="cm-page">
            <div className="cm-card">
                <div className="cm-header">
                    <div>
                        <p className="cm-eyebrow">Community Management</p>
                        <h1>Community Tools</h1>
                        <p>Moderate comments and manage events that appear on the public community page.</p>
                    </div>
                    <span className="cm-icon">
                        <FaComments />
                    </span>
                </div>

                <div className="cm-stats-grid">
                    <div className="cm-stat">
                        <span>
                            <FaComments />
                        </span>
                        <strong>{comments.length}</strong>
                        <small>{commentStatus} comments</small>
                    </div>
                    <div className="cm-stat">
                        <span>
                            <FaCalendarAlt />
                        </span>
                        <strong>{events.length}</strong>
                        <small>events</small>
                    </div>
                    <div className="cm-stat">
                        <span>
                            <FaUsers />
                        </span>
                        <strong>{events.reduce((total, event) => total + (event.rsvpCount || 0), 0)}</strong>
                        <small>RSVPs</small>
                    </div>
                </div>

                <section className="cm-section">
                    <div className="cm-section-header">
                        <div>
                            <h2>Comment Moderation</h2>
                            <p>New comments stay hidden until approved.</p>
                        </div>
                        <select value={commentStatus} onChange={(e) => setCommentStatus(e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="all">All</option>
                        </select>
                    </div>

                    {loadingComments ? (
                        <Loading message="Loading comments..." />
                    ) : comments.length === 0 ? (
                        <div className="cm-empty">No comments found for this filter.</div>
                    ) : (
                        <div className="cm-comment-list">
                            {comments.map((comment) => (
                                <article className="cm-comment" key={comment._id}>
                                    <div className="cm-comment-main">
                                        <span className={`cm-status cm-status--${comment.status}`}>{comment.status}</span>
                                        <h3>{comment.name}</h3>
                                        <small>
                                            {comment.contentType} - {comment.contentTitle}
                                        </small>
                                        <p>{comment.body}</p>
                                    </div>
                                    <div className="cm-comment-actions">
                                        <button type="button" className="cm-action cm-action--approve" onClick={() => updateCommentStatus(comment._id, "approved")}>
                                            <FaCheck />
                                            Approve
                                        </button>
                                        <button type="button" className="cm-action" onClick={() => updateCommentStatus(comment._id, "rejected")}>
                                            <FaTimes />
                                            Reject
                                        </button>
                                        <button type="button" className="cm-action cm-action--danger" onClick={() => deleteComment(comment._id)}>
                                            <FaTrash />
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="cm-section cm-event-layout">
                    <form className="cm-event-form" onSubmit={handleEventSubmit}>
                        <div className="cm-section-header">
                            <div>
                                <h2>{editingEventId ? "Edit Event" : "Create Event"}</h2>
                                <p>Events are shown on the public calendar by date.</p>
                            </div>
                            {editingEventId && (
                                <button type="button" className="cm-secondary-btn" onClick={resetEventForm}>
                                    Cancel
                                </button>
                            )}
                        </div>

                        <label>
                            Title
                            <input type="text" name="title" value={eventForm.title} onChange={handleEventInputChange} placeholder="Pilgrimage, webinar, retreat..." />
                        </label>
                        <label>
                            Description
                            <textarea name="description" value={eventForm.description} onChange={handleEventInputChange} placeholder="What should people know?" rows="4" />
                        </label>
                        <div className="cm-form-row">
                            <label>
                                Type
                                <input type="text" name="eventType" value={eventForm.eventType} onChange={handleEventInputChange} />
                            </label>
                            <label>
                                Status
                                <select name="status" value={eventForm.status} onChange={handleEventInputChange}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </label>
                        </div>
                        <div className="cm-form-row">
                            <label>
                                Start Date
                                <input type="datetime-local" name="startDate" value={eventForm.startDate} onChange={handleEventInputChange} />
                            </label>
                            <label>
                                End Date
                                <input type="datetime-local" name="endDate" value={eventForm.endDate} onChange={handleEventInputChange} />
                            </label>
                        </div>
                        <div className="cm-form-row">
                            <label>
                                Location
                                <input type="text" name="location" value={eventForm.location} onChange={handleEventInputChange} placeholder="Church hall or city" />
                            </label>
                            <label>
                                Capacity
                                <input type="number" min="0" name="capacity" value={eventForm.capacity} onChange={handleEventInputChange} placeholder="0 for unlimited" />
                            </label>
                        </div>
                        <label className="cm-checkbox">
                            <input type="checkbox" name="isOnline" checked={eventForm.isOnline} onChange={handleEventInputChange} />
                            Online event
                        </label>
                        {eventForm.isOnline && (
                            <label>
                                Online Link
                                <input type="url" name="onlineUrl" value={eventForm.onlineUrl} onChange={handleEventInputChange} placeholder="https://..." />
                            </label>
                        )}
                        <button type="submit" className="cm-primary-btn" disabled={savingEvent}>
                            {savingEvent ? "Saving..." : editingEventId ? "Update Event" : "Create Event"}
                        </button>
                    </form>

                    <div className="cm-events-list">
                        <div className="cm-section-header">
                            <div>
                                <h2>Events</h2>
                                <p>Sorted by upcoming date.</p>
                            </div>
                        </div>

                        {loadingEvents ? (
                            <Loading message="Loading events..." />
                        ) : events.length === 0 ? (
                            <div className="cm-empty">No events have been created yet.</div>
                        ) : (
                            events.map((event) => (
                                <article className="cm-event" key={event._id}>
                                    <div>
                                        <span className={`cm-status cm-status--${event.status}`}>{event.status}</span>
                                        <h3>{event.title}</h3>
                                        <small>{formatDateTime(event.startDate)}</small>
                                        <p>
                                            {event.rsvpCount || 0} RSVP{event.rsvpCount === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                    <div className="cm-event-actions">
                                        <button type="button" className="cm-action" onClick={() => editEvent(event)}>
                                            <FaEdit />
                                            Edit
                                        </button>
                                        <button type="button" className="cm-action cm-action--danger" onClick={() => deleteEvent(event._id)}>
                                            <FaTrash />
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
