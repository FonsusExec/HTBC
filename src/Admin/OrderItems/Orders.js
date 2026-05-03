import {useState, useEffect, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./orders.css";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

const STATUS_TABS = ["All", "Success", "Failed"];
const DATE_FILTERS = ["Today", "This Week", "This Month", "All Time"];
const ITEMS_PER_PAGE = 10;

const paymentStyle = (p) => {
    if (p === "Success") return "ord-pay ord-pay--success";
    if (p === "Failed") return "ord-pay ord-pay--failed";
    return "ord-pay";
};

export default function AdminOrders() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState("All");
    const [dateFilter, setDateFilter] = useState("All Time");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [showDateDrop, setShowDateDrop] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Updated fetchOrders function
    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please login to view orders");
                toast.error("Authentication required. Please login.");
                return;
            }

            const {data} = await axios.get("/api/admin/orders", {
                headers: {Authorization: `Bearer ${token}`},
            });

            const formattedOrders = data.map((order) => ({
                id: order.orderId || order._id,
                _id: order._id,
                date: new Date(order.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                }),
                customer: order.user?.name || `${order.shipping?.firstName || ""} ${order.shipping?.lastName || ""}`.trim() || "Guest",
                items: order.items?.length || 0,
                total: order.total || order.subtotal || 0,
                payment: order.paymentStatus || (order.paymentId ? "Success" : "Failed"),
            }));

            setOrders(formattedOrders);
            setCurrentPage(1);
        } catch (err) {
            console.error("Error fetching orders:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
                toast.error("Session expired. Please login again.");
            } else {
                const msg = err.response?.data?.message || "Failed to load orders";
                setError(msg);
                toast.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Filtered and Paginated Orders
    const filteredAndPaginated = useMemo(() => {
        let list = [...orders];

        // Filter by Payment Status
        if (activeTab !== "All") {
            list = list.filter((o) => o.payment === activeTab);
        }

        // Search filter
        if (searchTerm.trim().length >= 2) {
            const term = searchTerm.toLowerCase();
            list = list.filter((o) => String(o.id).toLowerCase().includes(term) || o.customer.toLowerCase().includes(term));
        }

        const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedList = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return {
            list: paginatedList,
            totalItems: list.length,
            totalPages: Math.max(1, totalPages),
        };
    }, [orders, activeTab, searchTerm, currentPage]);

    const {list: displayedOrders, totalItems, totalPages} = filteredAndPaginated;

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleGenerateReport = () => {
        toast.info(`Generating report for ${dateFilter}...`);
    };

    return (
        <div className="ord-wrapper">
            <div className="ord-card">
                {/* Top Bar */}
                <div className="ord-topbar">
                    <button className="ord-back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1 className="ord-title">Orders Management</h1>
                </div>

                {/* Stats */}
                <div className="ord-stats">
                    <div className="ord-stat-card">
                        <span className="ord-stat-label">Total Orders</span>
                        <span className="ord-stat-value">{totalItems}</span>
                    </div>
                    <div className="ord-stat-card">
                        <span className="ord-stat-label">Total Revenue</span>
                        <span className="ord-stat-value">${filteredAndPaginated.list.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString("en-US", {minimumFractionDigits: 2})}</span>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="ord-filterbar">
                    <div className="ord-status-tabs">
                        {STATUS_TABS.map((tab) => (
                            <button key={tab} className={`ord-status-tab ${activeTab === tab ? "ord-status-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="ord-filterbar-right">
                        <div className={`ord-search-wrap ${searchOpen ? "ord-search-wrap--open" : ""}`}>
                            <button className="ord-search-icon-btn" onClick={() => setSearchOpen((p) => !p)}>
                                🔍
                            </button>
                            {searchOpen && (
                                <input autoFocus type="text" placeholder="Order # or customer name…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ord-search-input" />
                            )}
                        </div>

                        <div className="ord-date-wrap">
                            <button className="ord-date-btn" onClick={() => setShowDateDrop((p) => !p)}>
                                {dateFilter}
                                <span className="dropdown-arrow">▼</span>
                            </button>
                            {showDateDrop && (
                                <div className="ord-date-dropdown">
                                    {DATE_FILTERS.map((d) => (
                                        <button
                                            key={d}
                                            className={`ord-date-option ${dateFilter === d ? "ord-date-option--active" : ""}`}
                                            onClick={() => {
                                                setDateFilter(d);
                                                setShowDateDrop(false);
                                            }}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="ord-btn-report" onClick={handleGenerateReport}>
                            Generate Report
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="ord-table-wrap">
                    {loading ? (
                        <p className="ord-loading">
                            <Loading />
                        </p>
                    ) : error ? (
                        <p className="ord-error">{error}</p>
                    ) : (
                        <>
                            <table className="ord-table">
                                <thead>
                                    <tr>
                                        <th className="ord-th">Order #</th>
                                        <th className="ord-th">Date created</th>
                                        <th className="ord-th">Customer</th>
                                        <th className="ord-th">Items</th>
                                        <th className="ord-th">Total</th>
                                        <th className="ord-th">Payment</th>
                                        <th className="ord-th">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedOrders.map((order) => (
                                        <tr key={order.id} className="ord-row">
                                            <td className="ord-td ord-td--id">{order.id}</td>
                                            <td className="ord-td ord-td--date">{order.date}</td>
                                            <td className="ord-td ord-td--customer">
                                                {order.shipping?.name ||
                                                    (order.shipping?.firstName || order.shipping?.lastName ? `${order.shipping?.firstName || ""} ${order.shipping?.lastName || ""}`.trim() : "Guest")}
                                            </td>
                                            <td className="ord-td">{order.items}</td>
                                            <td className="ord-td ord-td--total">${order.total.toFixed(2)}</td>
                                            <td className="ord-td">
                                                <span className={paymentStyle(order.payment)}>{order.payment}</span>
                                            </td>
                                            <td className="ord-td ord-td--actions">
                                                <button className="ord-action-btn ord-action-btn--view" onClick={() => navigate(`/admin/view-orders/${order.id}`)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {displayedOrders.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="ord-empty">
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="ecm-pagination">
                                    <span className="ecm-pagination__info">
                                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} orders
                                    </span>
                                    <div className="ecm-pagination__controls">
                                        <button className="ecm-page-btn ecm-page-btn--nav" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                            ‹
                                        </button>
                                        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                                            <button key={page} className={`ecm-page-btn ${currentPage === page ? "ecm-page-btn--active" : ""}`} onClick={() => goToPage(page)}>
                                                {page}
                                            </button>
                                        ))}
                                        <button className="ecm-page-btn ecm-page-btn--nav" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                            ›
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
