import React, {useEffect, useState} from "react";
import "../assets/css/navigation.css";
import {Link} from "react-router-dom";
import {useAuth} from "../AuthContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars, faTimes} from "@fortawesome/free-solid-svg-icons";

const normalizeRole = (role) => {
    if (!role) return "";
    const roleValue = typeof role === "string" ? role : role.name || role.slug || "";
    return roleValue.toLowerCase().replace(/[-_]+/g, " ").trim();
};

export default function Navigation() {
    const [activeLink, setActiveLink] = useState(null);
    const {user, isLoggedIn, logout} = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const canAccessAdmin = isLoggedIn && normalizeRole(user?.role) === "super admin";

    const handleLinkClick = (link) => {
        setActiveLink(link);
        setIsMenuOpen(false);
    };

    const closeMenus = () => {
        setIsDropdownOpen(false);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenus();
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isDropdownOpen && !e.target.closest(".profile-section")) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isDropdownOpen]);

    return (
        <div className={`navbar ${isMenuOpen ? "navbar--open" : ""}`}>
            <div className="logo">
                <img src={require("../assets/img/htbc-logo.png")} alt="HowtobeCatholic" />
            </div>

            <button className="mobile-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
                <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
            </button>

            <div className={`nav-panel ${isMenuOpen ? "nav-panel--open" : ""}`}>
                <div className="nav-links">
                    <a href="#" className={activeLink === "Home" ? "active" : ""} onClick={() => handleLinkClick("Home")}>
                        Home
                    </a>
                    <a href="#/contact-us" className={activeLink === "About Us" ? "active" : ""} onClick={() => handleLinkClick("About Us")}>
                        About Us
                    </a>
                    <a href="#/blog" className={activeLink === "Blog" ? "active" : ""} onClick={() => handleLinkClick("Blog")}>
                        Blog
                    </a>
                    <a href="#/news" className={activeLink === "News" ? "active" : ""} onClick={() => handleLinkClick("News")}>
                        News
                    </a>
                    <a href="#/all-products" className={activeLink === "Shop" ? "active" : ""} onClick={() => handleLinkClick("Shop")}>
                        Shop
                    </a>
                    <a href="#/donate" className={activeLink === "Donate" ? "active" : ""} onClick={() => handleLinkClick("Donate")}>
                        Donate
                    </a>
                    <a href="#/contact-us" className={activeLink === "Contact" ? "active" : ""} onClick={() => handleLinkClick("Contact")}>
                        Contact
                    </a>
                    {canAccessAdmin && (
                        <a href="#/admin" className={activeLink === "Admin" ? "active" : ""} onClick={() => handleLinkClick("Admin")}>
                            Admin
                        </a>
                    )}
                </div>

                {isLoggedIn ? (
                    <div className="profile-section">
                        <button className="profile-btn" type="button" onClick={() => setIsDropdownOpen((open) => !open)}>
                            <span className="welcome-text">Welcome, {user?.name || "User"}!</span>
                            <span className="dropdown-arrow">v</span>
                        </button>
                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item" onClick={closeMenus}>
                                    Profile
                                </Link>
                                <Link to="/orders" className="dropdown-item" onClick={closeMenus}>
                                    My Orders
                                </Link>
                                <button className="dropdown-item logout-item" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="login-btn" onClick={closeMenus}>
                        Login
                    </Link>
                )}
            </div>
        </div>
    );
}
