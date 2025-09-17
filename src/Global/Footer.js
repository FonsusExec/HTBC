import React from "react";
import "../assets/css/footer.css";

export default function Footer() {
    return (
        <div className="contact-container">
            <div className="contact-form">
                <h2 className="contact-title">Contact Us</h2>
                <form>
                    <div className="input-row">
                        <input type="text" placeholder="Full Name" />
                        <input type="email" placeholder="Email Address" />
                    </div>
                    <textarea placeholder="Message"></textarea>
                    <label className="newsletter-label">
                        <input type="checkbox" /> Sign up for Newsletter
                    </label>
                    <button type="submit">Send</button>
                </form>
            </div>
            <div className="contact-info">
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
        </div>
    );
}
