import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {FaCalendarAlt, FaCheckCircle, FaMapMarkerAlt, FaSortAmountDown, FaSortAmountUp, FaUsers} from "react-icons/fa";
import {useAuth} from "../../AuthContext";
import Loading from "../../components/Loading";
import "./community.css";

const heroImage = require("../../assets/img/htbc-commu.png");

const formatEventDate = (dateValue) => {
    if (!dateValue) return "Date coming soon";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Date coming soon";

    return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

export default function Community() {
    const {user} = useAuth();
    const [events, setEvents] = useState([]);
    const [sort, setSort] = useState("asc");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [form, setForm] = useState({name: "", email: "", phone: ""});
    const [rsvpMessage, setRsvpMessage] = useState("");
    const [rsvpError, setRsvpError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;
        setForm((currentForm) => ({
            ...currentForm,
            name: currentForm.name || user.name || "",
            email: currentForm.email || user.email || "",
        }));
    }, [user]);

    useEffect(() => {
        let isActive = true;

        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError("");
                const {data} = await axios.get("/api/community/events", {params: {sort}});
                if (!isActive) return;
                setEvents(data.events || []);
            } catch (err) {
                if (!isActive) return;
                setError(err.response?.data?.message || "Unable to load community events right now.");
            } finally {
                if (isActive) setLoading(false);
            }
        };

        fetchEvents();

        return () => {
            isActive = false;
        };
    }, [sort]);

    const nextEvent = useMemo(() => events[0], [events]);

    const openRsvp = (event) => {
        setSelectedEvent(event);
        setRsvpMessage("");
        setRsvpError("");
    };

    const closeRsvp = () => {
        setSelectedEvent(null);
        setRsvpMessage("");
        setRsvpError("");
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setForm((currentForm) => ({...currentForm, [name]: value}));
        setRsvpMessage("");
        setRsvpError("");
    };

    const handleRsvpSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEvent) return;

        const name = form.name.trim();
        const email = form.email.trim();

        if (!name || !email) {
            setRsvpError("Name and email are required to RSVP.");
            return;
        }

        try {
            setSubmitting(true);
            setRsvpError("");
            setRsvpMessage("");

            const {data} = await axios.post(`/api/community/events/${selectedEvent._id}/rsvp`, {
                name,
                email,
                phone: form.phone.trim(),
            });

            setEvents((currentEvents) => currentEvents.map((event) => (event._id === selectedEvent._id ? data.event : event)));
            setSelectedEvent(data.event);
            setRsvpMessage("Your RSVP has been saved.");
        } catch (err) {
            setRsvpError(err.response?.data?.message || "Unable to save your RSVP right now.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="community-page">
            <section className="community-hero" style={{backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.36)), url(${heroImage})`}}>
                <div className="community-hero-copy">
                    <span>Community</span>
                    <h1>Gather, learn, and grow together</h1>
                    <p>Explore upcoming parish events, pilgrimages, webinars, and community gatherings.</p>
                </div>
                {nextEvent && (
                    <div className="community-next-event">
                        <span>Next Event</span>
                        <h2>{nextEvent.title}</h2>
                        <p>{formatEventDate(nextEvent.startDate)}</p>
                        <button type="button" onClick={() => openRsvp(nextEvent)}>
                            RSVP
                        </button>
                    </div>
                )}
            </section>

            <section className="community-events-section">
                <div className="community-section-header">
                    <div>
                        <span>Calendar</span>
                        <h2>Upcoming Events</h2>
                    </div>
                    <button type="button" className="community-sort-btn" onClick={() => setSort((currentSort) => (currentSort === "asc" ? "desc" : "asc"))}>
                        {sort === "asc" ? <FaSortAmountUp aria-hidden="true" /> : <FaSortAmountDown aria-hidden="true" />}
                        {sort === "asc" ? "Soonest first" : "Latest first"}
                    </button>
                </div>

                {loading ? (
                    <div className="community-state">
                        <Loading message="Loading events..." />
                    </div>
                ) : error ? (
                    <div className="community-state community-state--error">{error}</div>
                ) : events.length === 0 ? (
                    <div className="community-state">No upcoming events have been posted yet.</div>
                ) : (
                    <div className="community-events-grid">
                        {events.map((event) => {
                            const spotsLeft = event.capacity > 0 ? Math.max(event.capacity - (event.rsvpCount || 0), 0) : null;

                            return (
                                <article className="community-event-card" key={event._id}>
                                    <div className="community-event-date">
                                        <FaCalendarAlt aria-hidden="true" />
                                        <span>{formatEventDate(event.startDate)}</span>
                                    </div>
                                    <h3>{event.title}</h3>
                                    <p>{event.description}</p>
                                    <div className="community-event-meta">
                                        <span>
                                            <FaMapMarkerAlt aria-hidden="true" />
                                            {event.isOnline ? "Online" : event.location || "Location coming soon"}
                                        </span>
                                        <span>
                                            <FaUsers aria-hidden="true" />
                                            {event.rsvpCount || 0} RSVP{event.rsvpCount === 1 ? "" : "s"}
                                        </span>
                                    </div>
                                    {spotsLeft !== null && <small>{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Event full"}</small>}
                                    <button type="button" onClick={() => openRsvp(event)} disabled={spotsLeft === 0}>
                                        {spotsLeft === 0 ? "Full" : "RSVP"}
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {selectedEvent && (
                <div className="community-rsvp-overlay" role="dialog" aria-modal="true" aria-label={`RSVP for ${selectedEvent.title}`}>
                    <div className="community-rsvp-modal">
                        <div className="community-rsvp-header">
                            <div>
                                <span>RSVP</span>
                                <h2>{selectedEvent.title}</h2>
                                <p>{formatEventDate(selectedEvent.startDate)}</p>
                            </div>
                            <button type="button" onClick={closeRsvp} aria-label="Close RSVP form">
                                x
                            </button>
                        </div>

                        <form className="community-rsvp-form" onSubmit={handleRsvpSubmit}>
                            <label>
                                <span>Name</span>
                                <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Your full name" />
                            </label>
                            <label>
                                <span>Email</span>
                                <input type="email" name="email" value={form.email} onChange={handleInputChange} placeholder="name@example.com" />
                            </label>
                            <label>
                                <span>Phone</span>
                                <input type="text" name="phone" value={form.phone} onChange={handleInputChange} placeholder="Optional phone number" />
                            </label>

                            {rsvpError && <p className="community-rsvp-message community-rsvp-message--error">{rsvpError}</p>}
                            {rsvpMessage && (
                                <p className="community-rsvp-message community-rsvp-message--success">
                                    <FaCheckCircle aria-hidden="true" />
                                    {rsvpMessage}
                                </p>
                            )}

                            <button type="submit" disabled={submitting}>
                                {submitting ? "Saving..." : "Save RSVP"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
