import {FaFileAlt, FaNewspaper, FaBook, FaShoppingCart, FaUsers, FaDonate, FaComments} from "react-icons/fa";

export const adminMenu = [
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
                path: "/admin/resources",
                icon: <FaBook />,
            },
        ],
    },

    {
        label: "E-Commerce Management",
        icon: <FaShoppingCart />,
        roles: ["admin"],
        children: [
            {type: "link", label: "Products", path: "/admin/store"},
            {type: "link", label: "Orders", path: "/admin/orders"},
        ],
    },

    {
        label: "User Management",
        icon: <FaUsers />,
        roles: ["admin"],
        children: [{type: "link", label: "Users", path: "/admin/users"}],
    },

    {
        label: "Donation Management",
        icon: <FaDonate />,
        roles: ["admin"],
        children: [{type: "link", label: "Donations", path: "/admin/donations"}],
    },

    {
        label: "Community Management",
        icon: <FaComments />,
        roles: ["admin", "moderator"],
        children: [{type: "link", label: "Community", path: "/admin/community"}],
    },
];
