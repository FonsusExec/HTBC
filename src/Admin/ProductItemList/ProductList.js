import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./productList.css";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";

export default function ProductList() {
    const navigate = useNavigate();

    // ── Shared ────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState("Products");

    // ── Products state ────────────────────────────────────────────────
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletingIds, setDeletingIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selected, setSelected] = useState([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const limit = 10;

    // ── Categories state ──────────────────────────────────────────────
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoryError, setCategoryError] = useState(null);
    const [deletingCatIds, setDeletingCatIds] = useState(new Set());
    const [showCatConfirm, setShowCatConfirm] = useState(false);
    const [catConfirmId, setCatConfirmId] = useState(null);

    // ── Helpers ───────────────────────────────────────────────────────
    const truncateText = (text, maxLength = 30) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    };

    // ── Fetch products ────────────────────────────────────────────────
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {page: currentPage, limit, search: searchTerm.trim(), category: selectedCategory};
            const {data} = await axios.get("/api/products", {params});
            setProducts(data.products || []);
            setTotalProducts(data.total || 0);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to load products. Please try again.");
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch categories ──────────────────────────────────────────────
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            setCategoryError(null);

            const {data} = await axios.get("/api/categories");

            // Fix: Use the data directly (it's an array), not data.categories
            setCategories(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategoryError("Failed to load categories. Please try again.");
            toast.error("Failed to load categories");
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Add this useEffect
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.length === 0 || trimmed.length >= 3) {
            fetchProducts();
        }
    }, [currentPage, selectedCategory, searchTerm]);

    useEffect(() => {
        if (activeTab === "Categories") fetchCategories();
    }, [activeTab]);

    // ── Products: pagination & selection ─────────────────────────────
    const totalPages = Math.ceil(totalProducts / limit);

    const toggleSelect = (id) => {
        setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
    };

    const toggleAll = () => {
        const pageIds = products.map((p) => p._id);
        const allSelected = pageIds.every((id) => selected.includes(id));
        if (allSelected) {
            setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
        } else {
            setSelected((prev) => [...new Set([...prev, ...pageIds])]);
        }
    };

    const showDeleteConfirm = (type, ids) => {
        setConfirmAction({type, ids});
        setShowConfirm(true);
    };

    const executeDelete = async (ids) => {
        setDeletingIds((prev) => new Set([...prev, ...ids]));
        try {
            await Promise.all(ids.map((id) => axios.delete(`/api/products/${id}`)));
            toast.success(`${ids.length} product(s) deleted successfully`);
            fetchProducts();
            setSelected((prev) => prev.filter((id) => !ids.includes(id)));
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete one or more products");
        } finally {
            setDeletingIds(new Set());
            setShowConfirm(false);
            setConfirmAction(null);
        }
    };

    const handleSingleDelete = (id) => showDeleteConfirm("single", [id]);
    const handleBulkDelete = () => {
        if (selected.length > 0) showDeleteConfirm("bulk", [...selected]);
    };

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

    const pageIds = products.map((p) => p._id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

    // ── Categories: delete ────────────────────────────────────────────
    const handleDeleteCategory = (id) => {
        setCatConfirmId(id);
        setShowCatConfirm(true);
    };

    const executeDeleteCategory = async () => {
        if (!catConfirmId) return;

        setDeletingCatIds((prev) => new Set([...prev, catConfirmId]));

        try {
            const res = await axios.delete(`/api/categories/${catConfirmId}`);

            toast.success("Category deleted successfully");
            fetchCategories(); // Refresh list
            setShowCatConfirm(false);
            setCatConfirmId(null);
        } catch (err) {
            console.error("Delete category error:", err);

            const errorMsg = err.response?.data?.message || "Failed to delete category";
            toast.error(errorMsg);
        } finally {
            setDeletingCatIds(new Set());
        }
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div className="ecm-wrapper">
            <div className="ecm-card">
                {/* Header */}
                <header className="ecm-header">
                    <h1 className="ecm-title">{activeTab === "Products" ? "E-Commerce Management" : "Categories"}</h1>
                </header>

                {/* Toolbar */}
                <div className="ecm-toolbar">
                    <div className="ecm-tabs">
                        {["Products", "Categories"].map((tab) => (
                            <button key={tab} className={`ecm-tab ${activeTab === tab ? "ecm-tab--active" : ""}`} onClick={() => setActiveTab(tab)}>
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Filters — Products tab only */}
                    {activeTab === "Products" && (
                        <div className="ecm-filters">
                            <div className="ecm-search-wrap">
                                <svg className="ecm-search-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
                                    <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by product name... (min 3 letters)"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="ecm-search"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="ecm-category-filter"
                            >
                                <option value="">All Categories</option>
                                <option value="Sacramentals">Sacramentals</option>
                                <option value="Books">Books</option>
                            </select>
                        </div>
                    )}

                    <div className="ecm-toolbar-right">
                        {activeTab === "Products" && selected.length > 0 && (
                            <button className="ecm-btn-delete-bulk" onClick={handleBulkDelete} disabled={deletingIds.size > 0}>
                                Delete Selected ({selected.length})
                            </button>
                        )}
                        {activeTab === "Products" ? (
                            <button className="ecm-btn-add" onClick={() => navigate("/admin/add-product")}>
                                Add Product
                            </button>
                        ) : (
                            <button className="ecm-btn-add" onClick={() => navigate("/admin/add-category")}>
                                Create Category
                            </button>
                        )}
                    </div>
                </div>

                {/* ══ PRODUCTS TABLE ══════════════════════════════════════ */}
                {activeTab === "Products" && (
                    <>
                        {loading && searchTerm.trim().length >= 3 && (
                            <div className="ecm-loading-row">
                                <Loading />
                            </div>
                        )}

                        <div className="ecm-table-wrap">
                            <table className="ecm-table">
                                <thead>
                                    <tr>
                                        <th className="ecm-th ecm-th--check">
                                            <input type="checkbox" checked={allPageSelected} onChange={toggleAll} className="ecm-checkbox" />
                                        </th>
                                        <th className="ecm-th">Product</th>
                                        <th className="ecm-th">Date created</th>
                                        <th className="ecm-th">Inventory</th>
                                        <th className="ecm-th">Price</th>
                                        <th className="ecm-th">Category</th>
                                        <th className="ecm-th">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product) => (
                                        <tr key={product._id} className={`ecm-row ${selected.includes(product._id) ? "ecm-row--selected" : ""}`}>
                                            <td className="ecm-td ecm-td--check">
                                                <input type="checkbox" checked={selected.includes(product._id)} onChange={() => toggleSelect(product._id)} className="ecm-checkbox" />
                                            </td>
                                            <td className="ecm-td ecm-td--product">
                                                <img
                                                    src={product.mainImage || (product.images && product.images[0]) || "https://placehold.co/48x48/e8dcc8/7a6a50?text=✝"}
                                                    alt={product.title}
                                                    className="ecm-product-img"
                                                />
                                                <span className="ecm-product-name" title={product.title}>
                                                    {truncateText(product.title)}
                                                </span>
                                            </td>
                                            <td className="ecm-td ecm-td--date">{new Date(product.createdAt).toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric"})}</td>
                                            <td className="ecm-td">{product.stock}</td>
                                            <td className="ecm-td ecm-td--price">${parseFloat(product.price).toFixed(2)}</td>
                                            <td className="ecm-td">{product.category?.name || product.category || "Uncategorized"}</td>
                                            <td className="ecm-td ecm-td--actions">
                                                <button className="ecm-action-btn ecm-action-btn--view" onClick={() => navigate(`/admin/view-product/${product._id}`)}>
                                                    View
                                                </button>
                                                <button className="ecm-action-btn ecm-action-btn--edit" onClick={() => navigate(`/admin/edit-product/${product._id}`)}>
                                                    Edit
                                                </button>
                                                <button className="ecm-action-btn ecm-action-btn--delete" onClick={() => handleSingleDelete(product._id)} disabled={deletingIds.has(product._id)}>
                                                    {deletingIds.has(product._id) ? "Deleting..." : "Delete"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan="7" className="ecm-empty">
                                                No products found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="ecm-pagination">
                                <span className="ecm-pagination__info">
                                    Showing {(currentPage - 1) * limit + 1}–{Math.min(currentPage * limit, totalProducts)} of {totalProducts} products
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

                {/* ══ CATEGORIES TABLE ════════════════════════════════════ */}
                {activeTab === "Categories" && (
                    <>
                        {loadingCategories ? (
                            <div className="ecm-state">
                                <Loading />
                            </div>
                        ) : categoryError ? (
                            <div className="ecm-state ecm-state--error">{categoryError}</div>
                        ) : (
                            <div className="ecm-table-wrap">
                                <table className="ecm-table">
                                    <thead>
                                        <tr>
                                            <th className="ecm-th">Category</th>
                                            <th className="ecm-th">Date created</th>
                                            <th className="ecm-th">Subcategories</th>
                                            <th className="ecm-th">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map((cat) => (
                                            <tr key={cat._id} className="ecm-row">
                                                <td className="ecm-td ecm-td--cat-name">{cat.name}</td>
                                                <td className="ecm-td ecm-td--date">
                                                    {new Date(cat.createdAt).toLocaleDateString("en-US", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}
                                                </td>
                                                <td className="ecm-td">{cat.subCategories?.length ?? 0}</td>
                                                <td className="ecm-td ecm-td--actions">
                                                    <button className="ecm-action-btn ecm-action-btn--edit" onClick={() => navigate(`/admin/edit-category/${cat._id}`)}>
                                                        Edit
                                                    </button>
                                                    <button className="ecm-action-btn ecm-action-btn--delete" onClick={() => handleDeleteCategory(cat._id)} disabled={deletingCatIds.has(cat._id)}>
                                                        {deletingCatIds.has(cat._id) ? "Deleting..." : "Delete"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {categories.length === 0 && !loadingCategories && (
                                            <tr>
                                                <td colSpan="4" className="ecm-empty">
                                                    No categories found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ══ PRODUCT DELETE CONFIRM MODAL ════════════════════════ */}
                {showConfirm && confirmAction && (
                    <div className="confirm-overlay">
                        <div className="confirm-modal">
                            <div className="confirm-modal__icon">🗑️</div>
                            <h3 className="confirm-modal__title">Confirm Deletion</h3>
                            <p className="confirm-modal__body">
                                Are you sure you want to delete <strong>{confirmAction.type === "bulk" ? `${confirmAction.ids.length} selected products` : "this product"}</strong>?
                                <br />
                                This action cannot be undone.
                            </p>
                            <div className="confirm-modal__actions">
                                <button className="confirm-btn confirm-btn--cancel" onClick={() => setShowConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="confirm-btn confirm-btn--delete" onClick={() => executeDelete(confirmAction.ids)} disabled={deletingIds.size > 0}>
                                    {deletingIds.size > 0 ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ CATEGORY DELETE CONFIRM MODAL ═══════════════════════ */}
                {showCatConfirm && catConfirmId && (
                    <div className="confirm-overlay">
                        <div className="confirm-modal">
                            <div className="confirm-modal__icon">🗑️</div>
                            <h3 className="confirm-modal__title">Confirm Deletion</h3>
                            <p className="confirm-modal__body">
                                Are you sure you want to delete <strong>this category</strong>?<br />
                                This action cannot be undone.
                                {catConfirmId && (
                                    <span style={{color: "#dc3545", fontSize: "0.95rem"}}>
                                        <br />
                                        Note: You can only delete categories that have no products assigned.
                                    </span>
                                )}
                            </p>
                            <div className="confirm-modal__actions">
                                <button className="confirm-btn confirm-btn--cancel" onClick={() => setShowCatConfirm(false)}>
                                    Cancel
                                </button>
                                <button className="confirm-btn confirm-btn--delete" onClick={executeDeleteCategory} disabled={deletingCatIds.size > 0}>
                                    {deletingCatIds.size > 0 ? "Deleting..." : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
