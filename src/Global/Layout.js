import * as React from "react";
//import "@fortawesome/fontawesome-free/css/all.min.css";

// import "notyf/notyf.min.css";
import {Helmet} from "react-helmet";
// import "../assets/css/layout.css";
import {Outlet} from "react-router";
import Navigation from "./Navigation";
import Footer from "./Footer";

//require("home");

export const Layout = () => {
    return (
        <>
            <div className="layout-background">
                <Helmet>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Public+Sans:wght@100..900&display=swap" rel="stylesheet" />
                </Helmet>
                <Navigation />
                <main>
                    <Outlet />
                </main>
                <div className="layout-footer">
                    <Footer />
                </div>
            </div>
        </>
    );
};
export default Layout;
