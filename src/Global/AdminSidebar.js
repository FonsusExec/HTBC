import React, {useState, useEffect} from "react";
import {NavLink, useLocation} from "react-router-dom";
import {adminMenu} from "../Global/AdminMenu";
import "../assets/css/adminSidebar.css";

export default function AdminSidebar({userRole = "admin"}) {
    const [collapsed, setCollapsed] = useState(false);
    const [openIndex, setOpenIndex] = useState(null);
    const location = useLocation();

    // Auto-open dropdown if route matches
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

    return (
        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
            {/* Header */}
            <div className="sidebar-header">
                {/* <div className="logo-wrapper"> */}
                <img src={require("../assets/img/htbc-logo.png")} alt="Logo" className="sidebar-logo" />
                {/* </div> */}
                {/* <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle Sidebar">
                    ☰
                </button> */}
            </div>

            {/* Menu */}
            <nav className="sidebar-nav">
                {adminMenu.map((section, i) => {
                    if (!section.roles.includes(userRole)) return null;
                    const isOpen = openIndex === i;

                    return (
                        <div key={i} className="menu-section">
                            {/* Parent */}
                            <div className="menu-title" onClick={() => toggleSection(i)}>
                                <div className="menu-left">
                                    {section.icon}
                                    {!collapsed && <span>{section.label}</span>}
                                </div>

                                {!collapsed && <i className={`fa-solid fa-chevron-down arrow ${isOpen ? "open" : ""}`} />}
                            </div>

                            {/* Dropdown */}
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
                                            <NavLink to={item.path} className={({isActive}) => (isActive ? "active" : "")}>
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

            {/* Footer */}
            <div className="sidebar-footer">{!collapsed && <button className="logout-btn">Logout</button>}</div>
        </aside>
    );
}
