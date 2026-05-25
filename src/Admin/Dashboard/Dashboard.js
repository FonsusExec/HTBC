import React, {useCallback, useEffect, useMemo, useState} from "react";
import {Link} from "react-router-dom";
import axios from "axios";
import {
    FaBell,
    FaBook,
    FaBoxOpen,
    FaChartLine,
    FaCheckCircle,
    FaComments,
    FaDonate,
    FaExclamationCircle,
    FaNewspaper,
    FaShoppingCart,
    FaSyncAlt,
} from "react-icons/fa";
import Loading from "../../components/Loading";
import "./dashboard.css";

const AUTO_REFRESH_MS = 60000;

const initialData = {
    orders: [],
    blogs: [],
    news: [],
    products: [],
    users: [],
    donations: [],
    stories: [],
    communityComments: [],
    totals: {
        blogs: 0,
        news: 0,
        products: 0,
        donations: 0,
        stories: 0,
    },
};

const getList = (result, key) => {
    if (result.status !== "fulfilled") return [];
    const data = result.value.data;
    if (Array.isArray(data)) return data;
    return data?.[key] || [];
};

const getTotal = (result, fallbackList) => {
    if (result.status !== "fulfilled") return fallbackList.length;
    const data = result.value.data;
    return typeof data?.total === "number" ? data.total : fallbackList.length;
};

const formatCurrency = (value = 0) =>
    Number(value || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    });

const formatDate = (dateValue) => {
    if (!dateValue) return "Just now";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Just now";
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const isToday = (dateValue) => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
};

const isWithinDays = (dateValue, days) => {
    if (!dateValue) return false;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return false;
    const diff = Date.now() - date.getTime();
    return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
};

const isPendingStatus = (status) => ["pending", "review", "needs_review", "awaiting_review"].includes(String(status || "").toLowerCase());

