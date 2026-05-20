import {FaFileAlt, FaNewspaper, FaBook, FaShoppingCart, FaUsers, FaDonate, FaComments, FaTachometerAlt} from "react-icons/fa";

export const adminMenu = [
    {
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        roles: ["admin", "editor", "moderator"],
        children: [
            {
                type: "link",
                label: "Overview",
                path: "/admin/dashboard",
            },
        ],
    },

    {
        label: "Content Management",
        icon: <FaFileAlt />,
        roles: ["admin", "editor"],
        children: [
            {
                type: "title",
                label: "Content",
            },
            {
                type: "link",
                label: "Blog",
                path: "/admin/bloglist",
                icon: <FaBook />,
            },
            {
                type: "link",
                label: "News",
                path: "/admin/newslist",
                icon: <FaNewspaper />,
            },
            {
                type: "link",
                label: "Resources",
                path: "/admin/resourcelist",
                icon: <FaBook />,
            },
        ],
    },

    {
        label: "E-Commerce Management",
        icon: <FaShoppingCart />,
        roles: ["admin"],
        children: [
            {type: "link", label: "Products", path: "/admin/productlist"},
            {type: "link", label: "Orders", path: "/admin/orders"},
        ],
    },

    {
        label: "User Management",
        icon: <FaUsers />,
        roles: ["admin"],
        children: [{type: "link", label: "Users", path: "/admin/view-users"}],
    },

    {
        label: "Donation Management",
        icon: <FaDonate />,
        roles: ["admin"],
        children: [
            {type: "link", label: "Donations", path: "/admin/donation-tracker"},
            {type: "link", label: "Impact Stories", path: "/admin/donation-story-list"},
        ],
    },

    {
        label: "Community Management",
        icon: <FaComments />,
        roles: ["admin"],
        children: [
            {type: "link", label: "Community", path: "/admin/community"},
            {type: "link", label: "About Us", path: "/admin/about-us"},
            {type: "link", label: "Testimonials", path: "/admin/testimonials"},
        ],
    },
];
