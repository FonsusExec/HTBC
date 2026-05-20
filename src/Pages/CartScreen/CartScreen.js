import React from "react";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useNavigate} from "react-router-dom";
import "../CartScreen/cartScreen.css";
import {useCart} from "../../CartContext";

export default function CartScreen() {
    const {cart, removeFromCart, updateQty, getCartCount, getCartTotal} = useCart();
    const cartItemsCount = getCartCount();
    const cartItemsPrice = getCartTotal();

    const navigate = useNavigate();
    const handleRemoveFromCart = (id) => {
        removeFromCart(id);
        toast.info("Item removed from cart!");
    };

    const handleQuantityChange = (item, nextQty) => {
        const stock = Number(item.stock);
        const safeQty = Math.max(1, nextQty);

        if (Number.isFinite(stock) && stock >= 0 && safeQty > stock) {
            toast.error(`Only ${stock} ${item.name} left in stock.`);
            return;
        }

        updateQty(item._id, safeQty);
    };

    const continueToCheckout = () => {
        if (cartItemsCount === 0) {
            toast.error("Your cart is empty!");
            return;
        }
        navigate("/checkout");
    };

    const continueShopping = () => {
        navigate("/all-products"); // Or to products list
    };

    const formatCurrency = (value) => `$${(parseFloat(value) || 0).toFixed(2)}`;

    if (cartItemsCount === 0) {
        return (
            <div className="cart-page-container">
                <div className="empty-cart">
                    <h2>Your cart is empty</h2>
                    <p>Browse the shop and add items you would like to purchase.</p>
                    <button onClick={continueShopping}>Continue Shopping</button>
                </div>
                <ToastContainer />
            </div>
        );
    }

    return (
        <div className="cart-page-container">
            <div className="cart-page">
                {/* Header/Navigation */}
                <header className="header">
                    <button className="nav-btn" onClick={continueShopping}>
                        <span className="arrow-icon" style={{marginRight: "10px"}}>
                            {"<"}
                        </span>
                        Continue Shopping
                    </button>
                    <div className="header-right">
                        <div className="cart-header">
                            <p>{cartItemsCount}</p>
                            <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                            <h2>My Cart</h2>
                        </div>
                        {/* <div className="order-btn">
                            <img className="icon-btn" src={require("../../assets/img/htbc-orderLogo.png")} alt="My Order" />
                            <h2>My Order</h2>
                        </div> */}
                    </div>
                </header>

                {/* Main Content */}
                <div className="cart-content">
                    {/* Cart Items */}
                    <div className="cart-items">
                        <div className="items-header">
                            <h3>Items</h3>
                        </div>
                        <div className="items-table">
                            {cart.map((item) => (
                                <div key={item._id} className="item-row">
                                    <div className="item-info">
                                        <img src={item.image} alt={item.name} className="item-image" />
                                        <div className="item-copy">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-unit-price">{formatCurrency(item.price)} each</span>
                                        </div>
                                    </div>
                                    <div className="item-quantity" aria-label={`Quantity for ${item.name}`}>
                                        <button type="button" onClick={() => handleQuantityChange(item, item.qty - 1)} disabled={item.qty <= 1} aria-label={`Decrease quantity for ${item.name}`}>
                                            -
                                        </button>
                                        <span>{item.qty}</span>
                                        <button type="button" onClick={() => handleQuantityChange(item, item.qty + 1)} aria-label={`Increase quantity for ${item.name}`}>
                                            +
                                        </button>
                                    </div>
                                    <div className="item-price">
                                        <span>Line Total</span>
                                        <strong>{formatCurrency(item.price * item.qty)}</strong>
                                    </div>
                                    <div className="item-action">
                                        <button className="remove-btn" onClick={() => handleRemoveFromCart(item._id)}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                        <div className="summary-header">
                            <h3>Order Summary</h3>
                            <p className="items-count">
                                {cartItemsCount} {cartItemsCount === 1 ? "item" : "items"}
                            </p>
                        </div>
                        <div className="summary-details">
                            <p className="delivery-charges">
                                Delivery Charges: <span>Add your address to see delivery charges</span>
                            </p>
                            <p className="subtotal">
                                Subtotal: <span>{formatCurrency(cartItemsPrice)}</span>
                            </p>
                            <p className="total">
                                Total: <span>{formatCurrency(cartItemsPrice)}</span> <small>(Excluding delivery charges)</small>
                            </p>
                        </div>
                        <button className="continue-checkout-btn" onClick={continueToCheckout}>
                            Continue to Checkout
                        </button>
                        <div className="payment-options">
                            {/* <img src={require("../../assets/img/paypalLogo.png")} alt="PayPal" className="payment-icon" /> */}
                            <img src={require("../../assets/img/applepayLogo.png")} alt="Apple Pay" className="payment-icon" />
                            <img src={require("../../assets/img/stripeLogo.png")} alt="Stripe" className="payment-icon" />
                        </div>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
