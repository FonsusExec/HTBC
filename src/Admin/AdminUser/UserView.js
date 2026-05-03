import {useState, useEffect, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./userView.css";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

const ITEMS_PER_PAGE = 10;

export default function UserView() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const {data} = await axios.get("/api/admin/users");
            setUsers(data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load users");
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const {data} = await axios.get("/api/roles");
            setRoles(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to load roles:", err);
            setRoles([]);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const getRoleHue = (role) => {
        if (!role) return 200;
        let hash = 0;
        const str = role.toLowerCase();
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 360;
    };

    const filteredAndPaginated = useMemo(() => {
        let list = [...users];

        // ── FIX: case-insensitive + handles role as object or string ──
        if (activeTab !== "All") {
            const tabLower = activeTab.toLowerCase();
            list = list.filter((user) => {
                const userRole = (user.role?.name || user.role || (user.isAdmin ? "Admin" : "Viewer")).toLowerCase();
                return userRole === tabLower;
            });
        }

        if (searchTerm.trim().length >= 2) {
            const term = searchTerm.toLowerCase();
            list = list.filter((user) => user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term));
        }

        const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedList = list.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return {list: paginatedList, totalItems: list.length, totalPages: Math.max(1, totalPages)};
    }, [users, activeTab, searchTerm, currentPage]);

    const {list: displayedUsers, totalItems, totalPages} = filteredAndPaginated;

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    const roleTabs = ["All", ...roles.map((r) => r.name)];

    return (
        <div className="al-wrapper">
            <div className="al-card">
                {/* ── Top bar: Back | Title (flex:1) | Create User ── */}
                <div className="al-topbar">
                    <button className="al-back-btn" onClick={() => navigate(-1)}>
                        <span className="al-back-arrow">‹</span> Back
                    </button>
                    <h1 className="al-title">Users Management</h1>
                    <button className="al-btn-create" onClick={() => navigate("/admin/create-user")}>
                        Create User
                    </button>
                </div>

                {/* ── Single row: Tabs (left) | Search (centered) ── */}
                <div className="al-filterbar">
                    <div className="al-tabs">
                        {roleTabs.map((tab) => (
                            <button
                                key={tab}
                                className={`al-tab ${activeTab === tab ? "al-tab--active" : ""}`}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setCurrentPage(1);
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="al-search-wrap">
                        <svg className="al-search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="al-search-input"
                        />
                    </div>
                </div>

                {/* ── Table ── */}
                <div className="al-table-wrap">
                    {loading ? (
                        <div className="al-loading">
                            <Loading />
                        </div>
                    ) : error ? (
                        <p className="al-error">{error}</p>
                    ) : (
                        <>
                            <table className="al-table">
                                <thead>
                                    <tr>
                                        <th className="al-th">Name</th>
                                        <th className="al-th">Email</th>
                                        <th className="al-th">Role</th>
                                        <th className="al-th">Date Created</th>
                                        <th className="al-th">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedUsers.map((user) => {
                                        const displayRole = user.role?.name || user.role || (user.isAdmin ? "Admin" : "Viewer");
                                        const hue = getRoleHue(displayRole);
                                        return (
                                            <tr key={user._id} className="al-row">
                                                <td className="al-td al-td--name">{user.name}</td>
                                                <td className="al-td al-td--email">{user.email}</td>
                                                <td className="al-td">
                                                    <span className="al-role al-role-custom" style={{"--hue": hue}}>
                                                        {displayRole}
                                                    </span>
                                                </td>
                                                <td className="al-td al-td--date">{new Date(user.createdAt).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"})}</td>
                                                <td className="al-td al-td--actions">
                                                    <button className="al-action-btn" onClick={() => navigate(`/admin/user-detail/${user._id}`)}>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {displayedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="al-empty">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {totalPages > 1 && (
                                <div className="ecm-pagination">
                                    <span className="ecm-pagination__info">
                                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} users
                                    </span>
                                    <div className="ecm-pagination__controls">
                                        <button className="ecm-page-btn ecm-page-btn--nav" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                            ‹
                                        </button>
                                        {getPageNumbers().map((page, idx) =>
                                            page === "..." ? (
                                                <span key={`ellipsis-${idx}`} className="ecm-page-ellipsis">
                                                    …
                                                </span>
                                            ) : (
                                                <button key={page} className={`ecm-page-btn ${currentPage === page ? "ecm-page-btn--active" : ""}`} onClick={() => goToPage(page)}>
                                                    {page}
                                                </button>
                                            ),
                                        )}
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
