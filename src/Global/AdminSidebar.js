import React, {useEffect, useState} from "react";
import {Link, NavLink, useLocation, useNavigate} from "react-router-dom";
import {adminMenu} from "../Global/AdminMenu";
import {useAuth} from "../AuthContext";
import "../assets/css/adminSidebar.css";

export default function AdminSidebar({userRole = "admin", isOpen = false, onClose}) {
    const collapsed = false;
    const [openIndex, setOpenIndex] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const {logout} = useAuth();

    useEffect(() => {
        adminMenu.forEach((section, index) => {
            if (section.children?.some((item) => item.path && location.pathname.startsWith(item.path))) {
                setOpenIndex(index);
            }
        });
    }, [location.pathname]);

    const toggleSection = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const handleLogout = () => {
        logout();
        onClose?.();
        navigate("/login");
    };

    return (
        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""} ${isOpen ? "admin-sidebar--open" : ""}`}>
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo-link" onClick={onClose} aria-label="Go to home page">
                    <img src={require("../assets/img/htbc-logo.png")} alt="Logo" className="sidebar-logo" />
                </Link>
            </div>

            <nav className="sidebar-nav">
                {adminMenu.map((section, i) => {
                    if (!section.roles.includes(userRole)) return null;
                    const isOpen = openIndex === i;
                    const isActiveSection = section.children?.some((item) => item.path && location.pathname.startsWith(item.path));

                    return (
                        <div key={i} className={`menu-section ${isOpen ? "menu-section--open" : ""} ${isActiveSection ? "menu-section--active" : ""}`}>
                            <button className="menu-title" onClick={() => toggleSection(i)} type="button">
                                <div className="menu-left">
                                    {section.icon}
                                    {!collapsed && <span>{section.label}</span>}
                                </div>

                                {!collapsed && <span className={`arrow ${isOpen ? "open" : ""}`} aria-hidden="true" />}
                            </button>

                            <ul className={`submenu ${isOpen ? "open" : ""}`}>
                                {section.children.map((item, j) => {
                                    if (item.type === "title") {
                                        return (
                                            <li key={j} className="submenu-title">
                                                {!collapsed && item.label}
                                            </li>
                                        );
                                    }

                                    return (
                                        <li key={j}>
                                            <NavLink to={item.path} className={({isActive}) => (isActive ? "active" : "")} onClick={onClose}>
                                                {item.icon}
                                                {!collapsed && <span>{item.label}</span>}
                                            </NavLink>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                )}
            </div>
        </aside>
    );
}
