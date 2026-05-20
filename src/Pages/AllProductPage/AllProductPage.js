import React from "react";
import Loading from "../../components/Loading";
import {useCart} from "../../CartContext";
import axios from "axios";
import "./allProductPage.css";
import {Link, useNavigate} from "react-router-dom";
import {FaArrowLeft, FaBoxOpen, FaEye, FaSearch, FaShoppingCart, FaSlidersH} from "react-icons/fa";
import {toast} from "react-toastify";
import {getProductId, getProductImage, getProductName, getProductPrice, getProductRouteId, getProductsFromResponse, toCartItem} from "../../utils/productHelpers";

const reducer = (state, action) => {
    switch (action.type) {
        case "FETCH_REQUEST":
            return {...state, loading: true};
        case "FETCH_SUCCESS":
            return {...state, loading: false, products: action.payload};
        case "FETCH_FAIL":
            return {...state, loading: false, error: action.payload};
        default:
            return state;
    }
};

const getCategoryName = (product) => {
    const category = product?.category;
    if (!category) return "Uncategorized";
    if (typeof category === "string") return category;
    return category.name || "Uncategorized";
};

const parsePrice = (value) => parseFloat(String(value ?? 0).replace(/[^0-9.]/g, "")) || 0;

const formatPrice = (value) => `$${parsePrice(value).toFixed(2)}`;

const ITEMS_PER_PAGE = 6;

