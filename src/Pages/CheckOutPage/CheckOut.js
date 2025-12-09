// Full CheckoutScreen.jsx - Consolidated with All Fixes (Stripe-Only Focus, Form Submission on Success)
import React, {useState, useEffect} from "react";
import {loadStripe} from "@stripe/stripe-js";
import {Elements, PaymentElement, useStripe, useElements} from "@stripe/react-stripe-js";
import {PayPalScriptProvider, PayPalButtons} from "@paypal/react-paypal-js";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {useCart} from "../../CartContext"; // Adjust path
import "../CheckOutPage/checkOut.css";

// Load Stripe with your publishable key
const stripePromise = loadStripe("pk_test_51SUrTpIFfcTcOPno0d9Cc86ZlM55AROCNRZS2dFCrPLdjVplYCNLw3GUmwufxG6ocTdMNtd4LI7qhaOh8NPjl27E00LQQs8RLF"); // Replace with your key

// PayPal client ID (optional if testing Stripe only)
const paypalClientId = "YOUR_PAYPAL_CLIENT_ID"; // Replace if using PayPal

// Custom hook for Stripe payment logic
const useStripePayment = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleStripeSubmit = async (e, formData, cartTotal, cart, clearCart, navigate) => {
        e.preventDefault();
        console.log("🧾 Stripe Submit Started - Cart Total:", cartTotal);
        if (!stripe || !elements) {
            console.error("❌ Stripe/Elements not loaded");
            return;
        }

        // Safety check for mounted PaymentElement (using string ID)
        // if (!elements.getElement("payment")) {
        //     console.error("❌ PaymentElement not mounted");
        //     toast.error("Payment form is not ready. Please wait a moment and try again.", {
        //         position: "top-right",
        //         autoClose: 3000,
        //     });
        //     return;
        // }

        setIsProcessing(true);
        setError(null);

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.shippingAddress) {
            console.warn("⚠️ Shipping validation failed");
            toast.error("Please fill in all required shipping fields.", {
                position: "top-right",
                autoClose: 3000,
            });
            setIsProcessing(false);
            return;
        }

        // Ensure cartTotal is a valid number
        const validTotal = parseFloat(cartTotal) || 0;
        console.log("💰 Validated Total:", validTotal);
        if (validTotal <= 0) {
            console.error("❌ Invalid total:", validTotal);
            toast.error("Invalid cart total. Please check your items.", {
                position: "top-right",
                autoClose: 3000,
            });
            setIsProcessing(false);
            return;
        }

        try {
            // Create PaymentIntent on backend
            console.log("📡 Calling /api/create-payment-intent with amount:", Math.round(validTotal * 100));
            const {data} = await axios.post("/api/create-payment-intent", {
                amount: Math.round(validTotal * 100), // Convert to cents
            });
            console.log("✅ Backend Response:", data);

            const clientSecret = data.clientSecret;
            if (!clientSecret) {
                throw new Error("No clientSecret from backend");
            }

            // Confirm payment with Stripe
            console.log("🔐 Confirming payment with clientSecret:", clientSecret.substring(0, 10) + "...");
            const {error: stripeError} = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                clientSecret,
            });

            if (stripeError) {
                console.error("❌ Stripe Confirmation Error:", stripeError);
                setError(stripeError.message);
                toast.error(stripeError.message, {position: "top-right", autoClose: 3000});
            } else {
                console.log("🎉 Stripe Payment Succeeded - Creating Order");
                // Submit form + order details to backend
                await axios.post("/api/create-order", {
                    shipping: formData, // { firstName, lastName, ... }
                    items: cart, // Full cart array
                    total: validTotal,
                    paymentId: clientSecret.split("_secret_")[0], // e.g., 'pi_3N...'
                });
                console.log("✅ Order Created Successfully");

                clearCart();
                toast.success("Payment successful! Order confirmed.", {position: "top-right", autoClose: 2000});
                navigate("/payment-success");
            }
        } catch (err) {
            console.error("💥 Full Error in handleStripeSubmit:", err);
            setError("An unexpected error occurred.");
            toast.error("Payment failed. Please try again.", {position: "top-right", autoClose: 3000});
        }

        setIsProcessing(false);
    };

    return {handleStripeSubmit, isProcessing, error};
};

