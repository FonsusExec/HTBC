import React, {useEffect, useState} from "react";
import "../assets/css/navigation.css";
import {Link, useLocation} from "react-router-dom";
import {useAuth} from "../AuthContext";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars, faTimes} from "@fortawesome/free-solid-svg-icons";

const normalizeRole = (role) => {
    if (!role) return "";
    const roleValue = typeof role === "string" ? role : role.name || role.slug || "";
    return roleValue.toLowerCase().replace(/[-_]+/g, " ").trim();
};

export default function Navigation() {
    const location = useLocation();
    const {user, isLoggedIn, logout} = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const canAccessAdmin = isLoggedIn && normalizeRole(user?.role) === "super admin";

    const navItems = [
        {label: "Home", to: "/", match: ["/"], end: true},
        {label: "About Us", to: "/about-us", match: ["/about-us"]},
        {label: "Blog", to: "/blog", match: ["/blog"]},
        {label: "News", to: "/news", match: ["/news"]},
        {label: "Shop", to: "/all-products", match: ["/all-products", "/product"]},
        {label: "Donate", to: "/donate", match: ["/donate", "/donationform"]},
        // {label: "Contact", to: "/contact-us", match: ["/contact-us"]},
    ];

    if (canAccessAdmin) {
        navItems.push({label: "Admin", to: "/admin", match: ["/admin"]});
    }

    const closeMenus = () => {
        setIsDropdownOpen(false);
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        logout();
        closeMenus();
    };

    const isNavItemActive = (item) => {
        if (item.end) return location.pathname === item.to;
        return item.match.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
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
                <Link to="/" onClick={closeMenus} aria-label="Go to home page">
                    <img src={require("../assets/img/htbc-logo.png")} alt="HowtobeCatholic" />
                </Link>
            </div>

            <button className="mobile-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)}>
                <FontAwesomeIcon icon={isMenuOpen ? faTimes : faBars} />
            </button>

            <div className={`nav-panel ${isMenuOpen ? "nav-panel--open" : ""}`}>
                <div className="nav-links">
                    {navItems.map((item) => (
                        <Link key={item.label} to={item.to} className={isNavItemActive(item) ? "active" : ""} onClick={closeMenus}>
                            {item.label}
                        </Link>
                    ))}
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
