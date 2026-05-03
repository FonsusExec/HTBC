import React, {useState} from "react";
import AdminSidebar from "../Global/AdminSidebar";
import {Outlet} from "react-router-dom";
import AdminHeader from "../Global/AdminHeader";
import "../assets/css/adminLayout.css";

export default function AdminLayout({children}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="admin-layout">
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            {isSidebarOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="Close admin menu" onClick={() => setIsSidebarOpen(false)} />}

            <div className="admin-main">
                <AdminHeader onMenuToggle={() => setIsSidebarOpen((open) => !open)} />
                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