// PayPal handler (optional, for completeness)
const handlePayPalApprove = async (data, actions, cartTotal, cart, clearCart, navigate, formData) => {
    console.log("🧾 PayPal Approve Started - Cart Total:", cartTotal);
    try {
        const validTotal = parseFloat(cartTotal) || 0;
        if (validTotal <= 0) {
            toast.error("Invalid cart total. Please check your items.", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        const orderDetails = await actions.order.capture();
        console.log("✅ PayPal Order Captured:", orderDetails);

        await axios.post("/api/capture-paypal-order", {orderID: orderDetails.id});
        console.log("✅ Backend PayPal Capture Confirmed");

        // Submit form + order details
        await axios.post("/api/create-order", {
            shipping: formData,
            items: cart,
            total: validTotal,
            paymentId: orderDetails.id,
        });
        console.log("✅ PayPal Order Created Successfully");

        clearCart();
        toast.success("Payment successful! Order confirmed.", {position: "top-right", autoClose: 2000});
        navigate("/payment-success");
    } catch (error) {
        console.error("💥 Full Error in handlePayPalApprove:", error);
        toast.error("Payment failed. Please try again.", {position: "top-right", autoClose: 3000});
    }
};

export default function CheckoutScreen() {
    const {cart, clearCart, getCartCount, getCartTotal} = useCart();
    const navigate = useNavigate();
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
    const [isStripeReady, setIsStripeReady] = useState(false); // Track readiness
    const cartItemsCount = getCartCount();
    const cartItemsPrice = getCartTotal();

    console.log("🛒 Checkout Loaded - Cart Items:", cart, "Total:", cartItemsPrice);

    // Form states
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        shippingAddress: "",
        houseNumber: "",
        state: "",
        zip: "",
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handlePaymentMethodChange = (e) => {
        setSelectedPaymentMethod(e.target.value);
        setIsStripeReady(false); // Reset readiness
    };

    const handleBackToCart = () => {
        navigate("/cart");
    };

    if (cartItemsCount === 0) {
        navigate("/cart");
        return null;
    }

    // Ensure cartItemsPrice is a valid number
    const validAmount = parseFloat(cartItemsPrice) || 0;
    if (validAmount <= 0) {
        return (
            <div className="checkout-page-container">
                <div className="checkout-page">
                    <div className="error-container">
                        <h2>Invalid Cart</h2>
                        <p>Cart total is invalid. Please check your items.</p>
                        <button onClick={handleBackToCart}>Back to Cart</button>
                    </div>
                </div>
            </div>
        );
    }

    // Stripe Elements wrapper
    const StripeWrapper = ({children}) => (
        <Elements
            stripe={stripePromise}
            options={{
                mode: "payment",
                amount: Math.round(validAmount * 100),
                currency: "usd",
            }}
        >
            {children}
        </Elements>
    );

    // PayPal wrapper (optional)
    const PayPalWrapper = ({children}) => <PayPalScriptProvider options={{"client-id": paypalClientId}}>{children}</PayPalScriptProvider>;

    return (
        <div className="checkout-page-container">
            <div className="checkout-page">
                {/* Header/Navigation */}
                <header className="header">
                    <button className="back-btn" onClick={handleBackToCart}>
                        <span className="arrow-icon" style={{marginRight: "10px"}}>
                            ◀
                        </span>
                        Back to cart
                    </button>
                    <div className="header-right">
                        <div className="search-icon">🔍</div>
                        <div className="cart-header">
                            <p>{cartItemsCount}</p>
                            <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                            <h2>My Cart</h2>
                        </div>
                        <div className="order-btn">
                            <img className="icon-btn" src={require("../../assets/img/htbc-orderLogo.png")} alt="My Order" />
                            <h2>My Order</h2>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <div className="checkout-content">
                    {/* Forms Section */}
                    <div className="forms-section">
                        <form>
                            {/* Shipping Information */}
                            <div className="shipping-info">
                                <h2>Shipping Information</h2>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>First Name</label>
                                        <input type="text" name="firstName" placeholder="Enter" value={formData.firstName} onChange={handleInputChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Last Name</label>
                                        <input type="text" name="lastName" placeholder="Enter" value={formData.lastName} onChange={handleInputChange} required />
                                    </div>
                                </div>
                                <div className="input-group full-width">
                                    <label>Shipping Address</label>
                                    <input type="text" name="shippingAddress" placeholder="Enter" value={formData.shippingAddress} onChange={handleInputChange} required />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>House Number</label>
                                        <input type="text" name="houseNumber" placeholder="Enter" value={formData.houseNumber} onChange={handleInputChange} />
                                    </div>
                                    <div className="input-group">
                                        <label>State</label>
                                        <input type="text" name="state" placeholder="Enter" value={formData.state} onChange={handleInputChange} />
                                    </div>
                                    <div className="input-group">
                                        <label>Zip</label>
                                        <input type="text" name="zip" placeholder="Enter" value={formData.zip} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Information */}
                            <div className="payment-info">
                                <h2>Payment Information</h2>
                                <div className="input-group full-width">
                                    <label>Select Payment Method</label>
                                    <div className="payment-methods">
                                        <label className="payment-option">
                                            <input type="radio" name="payment" value="paypal" checked={selectedPaymentMethod === "paypal"} onChange={handlePaymentMethodChange} />
                                            <img src="https://via.placeholder.com/60x30/003087/ffffff?text=PayPal" alt="PayPal" className="payment-logo" />
                                        </label>
                                        <label className="payment-option">
                                            <input type="radio" name="payment" value="applepay" checked={selectedPaymentMethod === "applepay"} onChange={handlePaymentMethodChange} />
                                            <img src="https://via.placeholder.com/60x30/000000/ffffff?text=Apple+Pay" alt="Apple Pay" className="payment-logo" />
                                        </label>
                                        <label className="payment-option">
                                            <input type="radio" name="payment" value="stripe" checked={selectedPaymentMethod === "stripe"} onChange={handlePaymentMethodChange} />
                                            <img src="https://via.placeholder.com/60x30/635bff/ffffff?text=Stripe" alt="Stripe" className="payment-logo" />
                                        </label>
                                    </div>

                                    {/* Conditional Payment Components */}
                                    {selectedPaymentMethod === "stripe" && (
                                        <StripeWrapper key="stripe-form">
                                            {" "}
                                            <div className="stripe-payment">
                                                <label>Card Details</label>
                                                <PaymentElement
                                                    onReady={() => {
                                                        console.log("✅ PaymentElement Ready");
                                                        setIsStripeReady(true);
                                                    }}
                                                    onLoadError={(event) => {
                                                        console.error("❌ PaymentElement Load Error:", event);
                                                        setIsStripeReady(false);
                                                    }}
                                                />
                                                {!isStripeReady && <p>Loading payment form...</p>}
                                            </div>
                                        </StripeWrapper>
                                    )}

                                    {selectedPaymentMethod === "paypal" && (
                                        <PayPalWrapper>
                                            <div className="paypal-payment">
                                                <PayPalButtons
                                                    createOrder={(data, actions) => {
                                                        return actions.order.create({
                                                            purchase_units: [
                                                                {
                                                                    amount: {
                                                                        value: cartItemsPrice.toFixed(2),
                                                                        currency_code: "USD",
                                                                    },
                                                                },
                                                            ],
                                                        });
                                                    }}
                                                    onApprove={(data, actions) => handlePayPalApprove(data, actions, cartItemsPrice, cart, clearCart, navigate, formData)}
                                                    style={{layout: "vertical"}}
                                                />
                                            </div>
                                        </PayPalWrapper>
                                    )}

                                    {/* Apple Pay: Placeholder */}
                                    {selectedPaymentMethod === "applepay" && (
                                        <div className="apple-pay-placeholder">
                                            <p>Apple Pay integration via Stripe (enable in Stripe Dashboard).</p>
                                            <StripeWrapper>
                                                <PaymentElement
                                                    onReady={() => setIsStripeReady(true)}
                                                    onLoadError={(event) => {
                                                        console.error("❌ PaymentElement Load Error:", event);
                                                        setIsStripeReady(false);
                                                    }}
                                                />
                                                {!isStripeReady && <p>Loading payment form...</p>}
                                            </StripeWrapper>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
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
                                Delivery Charges: <span>Add your delivery address to see delivery charges</span>
                            </p>
                            <p className="subtotal">
                                Subtotal: <span>${cartItemsPrice.toFixed(2)}</span>
                            </p>
                            <p className="total">
                                Total: <span>${cartItemsPrice.toFixed(2)}</span> <small>(Excluding delivery charges)</small>
                            </p>
                        </div>
                        {/* Conditional Submit Button */}
                        {selectedPaymentMethod === "stripe" ? (
                            <StripeWrapper>
                                <StripeSubmitButton formData={formData} cartItemsPrice={cartItemsPrice} cart={cart} clearCart={clearCart} navigate={navigate} isReady={isStripeReady} />
                            </StripeWrapper>
                        ) : (
                            <button
                                className="continue-checkout-btn"
                                onClick={(e) => {
                                    if (!selectedPaymentMethod) {
                                        toast.error("Please select a payment method.", {position: "top-right", autoClose: 3000});
                                        return;
                                    }
                                    // For PayPal/Apple Pay, submission is handled in their callbacks
                                }}
                                disabled={!selectedPaymentMethod}
                            >
                                {selectedPaymentMethod === "paypal" || selectedPaymentMethod === "applepay" ? "Proceed with Selected Payment" : "Continue to Checkout"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}

// Stripe Submit Component
const StripeSubmitButton = ({formData, cartItemsPrice, cart, clearCart, navigate, isReady}) => {
    const {handleStripeSubmit, isProcessing, error} = useStripePayment();

    return (
        <>
            {error && <div className="error-message">{error}</div>}
            <button className="continue-checkout-btn" onClick={(e) => handleStripeSubmit(e, formData, cartItemsPrice, cart, clearCart, navigate)} disabled={isProcessing || !isReady}>
                {isProcessing ? "Processing..." : !isReady ? "Loading Payment Form..." : "Pay with Stripe"}
            </button>
        </>
    );
};