export default function AllProductPage() {
    const navigate = useNavigate();
    const {addToCart, getCartCount} = useCart();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedCategory, setSelectedCategory] = React.useState("All");
    const [sortBy, setSortBy] = React.useState("latest");
    const [currentPage, setCurrentPage] = React.useState(1);
    const [{loading, products, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        products: [],
        error: "",
    });

    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
            try {
                const result = await axios.get("/api/products", {params: {limit: 100}});
                dispatch({type: "FETCH_SUCCESS", payload: getProductsFromResponse(result.data)});
            } catch (error) {
                dispatch({type: "FETCH_FAIL", payload: error.message});
            }
        };
        fetchData();
    }, []);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategory, sortBy]);

    const categories = React.useMemo(() => {
        const categorySet = new Set(products.map((product) => getCategoryName(product)).filter(Boolean));
        return ["All", ...Array.from(categorySet).sort((a, b) => a.localeCompare(b))];
    }, [products]);

    const filteredProducts = React.useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        const results = products.filter((product) => {
            const name = getProductName(product).toLowerCase();
            const description = (product?.description || "").toLowerCase();
            const category = getCategoryName(product);
            const matchesSearch = !normalizedSearch || name.includes(normalizedSearch) || description.includes(normalizedSearch) || category.toLowerCase().includes(normalizedSearch);
            const matchesCategory = selectedCategory === "All" || category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        return [...results].sort((a, b) => {
            if (sortBy === "price-low") return parsePrice(getProductPrice(a)) - parsePrice(getProductPrice(b));
            if (sortBy === "price-high") return parsePrice(getProductPrice(b)) - parsePrice(getProductPrice(a));
            if (sortBy === "name") return getProductName(a).localeCompare(getProductName(b));
            return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
        });
    }, [products, searchTerm, selectedCategory, sortBy]);

    const handleAddToCart = (product) => {
        addToCart(toCartItem(product));
        toast.success(`${getProductName(product)} added to cart`);
    };

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const pageStart = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const paginatedProducts = filteredProducts.slice(pageStart, pageStart + ITEMS_PER_PAGE);
    const visiblePageNumbers = Array.from({length: totalPages}, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - safeCurrentPage) <= 1);
    const showingStart = filteredProducts.length === 0 ? 0 : pageStart + 1;
    const showingEnd = Math.min(pageStart + ITEMS_PER_PAGE, filteredProducts.length);

    return (
        <div className="allproduct-page-container">
            <div className="allproduct-page-content">
                <header className="allproduct-topbar">
                    <button type="button" className="allproduct-back-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft />
                        Back
                    </button>
                    <Link to="/cart" className="allproduct-cart-link" aria-label="View cart">
                        <span className="allproduct-cart-count">{getCartCount()}</span>
                        <img src={require("../../assets/img/htbc-cart.png")} alt="" />
                        <span>My Cart</span>
                    </Link>
                </header>

                <section className="allproduct-hero">
                    <div>
                        <span className="allproduct-eyebrow">HTBC Shop</span>
                        <h1>Catholic Books, Devotionals and Gifts</h1>
                        <p>Browse thoughtfully selected items for prayer, study, and everyday faith.</p>
                    </div>
                    <div className="allproduct-hero-stat">
                        <strong>{products.length}</strong>
                        <span>{products.length === 1 ? "Item available" : "Items available"}</span>
                    </div>
                </section>

                <section className="allproduct-toolbar" aria-label="Product filters">
                    <label className="allproduct-search">
                        <FaSearch />
                        <input type="search" placeholder="Search products" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                    </label>

                    <label className="allproduct-select">
                        <span>Category</span>
                        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="allproduct-select">
                        <span>Sort</span>
                        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                            <option value="latest">Latest</option>
                            <option value="price-low">Price: low to high</option>
                            <option value="price-high">Price: high to low</option>
                            <option value="name">Name</option>
                        </select>
                    </label>

                    <div className="allproduct-result-count">
                        <FaSlidersH />
                        <span>
                            {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}
                        </span>
                    </div>
                </section>

                {loading ? (
                    <div className="allproduct-state">
                        <Loading />
                    </div>
                ) : error ? (
                    <div className="allproduct-state allproduct-state-error">{error}</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="allproduct-state allproduct-state-empty">
                        <FaBoxOpen />
                        <h2>No products found</h2>
                        <p>Try a different search or category.</p>
                    </div>
                ) : (
                    <>
                        <div className="allproduct-content">
                            {paginatedProducts.map((product) => {
                            const id = getProductId(product);
                            const routeId = getProductRouteId(product);
                            const name = getProductName(product);
                            const image = getProductImage(product);
                            const price = getProductPrice(product);
                            const category = getCategoryName(product);
                            const stock = Number(product?.stock ?? 0);
                            const isOutOfStock = stock <= 0;

                            return (
                                <article key={id} className="allproduct-card">
                                    <Link to={`/product/${routeId}`} className="allproduct-card-image" aria-label={`View ${name}`}>
                                        <img src={image} alt={name} />
                                        <span className={`allproduct-stock ${isOutOfStock ? "is-out" : ""}`}>{isOutOfStock ? "Out of stock" : "In stock"}</span>
                                    </Link>

                                    <div className="allproduct-card-body">
                                        <span className="allproduct-category">{category}</span>
                                        <Link to={`/product/${routeId}`} className="allproduct-name">
                                            {name}
                                        </Link>
                                        <p>{product?.description || "A thoughtfully selected item from the HTBC shop."}</p>
                                    </div>

                                    <div className="allproduct-card-footer">
                                        <strong>{formatPrice(price)}</strong>
                                        <div className="allproduct-card-actions">
                                            <Link to={`/product/${routeId}`} className="allproduct-view-btn" aria-label={`View details for ${name}`}>
                                                <FaEye />
                                            </Link>
                                            <button type="button" className="allproduct-add-btn" onClick={() => handleAddToCart(product)} disabled={isOutOfStock}>
                                                <FaShoppingCart />
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                            })}
                        </div>

                        <nav className="allproduct-pagination" aria-label="Product pagination">
                            <p>
                                Showing {showingStart}-{showingEnd} of {filteredProducts.length} products
                            </p>
                            <div className="allproduct-pagination-controls">
                                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>
                                    Previous
                                </button>
                                {visiblePageNumbers.map((page, index) => {
                                    const previousPage = visiblePageNumbers[index - 1];
                                    const shouldShowGap = previousPage && page - previousPage > 1;
                                    return (
                                        <React.Fragment key={page}>
                                            {shouldShowGap && <span className="allproduct-pagination-gap">...</span>}
                                            <button type="button" className={page === safeCurrentPage ? "is-active" : ""} onClick={() => setCurrentPage(page)} aria-current={page === safeCurrentPage ? "page" : undefined}>
                                                {page}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>
                                    Next
                                </button>
                            </div>
                        </nav>
                    </>
                )}
            </div>
        </div>
    );
}
