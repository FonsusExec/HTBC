import React from "react";
import AdminSidebar from "../Global/AdminSidebar";
import {Outlet} from "react-router-dom";
import AdminHeader from "../Global/AdminHeader";
import "../assets/css/adminLayout.css";

export default function AdminLayout({children}) {
    return (
        <div className="admin-layout">
            <AdminSidebar />

            <div className="admin-main">
                <AdminHeader />
                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
