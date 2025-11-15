import React from "react";
import {Link, useParams} from "react-router-dom";
import axios from "axios";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../ProductPage/productScreen.css";

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
    const {htbc} = params;

    const [{loading, product, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        product: [],
        error: "",
    });
    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
            try {
                const result = await axios.get(`/api/products/htbc/${htbc}`);
                dispatch({type: "FETCH_SUCCESS", payload: result.data});
            } catch (error) {
                dispatch({type: "FETCH_FAIL", payload: error.message});
            }
        };
        fetchData();
    }, [htbc]);

    const [quantity, setQuantity] = React.useState(0);
    const [cart, setCart] = React.useState(() => {
        return JSON.parse(localStorage.getItem("cart")) || [];
    });

    // Update localStorage whenever cart changes
    React.useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    // Sync quantity with cart quantity if item exists in cart
    React.useEffect(() => {
        if (product && product._id) {
            const existItem = cart.find((x) => x._id === product._id);
            setQuantity(existItem ? existItem.qty : 0);
        }
    }, [cart, product]);

    const handleIncrement = () => {
        const existItem = cart.find((x) => x._id === product._id);
        if (existItem) {
            setCart((prevCart) => prevCart.map((x) => (x._id === product._id ? {...x, qty: x.qty + 1} : x)));
        } else {
            setQuantity((prev) => prev + 1);
        }
    };

    const handleDecrement = () => {
        const existItem = cart.find((x) => x._id === product._id);
        if (existItem) {
            if (existItem.qty > 1) {
                setCart((prevCart) => prevCart.map((x) => (x._id === product._id ? {...x, qty: x.qty - 1} : x)));
            } else {
                setCart((prevCart) => prevCart.filter((x) => x._id !== product._id));
            }
        } else {
            setQuantity((prev) => Math.max(0, prev - 1));
        }
    };

    const addToCart = () => {
        if (quantity === 0) {
            toast.error("Please select a quantity", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            return;
        }

        const existItem = cart.find((x) => x._id === product._id);
        if (existItem) {
            setCart((prevCart) => prevCart.map((x) => (x._id === product._id ? {...existItem, qty: quantity} : x)));
            toast.info(`Updated ${product.name} quantity to ${quantity}`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } else {
            setCart((prevCart) => [...prevCart, {...product, qty: quantity}]);
            toast.success(`${quantity} ${product.name} added to cart!`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
        // No reset of quantity; it stays synced with cart
    };

    const cartCount = cart.reduce((total, item) => total + item.qty, 0);

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
                        <div className="order-btn">
                            <img className="icon-btn" src={require("../../assets/img/htbc-orderLogo.png")} alt="My Order" />
                            <h2>My Order</h2>
                        </div>
                    </div>
                </header>
                {/* Main Content */}
                {loading ? (
                    <div>Loading...</div>
                ) : error ? (
                    <div>{error}</div>
                ) : (
                    <div className="product-content">
                        {/* Product Images */}
                        <div className="product-images">
                            <div className="main-image yellow-border">
                                <img src={product.image} alt="Main Rosary" />
                            </div>
                        </div>

                        {/* Product Details */}
                        <div className="product-details">
                            <h1 className="product-title">{product.name}</h1>
                            <p className="product-price">${product.price}</p>
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
                                <button className="add-to-cart-btn" onClick={addToCart}>
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
                )}
            </div>
            <ToastContainer /> {/* Add ToastContainer at the root level for notifications */}
        </div>
    );
}
