import {useState} from "react";
import "./donationTracker.css";

const DONATIONS = [
    {
        id: 1,
        name: "John Doe",
        email: "johndoe@email.com",
        phone: "Phone",
        type: "One-time",
        amount: "$250",
        date: "Jun. 24, 2025 12:10am",
    },
    {
        id: 2,
        name: "John Doe",
        email: "johndoe@email.com",
        phone: "Phone",
        type: "Recurring",
        amount: "$100",
        date: "Jun. 24, 2025 12:10am",
    },
    {
        id: 3,
        name: "John Doe",
        email: "johndoe@email.com",
        phone: "Phone",
        type: "One-time",
        amount: "$50",
        date: "Jun. 24, 2025 12:10am",
    },
];

const FILTERS = ["All", "One-time", "Recurring"];

export default function DonationTracking() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [selectedDonation, setSelectedDonation] = useState(null);

    const filtered = activeFilter === "All" ? DONATIONS : DONATIONS.filter((d) => d.type === activeFilter);

    const handleExport = () => {
        const headers = ["Name", "Email", "Phone", "Type", "Amount", "Date"];
        const rows = filtered.map((d) => [d.name, d.email, d.phone, d.type, d.amount, d.date].join(","));
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], {type: "text/csv"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "donations.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="dt-page">
            <div className="dt-container">
                {/* Header */}
                <div className="dt-header">
                    <h1 className="dt-title">Donation Tracking</h1>
                </div>

                {/* Toolbar */}
                <div className="dt-toolbar">
                    <div className="dt-filters">
                        {FILTERS.map((f) => (
                            <button key={f} className={`dt-filter-btn ${activeFilter === f ? "dt-filter-btn--active" : ""}`} onClick={() => setActiveFilter(f)}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <button className="dt-export-btn" onClick={handleExport}>
                        Export
                    </button>
                </div>

                {/* Table */}
                <div className="dt-table-wrapper">
                    <table className="dt-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="dt-empty">
                                        No donations found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((row) => (
                                    <tr key={row.id} className="dt-row">
                                        <td className="dt-cell dt-cell--name">{row.name}</td>
                                        <td className="dt-cell">{row.email}</td>
                                        <td className="dt-cell">{row.phone}</td>
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
                </div>
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
                                <span>Type</span>
                                <strong>{selectedDonation.type}</strong>
                            </div>
                            <div>
                                <span>Amount</span>
                                <strong>{selectedDonation.amount}</strong>
                            </div>
                            <div>
                                <span>Date</span>
                                <strong>{selectedDonation.date}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
