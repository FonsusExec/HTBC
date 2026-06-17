import React, {useState} from "react";
import axios from "axios";
import {isDemoMode} from "../demo/demoMode";
import "../assets/css/footer.css";

export default function Footer() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        message: "",
        newsletter: false,
    });
    const [status, setStatus] = useState({type: "", message: ""});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const {name, value, checked, type} = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const payload = {
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            message: formData.message.trim(),
            newsletter: formData.newsletter,
        };

        if (!payload.fullName || !payload.email || !payload.message) {
            setStatus({type: "error", message: "Please complete your name, email and message."});
            return;
        }

        if (payload.message.length < 10) {
            setStatus({type: "error", message: "Please enter a message with at least 10 characters."});
            return;
        }

        try {
            setSubmitting(true);
            setStatus({type: "", message: ""});

            if (isDemoMode) {
                setStatus({type: "success", message: "Demo mode: message captured for preview only."});
                setFormData({fullName: "", email: "", message: "", newsletter: false});
                return;
            }

            const {data} = await axios.post("/api/contact-messages", payload);

            setStatus({type: "success", message: data.message || "Your message has been sent."});
            setFormData({fullName: "", email: "", message: "", newsletter: false});
        } catch (err) {
            setStatus({type: "error", message: err.response?.data?.message || "Unable to send your message right now. Please try again."});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <footer className="contact-container">
            <div className="contact-form">
                <p className="contact-kicker">Stay Connected</p>
                <h2 className="contact-title">Contact Us</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-row">
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" autoComplete="name" required />
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" autoComplete="email" required />
                    </div>
                    <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Message" required></textarea>
                    <label className="newsletter-label">
                        <input type="checkbox" name="newsletter" checked={formData.newsletter} onChange={handleChange} /> Sign up for Newsletter
                    </label>
                    {status.message && <p className={`footer-form-message footer-form-message--${status.type}`}>{status.message}</p>}
                    <button type="submit" disabled={submitting}>
                        {submitting ? "Sending..." : "Send"}
                    </button>
                </form>
            </div>
            <div className="contact-info">
                <div className="footer-brand">
                    <img src={require("../assets/img/htbc-logo.png")} alt="HowtobeCatholic" />
                    <p>Helping Catholics learn, shop, donate, and stay connected with the faith community.</p>
                </div>
                <div className="contact-step">
                    <div className="social-icons">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                            <img src={require("../assets/img/icons8-facebook-50.png")} alt="Facebook" className="social-icon" />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <img src={require("../assets/img/icons8-x-logo-48.png")} alt="Twitter" className="social-icon" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                            <img src={require("../assets/img/icons8-instagram-logo-100.png")} alt="Instagram" className="social-icon" />
                        </a>
                    </div>
                </div>
                <div className="contact-step">
                    <p className="label">Phone:</p>
                    <p>+1 273 203 1823</p>
                </div>
                <div className="contact-step">
                    <p className="label">Address:</p>
                    <p>St. Benedict Catholic Church 214/5 Elmwood Avenue Brookfield, IL 60513 United States</p>
                </div>
            </div>
        </footer>
    );
}
