import React, {useState, useEffect} from "react";
import "../assets/css/navigation.css";
import {Link} from "react-router-dom";
import {useAuth} from "../AuthContext";
// import "../assets/img/htbc-logo.png"

export default function Navigation() {
    const [activeLink, setActiveLink] = useState(null);
    const {user, isLoggedIn, logout} = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLinkClick = (link) => {
        setActiveLink(link);
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false); // Close dropdown on logout
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
                <a href="#/blog" className={activeLink === "Blog" ? "active" : ""} onClick={() => handleLinkClick("Blog")}>
                    Blog
                </a>
                <a href="#" className={activeLink === "News" ? "active" : ""} onClick={() => handleLinkClick("News")}>
                    News
                </a>
                <a href="#/all-products" className={activeLink === "Shop" ? "active" : ""} onClick={() => handleLinkClick("Shop")}>
                    Shop
                </a>
                <a href="#" className={activeLink === "Donate" ? "active" : ""} onClick={() => handleLinkClick("Donate")}>
                    Donate
                </a>
                <a href="#" className={activeLink === "Contact" ? "active" : ""} onClick={() => handleLinkClick("Contact")}>
                    Contact
                </a>
            </div>
            {isLoggedIn ? (
                <div className="profile-section">
                    {/* Profile trigger */}
                    <button className="profile-btn" onClick={toggleDropdown}>
                        <span className="welcome-text">Welcome, {user?.name || "User"}!</span>
                        <span className="dropdown-arrow">▼</span> {/* Simple arrow icon */}
                    </button>
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <Link to="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                Profile
                            </Link>
                            <Link to="/orders" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                                My Orders
                            </Link>
                            <button className="dropdown-item logout-item" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link to="/login" className="login-btn">
                    Login
                </Link>
            )}
        </div>
    );
}
