import React from "react";
import {Link, useParams} from "react-router-dom";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../ProductPage/productScreen.css";
import {useCart} from "../../CartContext";
import Loading from "../../components/Loading";
import {getProductId, getProductImage, getProductName, getProductPrice, toCartItem} from "../../utils/productHelpers";

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

export default function ProductScreen() {
    const params = useParams();
    const {htbc: productParam} = params;
    const {getCartCount, addToCart, getCartItems, updateQty, removeFromCart} = useCart();

    const [{loading, product, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        product: [],
        error: "",
    });
    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
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

    const [quantity, setQuantity] = React.useState(0);

    // Sync quantity with cart if item exists
    React.useEffect(() => {
        const productId = getProductId(product);
        if (productId) {
            const existItem = getCartItems().find((x) => x._id === productId);
            setQuantity(existItem ? existItem.qty : 0);
        }
    }, [product, getCartItems]);

    const handleIncrement = () => {
        const productId = getProductId(product);
        const existItem = getCartItems().find((x) => x._id === productId);
        if (existItem) {
            updateQty(productId, existItem.qty + 1);
        } else {
            setQuantity((prev) => prev + 1);
        }
    };

    const handleDecrement = () => {
        const productId = getProductId(product);
        const existItem = getCartItems().find((x) => x._id === productId);
        if (existItem) {
            if (existItem.qty > 1) {
                updateQty(productId, existItem.qty - 1);
            } else {
                removeFromCart(productId);
            }
        } else {
            setQuantity((prev) => Math.max(0, prev - 1));
        }
    };

    const handleAddToCart = () => {
        if (quantity === 0) {
            toast.error("Please select a quantity");
            return;
        }
        const cartItem = toCartItem(product, quantity);
        const existItem = getCartItems().find((x) => x._id === cartItem._id);
        if (existItem) {
            updateQty(cartItem._id, quantity);
            toast.info(`Updated ${cartItem.name} quantity to ${quantity}`);
        } else {
            addToCart(cartItem);
            toast.success(`${quantity} ${cartItem.name} added to cart!`);
        }
        // No reset; stays synced
    };

    const cartCount = getCartCount();

    if (loading)
        return (
            <div>
                <Loading />
            </div>
        );
    if (error) return <div>{error}</div>;

    const productName = getProductName(product);
    const productImage = getProductImage(product);
    const productPrice = getProductPrice(product);

    return (
        <div className="product-page-container">
            <div className="product-page">
                {/* Header/Navigation */}
                <header className="header">
                    <button className="nav-btn">
                        <span className="arrow-icon" style={{marginRight: "10px"}}>
                            ◀
                        </span>
                        Continue Shopping
                    </button>
                    <div className="header-right">
                        <p>{cartCount}</p>
                        <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                        <h2>My Cart</h2>
                        {/* <div className="order-btn">
                            <img className="icon-btn" src={require("../../assets/img/htbc-orderLogo.png")} alt="My Order" />
                            <h2>My Order</h2>
                        </div> */}
                    </div>
                </header>
                {/* Main Content */}
                <div className="product-content">
                    {/* Product Images */}
                    <div className="product-images">
                        <div className="main-image yellow-border">
                            <img src={productImage} alt={productName} />
                        </div>
                    </div>

                    {/* Product Details */}
                    <div className="product-details">
                        <h1 className="product-title">{productName}</h1>
                        <p className="product-price">${productPrice}</p>
                        <p className="product-description">{product.description}</p>
                        {/* <div className="rating">
                            <span className="stars">★★★★☆</span>
                            <span className="reviews">27 Reviews</span>
                        </div> */}

                        {/* Buy Now Button */}
                        <div className="action-buttons">
                            <Link to="/cart">
                                <button className="buy-now-btn">Buy Now</button>
                            </Link>
                            <button className="add-to-cart-btn" onClick={handleAddToCart}>
                                Add to Cart
                            </button>
                        </div>

                        {/* Quantity */}
                        <div className="quantity-section">
                            <label className="quantity-label">Quantity</label>
                            <div className="quantity-controls">
                                <button className="qty-btn" onClick={handleDecrement}>
                                    -
                                </button>
                                <input type="number" className="qty-input" value={quantity} readOnly />
                                <button className="qty-btn" onClick={handleIncrement}>
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer /> {/* Add ToastContainer at the root level for notifications */}
        </div>
    );
}