export default function Dashboard() {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboardData = useCallback(async ({silent = false} = {}) => {
        const token = localStorage.getItem("token");
        const authConfig = token ? {headers: {Authorization: `Bearer ${token}`}} : {};

        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError("");

        const results = await Promise.allSettled([
            axios.get("/api/admin/orders", authConfig),
            axios.get("/api/blogs", {params: {page: 1, limit: 5, type: "blog", status: "all"}}),
            axios.get("/api/news", {params: {page: 1, limit: 5, status: "all"}}),
            axios.get("/api/products", {params: {page: 1, limit: 100}}),
            axios.get("/api/admin/users"),
            axios.get("/api/admin/donations", {...authConfig, params: {page: 1, limit: 100}}),
            axios.get("/api/impact-stories", {params: {page: 1, limit: 10}}),
            axios.get("/api/community/admin/comments", {...authConfig, params: {status: "pending"}}),
        ]);

        const [ordersResult, blogsResult, newsResult, productsResult, usersResult, donationsResult, storiesResult, communityCommentsResult] = results;
        const orders = getList(ordersResult, "orders");
        const blogs = getList(blogsResult, "posts");
        const news = getList(newsResult, "articles");
        const products = getList(productsResult, "products");
        const users = getList(usersResult, "users");
        const donations = getList(donationsResult, "donations");
        const stories = getList(storiesResult, "stories");
        const communityComments = getList(communityCommentsResult, "comments");

        setData({
            orders,
            blogs,
            news,
            products,
            users,
            donations,
            stories,
            communityComments,
            totals: {
                blogs: getTotal(blogsResult, blogs),
                news: getTotal(newsResult, news),
                products: getTotal(productsResult, products),
                donations: getTotal(donationsResult, donations),
                stories: getTotal(storiesResult, stories),
            },
        });

        if (results.some((result) => result.status === "rejected")) {
            setError("Some dashboard data could not be loaded. The available sections are shown below.");
        }

        setLastUpdated(new Date());
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => fetchDashboardData({silent: true}), AUTO_REFRESH_MS);
        return () => clearInterval(timer);
    }, [fetchDashboardData]);

    const stats = useMemo(() => {
        const newOrdersToday = data.orders.filter((order) => isToday(order.createdAt)).length;
        const revenue = data.orders.reduce((sum, order) => sum + Number(order.total || order.subtotal || 0), 0);
        const recentPosts = [...data.blogs, ...data.news].filter((post) => isWithinDays(post.createdAt, 7)).length;
        const donationTotal = data.donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

        return [
            {
                label: "New Orders",
                value: newOrdersToday,
                helper: `${data.orders.length} orders loaded`,
                icon: <FaShoppingCart />,
                tone: "blue",
            },
            {
                label: "Pending Comments",
                value: data.communityComments.length,
                helper: "Community comments queue",
                icon: <FaComments />,
                tone: "amber",
            },
            {
                label: "Recent Posts",
                value: recentPosts,
                helper: `${data.totals.blogs + data.totals.news} total blog/news posts`,
                icon: <FaNewspaper />,
                tone: "green",
            },
            {
                label: "Donation Activity",
                value: data.totals.donations,
                helper: `${formatCurrency(donationTotal)} received`,
                icon: <FaDonate />,
                tone: "rose",
            },
            {
                label: "Store Revenue",
                value: formatCurrency(revenue),
                helper: `${data.totals.products} products in catalog`,
                icon: <FaChartLine />,
                tone: "navy",
            },
        ];
    }, [data]);

    const notifications = useMemo(() => {
        const failedOrders = data.orders.filter((order) => String(order.paymentStatus || order.status || "").toLowerCase() === "failed" || (!order.paymentId && order.status !== "confirmed"));
        const pendingDonations = data.donations.filter((donation) => isPendingStatus(donation.status));
        const pendingStories = data.stories.filter((story) => isPendingStatus(story.status));
        const lowStockProducts = data.products.filter((product) => Number(product.stock || 0) <= 5);
        const pendingCommunityComments = data.communityComments;

        const items = [];

        if (pendingStories.length) {
            items.push({
                title: "Impact stories need approval",
                detail: `${pendingStories.length} story ${pendingStories.length === 1 ? "is" : "are"} waiting for review.`,
                to: "/admin/donation-story-list",
                severity: "warning",
            });
        }

        if (pendingCommunityComments.length) {
            items.push({
                title: "Community comments need approval",
                detail: `${pendingCommunityComments.length} comment ${pendingCommunityComments.length === 1 ? "is" : "are"} waiting for moderation.`,
                to: "/admin/community",
                severity: "warning",
            });
        }

        if (pendingDonations.length) {
            items.push({
                title: "Donations pending review",
                detail: `${pendingDonations.length} donation ${pendingDonations.length === 1 ? "needs" : "need"} approval.`,
                to: "/admin/donation-tracker",
                severity: "warning",
            });
        }

        if (failedOrders.length) {
            items.push({
                title: "Failed order payments",
                detail: `${failedOrders.length} order ${failedOrders.length === 1 ? "has" : "have"} payment issues.`,
                to: "/admin/orders",
                severity: "danger",
            });
        }

        if (lowStockProducts.length) {
            items.push({
                title: "Low stock products",
                detail: `${lowStockProducts.length} product ${lowStockProducts.length === 1 ? "is" : "are"} at 5 units or fewer.`,
                to: "/admin/productlist",
                severity: "info",
            });
        }

        return items;
    }, [data]);

    const recentActivity = useMemo(() => {
        const activities = [
            ...data.orders.slice(0, 5).map((order) => ({
                type: "Order",
                title: order.orderId || order._id || "New order",
                detail: formatCurrency(order.total || order.subtotal || 0),
                date: order.createdAt,
                to: `/admin/view-orders/${order.orderId || order._id}`,
            })),
            ...data.blogs.map((post) => ({
                type: "Blog",
                title: post.title,
                detail: post.category || "Blog post",
                date: post.createdAt,
                to: `/admin/view-blog/${post._id}`,
            })),
            ...data.news.map((post) => ({
                type: "News",
                title: post.title,
                detail: "News article",
                date: post.createdAt,
                to: `/admin/view-news/${post._id}`,
            })),
            ...data.donations.slice(0, 5).map((donation) => ({
                type: "Donation",
                title: donation.campaignTitle || "Donation received",
                detail: formatCurrency(donation.amount),
                date: donation.createdAt,
                to: "/admin/donation-tracker",
            })),
            ...data.stories.slice(0, 5).map((story) => ({
                type: "Impact",
                title: story.title,
                detail: "Impact story",
                date: story.createdAt,
                to: "/admin/donation-story-list",
            })),
        ];

        return activities.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 8);
    }, [data]);

    const quickLinks = [
        {label: "Blog", helper: "Manage posts", to: "/admin/bloglist", icon: <FaBook />},
        {label: "News", helper: "Publish articles", to: "/admin/newslist", icon: <FaNewspaper />},
        {label: "Shop", helper: "Products and orders", to: "/admin/productlist", icon: <FaBoxOpen />},
        {label: "Community", helper: "Community tools", to: "/admin/community", icon: <FaComments />},
    ];

    return (
        <div className="dash-page">
            <div className="dash-header">
                <div>
                    <p className="dash-eyebrow">Admin Overview</p>
                    <h1>Dashboard</h1>
                    <p>Monitor site activity and jump quickly into the tools you use most.</p>
                </div>
                <button className="dash-refresh" type="button" onClick={() => fetchDashboardData({silent: true})} disabled={refreshing}>
                    <FaSyncAlt className={refreshing ? "dash-spin" : ""} />
                    {refreshing ? "Refreshing" : "Refresh"}
                </button>
            </div>

            {loading ? (
                <div className="dash-loading">
                    <Loading message="Loading dashboard..." />
                </div>
            ) : (
                <>
                    {error && <div className="dash-alert dash-alert--error">{error}</div>}

                    <section className="dash-panel">
                        <div className="dash-panel-heading">
                            <div>
                                <h2>Overview Panel</h2>
                                <p>{lastUpdated ? `Last updated ${formatDate(lastUpdated)}` : "Live site snapshot"}</p>
                            </div>
                            <span className="dash-live-pill">Auto-refresh 60s</span>
                        </div>
                        <div className="dash-metrics">
                            {stats.map((stat) => (
                                <div className={`dash-metric dash-metric--${stat.tone}`} key={stat.label}>
                                    <span className="dash-metric-icon">{stat.icon}</span>
                                    <span className="dash-metric-label">{stat.label}</span>
                                    <strong>{stat.value}</strong>
                                    <small>{stat.helper}</small>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="dash-panel">
                        <div className="dash-panel-heading">
                            <div>
                                <h2>Quick Links</h2>
                                <p>Open key management areas in one click.</p>
                            </div>
                        </div>
                        <div className="dash-quick-grid">
                            {quickLinks.map((link) => (
                                <Link className="dash-quick-link" to={link.to} key={link.label}>
                                    <span>{link.icon}</span>
                                    <strong>{link.label}</strong>
                                    <small>{link.helper}</small>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <div className="dash-main-grid">
                        <section className="dash-panel">
                            <div className="dash-panel-heading">
                                <div>
                                    <h2>Recent Activity</h2>
                                    <p>Latest orders, posts, donations, and stories.</p>
                                </div>
                            </div>
                            <div className="dash-activity-list">
                                {recentActivity.length ? (
                                    recentActivity.map((activity, index) => (
                                        <Link className="dash-activity-item" to={activity.to} key={`${activity.type}-${activity.title}-${index}`}>
                                            <span className="dash-activity-type">{activity.type}</span>
                                            <div>
                                                <strong>{activity.title}</strong>
                                                <small>{activity.detail}</small>
                                            </div>
                                            <time>{formatDate(activity.date)}</time>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="dash-empty">No recent activity yet.</div>
                                )}
                            </div>
                        </section>

                        <section className="dash-panel">
                            <div className="dash-panel-heading">
                                <div>
                                    <h2>Notifications</h2>
                                    <p>Alerts for pending approvals and action items.</p>
                                </div>
                                <FaBell className="dash-bell" />
                            </div>
                            <div className="dash-notification-list">
                                {notifications.length ? (
                                    notifications.map((item) => (
                                        <Link className={`dash-notification dash-notification--${item.severity}`} to={item.to} key={item.title}>
                                            <span>{item.severity === "danger" ? <FaExclamationCircle /> : <FaBell />}</span>
                                            <div>
                                                <strong>{item.title}</strong>
                                                <small>{item.detail}</small>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="dash-notification dash-notification--success">
                                        <span>
                                            <FaCheckCircle />
                                        </span>
                                        <div>
                                            <strong>No pending approvals</strong>
                                            <small>Donations, stories, comments, and store alerts look clear.</small>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
