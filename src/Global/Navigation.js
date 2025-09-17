import React, {useState} from "react";
import "../assets/css/navigation.css";
import {Link} from "react-router-dom";
// import "../assets/img/htbc-logo.png"

export default function Navigation() {
    const [activeLink, setActiveLink] = useState(null);

    const handleLinkClick = (link) => {
        setActiveLink(link);
    };
    return (
        <div className="navbar">
            <div className="logo">
                <img src={require("../assets/img/htbc-logo.png")} alt="HowtobeCatholic" />
            </div>
            <div className="nav-links">
                <a href="#" className={activeLink === "Home" ? "active" : ""} onClick={() => handleLinkClick("Home")}>
                    Home
                </a>
                <a href="#" className={activeLink === "About Us" ? "active" : ""} onClick={() => handleLinkClick("About Us")}>
                    About Us
                </a>
                <a href="#" className={activeLink === "Blog" ? "active" : ""} onClick={() => handleLinkClick("Blog")}>
                    Blog
                </a>
                <a href="#" className={activeLink === "News" ? "active" : ""} onClick={() => handleLinkClick("News")}>
                    News
                </a>
                <a href="#" className={activeLink === "Shop" ? "active" : ""} onClick={() => handleLinkClick("Shop")}>
                    Shop
                </a>
                <a href="#" className={activeLink === "Donate" ? "active" : ""} onClick={() => handleLinkClick("Donate")}>
                    Donate
                </a>
                <a href="#" className={activeLink === "Contact" ? "active" : ""} onClick={() => handleLinkClick("Contact")}>
                    Contact
                </a>
            </div>
            <Link to="/login" className="login-btn">
                Login
            </Link>
        </div>
    );
}
