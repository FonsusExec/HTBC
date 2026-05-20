import {useCallback, useEffect, useMemo, useState} from "react";
import axios from "axios";
import Loading from "../../components/Loading";
import "./donationTracker.css";

const FILTERS = ["All", "One-time", "Recurring"];
const PAGE_LIMIT = 10;

const formatCurrency = (amount = 0, currency = "usd") =>
    Number(amount || 0).toLocaleString("en-US", {
        style: "currency",
        currency: String(currency || "usd").toUpperCase(),
    });

const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const csvValue = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const normalizeDonation = (donation) => ({
    id: donation._id || donation.donationId,
    donationId: donation.donationId || donation._id || "N/A",
    campaignTitle: donation.campaignTitle || "Donation",
    name: donation.donor?.fullName || "Anonymous",
    email: donation.donor?.email || "N/A",
    phone: donation.donor?.phone || "N/A",
    type: donation.donationType || donation.type || "One-time",
    amount: formatCurrency(donation.amount, donation.currency),
    amountRaw: donation.amount || 0,
    currency: donation.currency || "usd",
    status: donation.status || "confirmed",
    paymentId: donation.paymentId || "N/A",
    date: formatDate(donation.createdAt),
    createdAt: donation.createdAt,
});

export default function DonationTracking() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [donations, setDonations] = useState([]);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalDonations, setTotalDonations] = useState(0);

    const totalPages = Math.max(1, Math.ceil(totalDonations / PAGE_LIMIT));

    const fetchDonations = useCallback(async () => {
        const token = localStorage.getItem("token");
        const config = {
            params: {
                page: currentPage,
                limit: PAGE_LIMIT,
                type: activeFilter,
            },
            ...(token ? {headers: {Authorization: `Bearer ${token}`}} : {}),
        };

        try {
            setLoading(true);
            setError("");
            const {data} = await axios.get("/api/admin/donations", config);
            setDonations((data.donations || []).map(normalizeDonation));
            setTotalDonations(data.total || 0);
        } catch (err) {
            console.error("Donation tracker fetch failed:", err);
            setDonations([]);
            setTotalDonations(0);
            setError(err.response?.data?.message || err.response?.data?.error || "Failed to load donations. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [activeFilter, currentPage]);

    useEffect(() => {
        fetchDonations();
    }, [fetchDonations]);

    const totalVisibleAmount = useMemo(() => donations.reduce((sum, donation) => sum + Number(donation.amountRaw || 0), 0), [donations]);

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    const handleExport = () => {
        const headers = ["Donation ID", "Campaign", "Name", "Email", "Phone", "Type", "Amount", "Status", "Date", "Payment ID"];
        const rows = donations.map((d) => [d.donationId, d.campaignTitle, d.name, d.email, d.phone, d.type, d.amount, d.status, d.date, d.paymentId].map(csvValue).join(","));
        const csv = [headers.map(csvValue).join(","), ...rows].join("\n");
        const blob = new Blob([csv], {type: "text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `donations-${activeFilter.toLowerCase().replace(/\s+/g, "-")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="dt-page">
            <div className="dt-container">
                <div className="dt-header">
                    <h1 className="dt-title">Donation Tracking</h1>
                    <p className="dt-summary">
                        {totalDonations} {activeFilter === "All" ? "donations" : activeFilter.toLowerCase() + " donations"} found
                        {donations.length > 0 ? ` - ${formatCurrency(totalVisibleAmount)} on this page` : ""}
                    </p>
                </div>

                <div className="dt-toolbar">
                    <div className="dt-filters">
                        {FILTERS.map((filter) => (
                            <button key={filter} className={`dt-filter-btn ${activeFilter === filter ? "dt-filter-btn--active" : ""}`} onClick={() => handleFilterChange(filter)}>
                                {filter}
                            </button>
                        ))}
                    </div>
                    <button className="dt-export-btn" onClick={handleExport} disabled={donations.length === 0}>
                        Export
                    </button>
                </div>

                {error && (
                    <div className="dt-error-banner">
                        <span>{error}</span>
                        <button type="button" onClick={fetchDonations}>
                            Retry
                        </button>
                    </div>
                )}

                <div className="dt-table-wrapper">
                    {loading ? (
                        <div className="dt-loading">
                            <Loading message="Loading donations..." />
                        </div>
                    ) : (
                        <table className="dt-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Campaign</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {donations.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="dt-empty">
                                            No donations found.
                                        </td>
                                    </tr>
                                ) : (
                                    donations.map((row) => (
                                        <tr key={row.id} className="dt-row">
                                            <td className="dt-cell dt-cell--name">{row.name}</td>
                                            <td className="dt-cell">{row.email}</td>
                                            <td className="dt-cell">{row.phone}</td>
                                            <td className="dt-cell">{row.campaignTitle}</td>
                                            <td className="dt-cell">
                                                <span className={`dt-badge dt-badge--${row.type === "Recurring" ? "recurring" : "onetime"}`}>{row.type}</span>
                                            </td>
                                            <td className="dt-cell dt-cell--amount">{row.amount}</td>
                                            <td className="dt-cell dt-cell--date">{row.date}</td>
                                            <td className="dt-cell">
                                                <button className="dt-view-btn" onClick={() => setSelectedDonation(row)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && totalPages > 1 && (
                    <div className="dt-pagination">
                        <button className="dt-page-btn" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button className="dt-page-btn" type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                )}
            </div>

            {selectedDonation && (
                <div className="dt-modal-overlay" onClick={() => setSelectedDonation(null)}>
                    <div className="dt-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="dt-modal-close" onClick={() => setSelectedDonation(null)}>
                            x
                        </button>
                        <h2>Donation Details</h2>
                        <div className="dt-modal-grid">
                            <div>
                                <span>Name</span>
                                <strong>{selectedDonation.name}</strong>
                            </div>
                            <div>
                                <span>Email</span>
                                <strong>{selectedDonation.email}</strong>
                            </div>
                            <div>
                                <span>Phone</span>
                                <strong>{selectedDonation.phone}</strong>
                            </div>
                            <div>
                                <span>Campaign</span>
                                <strong>{selectedDonation.campaignTitle}</strong>
                            </div>
                            <div>
                                <span>Type</span>
                                <strong>{selectedDonation.type}</strong>
                            </div>
                            <div>
                                <span>Amount</span>
                                <strong>{selectedDonation.amount}</strong>
                            </div>
                            <div>
                                <span>Status</span>
                                <strong>{selectedDonation.status}</strong>
                            </div>
                            <div>
                                <span>Date</span>
                                <strong>{selectedDonation.date}</strong>
                            </div>
                            <div>
                                <span>Donation ID</span>
                                <strong>{selectedDonation.donationId}</strong>
                            </div>
                            <div>
                                <span>Payment ID</span>
                                <strong>{selectedDonation.paymentId}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
