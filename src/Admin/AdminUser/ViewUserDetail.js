import {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import "./viewUserDetail.css";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

export default function ViewUserDetail() {
    const navigate = useNavigate();
    const {id} = useParams();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setLoading(true);
                const {data} = await axios.get(`/api/admin/users/${id}`);
                setUser(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load user details.");
                toast.error("Failed to load user");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`/api/admin/users/${id}`);
            toast.success("User deleted successfully");
            navigate("/admin/users");
        } catch (err) {
            toast.error("Failed to delete user");
        } finally {
            setDeleting(false);
            setShowConfirm(false);
        }
    };

    // Derived display helpers
    const getInitials = (name) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleHue = (role) => {
        if (!role) return 200;
        let hash = 0;
        for (let i = 0; i < role.length; i++) hash = role.charCodeAt(i) + ((hash << 5) - hash);
        return Math.abs(hash) % 360;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString("en-US", {year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
    };

    const statusLabel = user?.isActive !== false ? "Active" : "Inactive";

    // ── Render ──────────────────────────────────────────────────────────
    if (loading)
        return (
            <div className="vu-wrapper">
                <div className="vu-card vu-card--loading">
                    <Loading />
                </div>
            </div>
        );

    if (error)
        return (
            <div className="vu-wrapper">
                <div className="vu-card vu-card--error">
                    <p>{error}</p>
                    <button className="vu-back-btn" onClick={() => navigate(-1)}>
                        ← Go Back
                    </button>
                </div>
            </div>
        );

    const displayRole = user?.role || (user?.isAdmin ? "Admin" : "Viewer");
    const hue = getRoleHue(displayRole);

    return (
        <div className="vu-wrapper">
            <div className="vu-card">
                {/* ── Top bar ── */}
                <div className="vu-topbar">
                    <button className="vu-back-btn" onClick={() => navigate(-1)}>
                        <span>‹</span> Back
                    </button>
                    <h1 className="vu-page-title">User Details</h1>
                    <div className="vu-topbar-actions">
                        <button className="vu-btn vu-btn--edit" onClick={() => navigate(`/admin/edit-users/${id}`)}>
                            Edit User
                        </button>
                        <button className="vu-btn vu-btn--delete" onClick={() => setShowConfirm(true)}>
                            Delete
                        </button>
                    </div>
                </div>

                {/* ── Profile header ── */}
                <div className="vu-profile-header">
                    <div className="vu-avatar" style={{"--hue": hue}}>
                        {user?.profileImage ? <img src={user.profileImage} alt={user.name} className="vu-avatar-img" /> : <span className="vu-avatar-initials">{getInitials(user?.name)}</span>}
                    </div>
                    <div className="vu-profile-meta">
                        <h2 className="vu-user-name">{user?.name || "—"}</h2>
                        <p className="vu-user-email">{user?.email || "—"}</p>
                        <div className="vu-profile-badges">
                            <span className="vu-role-badge" style={{"--hue": hue}}>
                                {displayRole}
                            </span>
                            <span className={`vu-status-badge vu-status-badge--${statusLabel.toLowerCase()}`}>
                                <span className="vu-status-dot" /> {statusLabel}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Info sections ── */}
                <div className="vu-sections">
                    {/* Personal Information */}
                    <section className="vu-section">
                        <h3 className="vu-section-title">
                            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                                <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Personal Information
                        </h3>
                        <div className="vu-field-grid">
                            <div className="vu-field">
                                <span className="vu-field-label">Full Name</span>
                                <span className="vu-field-value">{user?.name || "—"}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Email Address</span>
                                <span className="vu-field-value">{user?.email || "—"}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Phone Number</span>
                                <span className="vu-field-value">{user?.phone || "—"}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Date of Birth</span>
                                <span className="vu-field-value">{formatDate(user?.dateOfBirth)}</span>
                            </div>
                            <div className="vu-field vu-field--full">
                                <span className="vu-field-label">Address</span>
                                <span className="vu-field-value">
                                    {user?.address ? `${user.address.street || ""} ${user.address.city || ""} ${user.address.state || ""} ${user.address.country || ""}`.trim() || "—" : "—"}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Account Information */}
                    <section className="vu-section">
                        <h3 className="vu-section-title">
                            <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                                <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M3 9h14" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M7 13h2M11 13h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Account Information
                        </h3>
                        <div className="vu-field-grid">
                            <div className="vu-field">
                                <span className="vu-field-label">Role</span>
                                <span className="vu-field-value">
                                    <span className="vu-role-badge vu-role-badge--inline" style={{"--hue": hue}}>
                                        {displayRole}
                                    </span>
                                </span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Account Status</span>
                                <span className="vu-field-value">
                                    <span className={`vu-status-badge vu-status-badge--${statusLabel.toLowerCase()}`}>
                                        <span className="vu-status-dot" /> {statusLabel}
                                    </span>
                                </span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Date Joined</span>
                                <span className="vu-field-value">{formatDate(user?.createdAt)}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Last Updated</span>
                                <span className="vu-field-value">{formatDate(user?.updatedAt)}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Last Login</span>
                                <span className="vu-field-value">{formatDateTime(user?.lastLogin)}</span>
                            </div>
                            <div className="vu-field">
                                <span className="vu-field-label">Email Verified</span>
                                <span className="vu-field-value">{user?.emailVerified ? <span className="vu-verified">✓ Verified</span> : <span className="vu-unverified">✗ Not verified</span>}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* ── Delete Confirm Modal ── */}
            {showConfirm && (
                <div className="vu-overlay">
                    <div className="vu-modal">
                        <div className="vu-modal__icon">🗑️</div>
                        <h3 className="vu-modal__title">Delete User</h3>
                        <p className="vu-modal__body">
                            Are you sure you want to delete <strong>{user?.name}</strong>?
                            <br />
                            This action cannot be undone.
                        </p>
                        <div className="vu-modal__actions">
                            <button className="vu-modal-btn vu-modal-btn--cancel" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="vu-modal-btn vu-modal-btn--delete" onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Deleting…" : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
