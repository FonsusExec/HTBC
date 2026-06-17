import {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import {FaEdit, FaEye, FaQuoteLeft, FaSave, FaSearch, FaTimes, FaTrash} from "react-icons/fa";
import Loading from "../../components/Loading";
import {getAuthHeaders} from "../../utils/authHeaders";
import "./testimonialsAdmin.css";

const PAGE_SIZE = 8;

const emptyForm = {
    name: "",
    role: "",
    quote: "",
    order: "0",
    status: "active",
    image: null,
};

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return "";
    if (typeof imageUrl !== "string") return imageUrl;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("blob:") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const createAuthConfig = () => ({headers: getAuthHeaders()});

const truncateText = (value = "", length = 96) => {
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length > length ? `${text.slice(0, length)}...` : text;
};

export default function TestimonialsAdmin() {
    const [testimonials, setTestimonials] = useState([]);
    const [totalTestimonials, setTotalTestimonials] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [form, setForm] = useState(emptyForm);
    const [imagePreview, setImagePreview] = useState("");
    const [editingId, setEditingId] = useState("");
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);
    const [testimonialToDelete, setTestimonialToDelete] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState("");

    const totalPages = Math.max(1, Math.ceil(totalTestimonials / PAGE_SIZE));

    const fetchTestimonials = useCallback(async () => {
        try {
            setLoading(true);
            const {data} = await axios.get("/api/testimonials/admin", {
                ...createAuthConfig(),
                params: {
                    page: currentPage,
                    limit: PAGE_SIZE,
                    search: searchTerm.trim(),
                    status: statusFilter,
                },
            });

            setTestimonials(data.testimonials || []);
            setTotalTestimonials(data.total || 0);
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to load testimonials");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter]);

    useEffect(() => {
        fetchTestimonials();
    }, [fetchTestimonials]);

    const handleInputChange = (e) => {
        const {name, value, files} = e.target;

        if (name === "image") {
            const file = files?.[0] || null;
            setForm((currentForm) => ({...currentForm, image: file}));
            setImagePreview(file ? URL.createObjectURL(file) : "");
            return;
        }

        setForm((currentForm) => ({...currentForm, [name]: value}));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setImagePreview("");
        setEditingId("");
    };

    const editTestimonial = (testimonial) => {
        setEditingId(testimonial._id);
        setForm({
            name: testimonial.name || "",
            role: testimonial.role || "",
            quote: testimonial.quote || "",
            order: String(testimonial.order || 0),
            status: testimonial.status || "active",
            image: null,
        });
        setImagePreview(getImageSrc(testimonial.imageUrl));
    };

    const saveTestimonial = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.quote.trim()) {
            toast.warning("Name and quote are required");
            return;
        }

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("role", form.role);
        formData.append("quote", form.quote);
        formData.append("order", form.order || 0);
        formData.append("status", form.status);
        if (form.image) formData.append("image", form.image);

        try {
            setSaving(true);
            if (editingId) {
                await axios.put(`/api/testimonials/${editingId}`, formData, createAuthConfig());
                toast.success("Testimonial updated");
            } else {
                await axios.post("/api/testimonials", formData, createAuthConfig());
                toast.success("Testimonial created");
            }

            resetForm();
            fetchTestimonials();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to save testimonial");
        } finally {
            setSaving(false);
        }
    };

    const deleteTestimonial = async () => {
        if (!testimonialToDelete?._id) return;

        try {
            setDeletingId(testimonialToDelete._id);
            await axios.delete(`/api/testimonials/${testimonialToDelete._id}`, createAuthConfig());
            toast.success("Testimonial deleted");
            setTestimonialToDelete(null);

            if (testimonials.length === 1 && currentPage > 1) {
                setCurrentPage((page) => page - 1);
            } else {
                fetchTestimonials();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to delete testimonial");
        } finally {
            setDeletingId("");
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) return Array.from({length: totalPages}, (_, index) => index + 1);

        const pages = [1];
        if (currentPage > 3) pages.push("...");

        for (let page = Math.max(2, currentPage - 1); page <= Math.min(totalPages - 1, currentPage + 1); page += 1) {
            pages.push(page);
        }

        if (currentPage < totalPages - 2) pages.push("...");
        pages.push(totalPages);
        return pages;
    };

    const activeCount = testimonials.filter((testimonial) => testimonial.status === "active").length;
    const showingStart = totalTestimonials === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const showingEnd = Math.min(currentPage * PAGE_SIZE, totalTestimonials);

    return (
        <div className="testimonials-admin-page">
            <div className="testimonials-admin-card">
                <div className="testimonials-admin-header">
                    <div>
                        <p className="testimonials-admin-eyebrow">Community Management</p>
                        <h1>Testimonials</h1>
                        <p>Create and manage the testimonials shown on the public About page.</p>
                    </div>
                    <span className="testimonials-admin-icon">
                        <FaQuoteLeft />
                    </span>
                </div>

                <div className="testimonials-admin-stats">
                    <div className="testimonials-admin-stat">
                        <span>
                            <FaQuoteLeft />
                        </span>
                        <strong>{totalTestimonials}</strong>
                        <small>Total testimonials</small>
                    </div>
                    <div className="testimonials-admin-stat">
                        <span>
                            <FaQuoteLeft />
                        </span>
                        <strong>{activeCount}</strong>
                        <small>Visible in current view</small>
                    </div>
                </div>

                <section className="testimonials-admin-section">
                    <form className="testimonials-admin-form" onSubmit={saveTestimonial}>
                        <div className="testimonials-admin-section-header">
                            <div>
                                <h2>{editingId ? "Edit Testimonial" : "Create Testimonial"}</h2>
                                <p>Use draft or archived to keep a testimonial hidden from the public page.</p>
                            </div>
                            {editingId && (
                                <button type="button" className="testimonials-admin-secondary" onClick={resetForm}>
                                    <FaTimes />
                                    Cancel
                                </button>
                            )}
                        </div>

                        <label>
                            Name
                            <input type="text" name="name" value={form.name} onChange={handleInputChange} placeholder="Full name" />
                        </label>
                        <div className="testimonials-admin-grid">
                            <label>
                                Role
                                <input type="text" name="role" value={form.role} onChange={handleInputChange} placeholder="Member, donor..." />
                            </label>
                            <label>
                                Display Order
                                <input type="number" name="order" value={form.order} onChange={handleInputChange} />
                            </label>
                        </div>
                        <small className="testimonials-admin-field-tip">Lower numbers show first on the public About page. Use 1, 2, 3 to control the order.</small>
                        <label>
                            Quote
                            <textarea name="quote" value={form.quote} onChange={handleInputChange} rows="5" placeholder="What did they say?" />
                        </label>
                        <div className="testimonials-admin-grid">
                            <label>
                                Status
                                <select name="status" value={form.status} onChange={handleInputChange}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </label>
                            <label>
                                Image
                                <input type="file" name="image" accept="image/*" onChange={handleInputChange} />
                            </label>
                        </div>

                        {imagePreview && (
                            <div className="testimonials-admin-preview">
                                <img src={imagePreview} alt="Testimonial preview" />
                            </div>
                        )}

                        <button type="submit" className="testimonials-admin-primary" disabled={saving}>
                            <FaSave />
                            {saving ? "Saving..." : editingId ? "Update Testimonial" : "Create Testimonial"}
                        </button>
                    </form>
                </section>

                <section className="testimonials-admin-section testimonials-admin-table-section">
                    <div className="testimonials-admin-list">
                        <div className="testimonials-admin-section-header">
                            <div>
                                <h2>Manage Testimonials</h2>
                                <p>Search, view, edit, or delete submitted testimonials.</p>
                            </div>
                        </div>

                        <div className="testimonials-admin-toolbar">
                            <label className="testimonials-admin-search">
                                <span>
                                    <FaSearch />
                                </span>
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search testimonials"
                                />
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All status</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                            <button type="button" onClick={resetFilters}>
                                Reset
                            </button>
                        </div>

                        {loading ? (
                            <div className="testimonials-admin-loading">
                                <Loading message="Loading testimonials..." />
                            </div>
                        ) : (
                            <>
                                <div className="testimonials-admin-table-wrapper">
                                    <table className="testimonials-admin-table">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Name</th>
                                                <th>Quote</th>
                                                <th>Status</th>
                                                <th>Order</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {testimonials.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="testimonials-admin-empty">
                                                        No testimonials found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                testimonials.map((testimonial) => (
                                                    <tr key={testimonial._id}>
                                                        <td>
                                                            {testimonial.imageUrl ? (
                                                                <img className="testimonials-admin-thumb" src={getImageSrc(testimonial.imageUrl)} alt={testimonial.name} />
                                                            ) : (
                                                                <span className="testimonials-admin-placeholder">
                                                                    <FaQuoteLeft />
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="testimonials-admin-name">
                                                            {testimonial.name}
                                                            {testimonial.role && <small>{testimonial.role}</small>}
                                                        </td>
                                                        <td className="testimonials-admin-quote">{truncateText(testimonial.quote)}</td>
                                                        <td>
                                                            <span className={`testimonials-admin-status testimonials-admin-status--${testimonial.status}`}>{testimonial.status}</span>
                                                        </td>
                                                        <td>{testimonial.order || 0}</td>
                                                        <td>
                                                            <div className="testimonials-admin-actions">
                                                                <button type="button" onClick={() => setSelectedTestimonial(testimonial)}>
                                                                    <FaEye />
                                                                    View
                                                                </button>
                                                                <button type="button" onClick={() => editTestimonial(testimonial)}>
                                                                    <FaEdit />
                                                                    Edit
                                                                </button>
                                                                <button type="button" className="testimonials-admin-danger" onClick={() => setTestimonialToDelete(testimonial)}>
                                                                    <FaTrash />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {totalPages > 1 && (
                                    <div className="testimonials-admin-pagination">
                                        <span>
                                            Showing {showingStart}-{showingEnd} of {totalTestimonials}
                                        </span>
                                        <div className="testimonials-admin-page-controls">
                                            <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                                                &#8249;
                                            </button>
                                            {getPageNumbers().map((page, index) =>
                                                page === "..." ? (
                                                    <span key={`dots-${index}`} className="testimonials-admin-page-dots">
                                                        ...
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={page}
                                                        type="button"
                                                        className={currentPage === page ? "is-active" : ""}
                                                        onClick={() => goToPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                ),
                                            )}
                                            <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                                                &#8250;
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </section>
            </div>

            {selectedTestimonial && (
                <div className="testimonials-admin-modal-overlay" onClick={() => setSelectedTestimonial(null)}>
                    <div className="testimonials-admin-modal" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="testimonials-admin-modal-close" onClick={() => setSelectedTestimonial(null)}>
                            x
                        </button>
                        {selectedTestimonial.imageUrl && <img src={getImageSrc(selectedTestimonial.imageUrl)} alt={selectedTestimonial.name} />}
                        <span className={`testimonials-admin-status testimonials-admin-status--${selectedTestimonial.status}`}>{selectedTestimonial.status}</span>
                        <h2>{selectedTestimonial.name}</h2>
                        {selectedTestimonial.role && <small>{selectedTestimonial.role}</small>}
                        <p>{selectedTestimonial.quote}</p>
                    </div>
                </div>
            )}

            {testimonialToDelete && (
                <div className="testimonials-admin-confirm-overlay">
                    <div className="testimonials-admin-confirm">
                        <div className="testimonials-admin-confirm-icon">!</div>
                        <h3>Confirm Deletion</h3>
                        <p>
                            Are you sure you want to delete the testimonial from <strong>{testimonialToDelete.name}</strong>?
                        </p>
                        <div className="testimonials-admin-confirm-actions">
                            <button type="button" onClick={() => setTestimonialToDelete(null)} disabled={Boolean(deletingId)}>
                                Cancel
                            </button>
                            <button type="button" className="testimonials-admin-confirm-delete" onClick={deleteTestimonial} disabled={Boolean(deletingId)}>
                                {deletingId ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
