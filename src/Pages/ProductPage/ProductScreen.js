import React from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../ProductPage/productScreen.css";
import {useCart} from "../../CartContext";
import Loading from "../../components/Loading";
import {FaArrowLeft, FaCheckCircle, FaMinus, FaPlus, FaShoppingBag, FaShoppingCart} from "react-icons/fa";
import {getProductId, getProductImage, getProductName, getProductPrice, toCartItem} from "../../utils/productHelpers";
import {isDemoMode} from "../../demo/demoMode";
import {getDemoProductByRouteId} from "../../demo/demoData";

const reducer = (state, action) => {
    switch (action.type) {
        case "FETCH_REQUEST":
            return {...state, loading: true};
        case "FETCH_SUCCESS":
            return {...state, loading: false, product: action.payload};
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

export default function ProductScreen() {
    const navigate = useNavigate();
    const params = useParams();
    const {htbc: productParam} = params;
    const {getCartCount, addToCart, getCartItems, updateQty, removeFromCart} = useCart();
    const cartItems = getCartItems();

    const [{loading, product, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        product: null,
        error: "",
    });
    const [quantity, setQuantity] = React.useState(1);
    const [selectedImage, setSelectedImage] = React.useState("");

    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
            if (isDemoMode) {
                const demoProduct = getDemoProductByRouteId(productParam);
                dispatch(demoProduct ? {type: "FETCH_SUCCESS", payload: demoProduct} : {type: "FETCH_FAIL", payload: "This demo product could not be found."});
                return;
            }

            try {
                const isDatabaseId = /^[a-f\d]{24}$/i.test(productParam);
                const result = await axios.get(isDatabaseId ? `/api/products/${productParam}` : `/api/products/htbc/${productParam}`);
                dispatch({type: "FETCH_SUCCESS", payload: result.data});
            } catch (error) {
                dispatch({type: "FETCH_FAIL", payload: error.message});
            }
        };
        fetchData();
    }, [productParam]);

    const productImages = React.useMemo(() => {
        if (!product) return [];
        const images = [getProductImage(product), ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
        return Array.from(new Set(images));
    }, [product]);

    React.useEffect(() => {
        if (productImages.length > 0) {
            setSelectedImage(productImages[0]);
        }
    }, [productImages]);

    React.useEffect(() => {
        const productId = getProductId(product);
        if (!productId) return;
        const existItem = cartItems.find((item) => item._id === productId);
        setQuantity(existItem ? existItem.qty : 1);
    }, [product, cartItems]);

    const updateQuantity = (nextQuantity) => {
        const productId = getProductId(product);
        const hasStockValue = product?.stock !== undefined && product?.stock !== null && product?.stock !== "";
        const stock = hasStockValue ? Number(product.stock) : 0;
        const safeQuantity = Math.max(1, hasStockValue && stock > 0 ? Math.min(stock, nextQuantity) : nextQuantity);
        const existItem = cartItems.find((item) => item._id === productId);

        setQuantity(safeQuantity);
        if (existItem) {
            updateQty(productId, safeQuantity);
        }
    };

    const handleIncrement = () => {
        updateQuantity(quantity + 1);
    };

    const handleDecrement = () => {
        const productId = getProductId(product);
        const existItem = cartItems.find((item) => item._id === productId);

        if (quantity <= 1 && existItem) {
            removeFromCart(productId);
            setQuantity(1);
            return;
        }

        updateQuantity(quantity - 1);
    };

    const addCurrentSelectionToCart = () => {
        if (!product || quantity < 1) {
            toast.error("Please select a quantity");
            return false;
        }

        const hasStockValue = product?.stock !== undefined && product?.stock !== null && product?.stock !== "";
        const stock = hasStockValue ? Number(product.stock) : 0;
        if (hasStockValue && stock <= 0) {
            toast.error("This item is currently out of stock");
            return false;
        }

        const cartItem = toCartItem(product, quantity);
        const existItem = cartItems.find((item) => item._id === cartItem._id);

        if (existItem) {
            updateQty(cartItem._id, quantity);
            toast.info(`Updated ${cartItem.name} quantity to ${quantity}`);
        } else {
            addToCart(cartItem);
            toast.success(`${quantity} ${cartItem.name} added to cart`);
        }

        return true;
    };

    const handleAddToCart = () => {
        addCurrentSelectionToCart();
    };

    const handleBuyNow = () => {
        if (addCurrentSelectionToCart()) {
            navigate("/cart");
        }
    };

    const cartCount = getCartCount();

    if (loading) {
        return (
            <div className="product-page-container">
                <div className="product-state">
                    <Loading />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-page-container">
                <div className="product-state product-state-error">{error}</div>
            </div>
        );
    }

    const productName = getProductName(product);
    const productPrice = getProductPrice(product);
    const productDescription = product?.description || "No description is available for this product yet.";
    const categoryName = getCategoryName(product);
    const hasStockValue = product?.stock !== undefined && product?.stock !== null && product?.stock !== "";
    const stock = hasStockValue ? Number(product.stock) : 0;
    const isOutOfStock = hasStockValue && stock <= 0;
    const stockLabel = isOutOfStock ? "Out of stock" : hasStockValue ? "In stock" : "Available";

    return (
        <div className="product-page-container">
            <div className="product-page">
                <header className="product-topbar">
                    <button type="button" className="product-back-btn" onClick={() => navigate("/all-products")}>
                        <FaArrowLeft />
                        Continue Shopping
                    </button>
                    <Link to="/cart" className="product-cart-link" aria-label="View cart">
                        <span className="product-cart-count">{cartCount}</span>
                        <img src={require("../../assets/img/htbc-cart.png")} alt="" />
                        <span>My Cart</span>
                    </Link>
                </header>

                <main className="product-content">
                    <section className="product-gallery" aria-label={`${productName} images`}>
                        <div className="product-main-image">
                            <img src={selectedImage || productImages[0]} alt={productName} />
                            <span className={`product-stock-badge ${isOutOfStock ? "is-out" : ""}`}>{stockLabel}</span>
                        </div>

                        {productImages.length > 1 && (
                            <div className="product-thumbnails">
                                {productImages.map((image) => (
                                    <button type="button" key={image} className={image === selectedImage ? "is-active" : ""} onClick={() => setSelectedImage(image)} aria-label={`View ${productName} image`}>
                                        <img src={image} alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="product-details">
                        <span className="product-category">{categoryName}</span>
                        <h1 className="product-title">{productName}</h1>
                        <p className="product-price">{formatPrice(productPrice)}</p>
                        <p className="product-description">{productDescription}</p>

                        <div className="product-trust-row">
                            <span>
                                <FaCheckCircle />
                                Secure checkout
                            </span>
                            <span>
                                <FaCheckCircle />
                                Carefully selected item
                            </span>
                        </div>

                        <div className="quantity-section">
                            <label className="quantity-label" htmlFor="product-quantity">
                                Quantity
                            </label>
                            <div className="quantity-controls">
                                <button type="button" className="qty-btn" onClick={handleDecrement} disabled={isOutOfStock}>
                                    <FaMinus />
                                </button>
                                <input id="product-quantity" type="number" className="qty-input" value={quantity} readOnly />
                                <button type="button" className="qty-btn" onClick={handleIncrement} disabled={isOutOfStock || (hasStockValue && stock > 0 && quantity >= stock)}>
                                    <FaPlus />
                                </button>
                            </div>
                        </div>

                        <div className="action-buttons">
                            <button type="button" className="buy-now-btn" onClick={handleBuyNow} disabled={isOutOfStock}>
                                <FaShoppingBag />
                                Buy Now
                            </button>
                            <button type="button" className="add-to-cart-btn" onClick={handleAddToCart} disabled={isOutOfStock}>
                                <FaShoppingCart />
                                Add to Cart
                            </button>
                        </div>
                    </section>
                </main>
            </div>
            <ToastContainer />
        </div>
    );
}
