// CheckoutScreen.jsx - Concise Version with Apple Pay
import React, {useEffect, useState} from "react";
import {loadStripe} from "@stripe/stripe-js";
import {Elements, PaymentElement, useStripe, useElements} from "@stripe/react-stripe-js";
import {PayPalScriptProvider, PayPalButtons} from "@paypal/react-paypal-js";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {useNavigate, useLocation} from "react-router-dom";
import axios from "axios";
import {useCart} from "../../CartContext";
import "../CheckOutPage/checkOut.css";
import {useAuth} from "../../AuthContext";

const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : Promise.resolve(null);
const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || "";

const getOrderItems = (cart = []) =>
    cart.map((item) => ({
        productId: item._id,
        name: item.name,
        qty: item.qty,
        price: parseFloat(item.price) || 0,
        image: item.image,
    }));

const releaseInventoryReservation = async (reservationId) => {
    if (!reservationId) return;

    try {
        await axios.post(`/api/payment-reservations/${reservationId}/release`);
    } catch (err) {
        console.warn("Unable to release inventory reservation:", err.response?.data || err.message);
    }
};

// Stripe Submit Button (unchanged - omitted for brevity)
// ----------------------------------------------------------------
// Stripe Submit Button (Full Updated Version)
// ----------------------------------------------------------------
function StripeSubmitButton({formData, amount, cart, clearCart, navigate, isReady, reservationId}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    const handleStripeSubmit = async (e) => {
        e.preventDefault?.();
        if (!stripe || !elements) {
            toast.error("Payment system is still loading. Please wait...");
            return;
        }

        setIsProcessing(true);
        setError("");

        if (!formData.firstName || !formData.email || !formData.shippingAddress) {
            toast.error("Please fill in all required shipping fields.", {position: "top-right", autoClose: 3000});
            setIsProcessing(false);
            return;
        }

        const validTotal = parseFloat(amount) || 0;
        if (validTotal <= 0) {
            toast.error("Invalid cart total. Please check your items.", {position: "top-right", autoClose: 3000});
            setIsProcessing(false);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            await releaseInventoryReservation(reservationId);
            toast.error("Please log in to complete payment.");
            navigate("/login");
            setIsProcessing(false);
            return;
        }

        let paymentSucceeded = false;

        try {
            const {error: submitError} = await elements.submit();
            if (submitError) {
                toast.error(submitError.message || "Payment validation failed.", {position: "top-right", autoClose: 3000});
                setIsProcessing(false);
                return;
            }

            toast.info("Processing your payment...", {position: "top-right", autoClose: 2000});

            const {error: stripeError, paymentIntent} = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + "/payment-success",
                },
                redirect: "if_required",
            });

            if (stripeError) {
                console.error("Stripe confirmPayment error:", stripeError);
                setError(stripeError.message);
                await releaseInventoryReservation(reservationId);
                toast.error(stripeError.message, {position: "top-right", autoClose: 3000});
                setIsProcessing(false);
                return;
            }

            if (paymentIntent && paymentIntent.status === "succeeded") {
                paymentSucceeded = true;
                const orderItems = getOrderItems(cart);

                const payload = {
                    shipping: formData,
                    items: orderItems,
                    total: validTotal,
                    paymentId: paymentIntent.id,
                    reservationId,
                };

                // Create order on backend
                const {data: orderResponse} = await axios.post("/api/create-order", payload, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensures it's sent
                    },
                });
                if (!orderResponse.success || !orderResponse.orderId) {
                    throw new Error("Failed to create order on server.");
                }

                clearCart();
                toast.success("Payment successful! Order confirmed.", {position: "top-right", autoClose: 2000});
                // Navigate with real orderId
                navigate("/order-confirmation", {
                    state: {
                        orderId: orderResponse.orderId,
                        shipping: formData,
                        cart,
                        total: validTotal,
                        paymentId: paymentIntent.id,
                    },
                });
            } else {
                toast.info("Payment processing initiated. Follow on-screen instructions.", {position: "top-right", autoClose: 4000});
            }
        } catch (err) {
            console.error("Full Error in handleStripeSubmit:", err);
            if (!paymentSucceeded) {
                await releaseInventoryReservation(reservationId);
            }
            setError("An unexpected error occurred.");
            toast.error(err.response?.data?.error || "Payment failed. Please try again.", {position: "top-right", autoClose: 3000});
        }

        setIsProcessing(false);
    };

    return (
        <>
            {error && <div className="error-message">{error}</div>}
            <button className="continue-checkout-btn" onClick={handleStripeSubmit} disabled={isProcessing || !isReady}>
                {isProcessing ? "Processing..." : !isReady ? "Loading Payment Form..." : "Pay with Stripe"}
            </button>
        </>
    );
}

// Apple Pay Handler (Concise: Reuses intent logic)
function ApplePayButton({formData, amount, cart, clearCart, navigate, stripe}) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApplePay = async () => {
        if (!stripe) return toast.error("Stripe not loaded.");

        setIsProcessing(true);

        if (!formData.firstName || !formData.email || !formData.shippingAddress) {
            toast.error("Fill shipping fields.");
            setIsProcessing(false);
            return;
        }

        const validTotal = parseFloat(amount) || 0;
        if (validTotal <= 0) {
            toast.error("Invalid total.");
            setIsProcessing(false);
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Please log in to complete payment.");
            navigate("/login");
            setIsProcessing(false);
            return;
        }

        let appleReservationId = "";
        let paymentSucceeded = false;

        try {
            toast.info("Processing Apple Pay...");

            // Create intent
            const amountInCents = Math.round(validTotal * 100);
            const {data} = await axios.post("/api/create-payment-intent", {amount: amountInCents, items: getOrderItems(cart)});
            const {clientSecret} = data;
            appleReservationId = data.reservationId || "";

            if (!clientSecret) throw new Error("No client secret");

            // Confirm Apple Pay
            const {error, paymentIntent} = await stripe.confirmApplePayPayment(clientSecret, {
                payment_method: {
                    billing_details: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                    },
                },
                redirect: "if_required",
            });

            if (error) throw error;

            if (paymentIntent.status === "succeeded") {
                paymentSucceeded = true;
                const orderItems = getOrderItems(cart);

                const payload = {
                    shipping: formData,
                    items: orderItems,
                    total: validTotal,
                    paymentId: paymentIntent.id,
                    reservationId: appleReservationId,
                };

                // Create order on backend
                const {data: orderResponse} = await axios.post("/api/create-order", payload, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Ensures it's sent
                    },
                });
                if (!orderResponse.success) throw new Error("Order creation failed");

                clearCart();
                toast.success("Payment successful!");
                navigate("/order-confirmation", {state: {orderId: orderResponse.orderId, shipping: formData, cart, total: validTotal, paymentId: paymentIntent.id}});
            }
        } catch (err) {
            if (!paymentSucceeded) {
                await releaseInventoryReservation(appleReservationId);
            }
            toast.error(err.message || "Apple Pay failed.");
        }

        setIsProcessing(false);
    };

    return (
        <button className="apple-pay-btn" onClick={handleApplePay} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Pay with Apple Pay"}
        </button>
    );
}

// PayPal handler (unchanged - omitted for brevity)
async function handlePayPalApprove(data, actions, total, cart, clearCart, navigate, formData) {
    // ... your existing code
}

// Main Component (Concise: Merged Apple Pay check into one useEffect)
export default function CheckoutScreen() {
    const {cart, clearCart, getCartCount, getCartTotal} = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const {isLoggedIn, loading: authLoading} = useAuth();

    const cartItemsCount = getCartCount();
    const cartItemsTotal = getCartTotal();

    const [paymentMethod, setPaymentMethod] = useState("");
    const [isStripeReady, setIsStripeReady] = useState(false);
    const [clientSecret, setClientSecret] = useState("");
    const [reservationId, setReservationId] = useState("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isApplePaySupported, setIsApplePaySupported] = useState(false); // Concise state

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        shippingAddress: "",
        houseNumber: "",
        state: "",
        zip: "",
    });

    // Merged useEffect: Stripe init + Apple Pay check
    useEffect(() => {
        setIsStripeReady(false);
        if (paymentMethod !== "stripe") setClientSecret("");

        if (paymentMethod === "applepay") {
            stripePromise.then((stripe) => {
                if (stripe) {
                    const pr = stripe.paymentRequest({
                        country: "US",
                        currency: "usd",
                        total: {
                            label: "Your Order",
                            amount: Math.round(parseFloat(cartItemsTotal) * 100),
                        },
                        requestPayerName: true,
                        requestPayerEmail: true,
                    });

                    pr.canMakePayment()
                        .then((result) => {
                            setIsApplePaySupported(!!result?.applePay);
                            if (!result?.applePay) {
                                toast.info("Apple Pay unavailable. Switching to Stripe.", {position: "top-right", autoClose: 3000});
                                setPaymentMethod("stripe");
                                setShowPaymentModal(true); // ← ADD THIS: Auto-open modal on fallback
                            }
                        })
                        .catch((err) => {
                            console.error("Apple Pay check error:", err);
                            setIsApplePaySupported(false);
                            setPaymentMethod("stripe");
                            setShowPaymentModal(true); // ← ADD THIS too
                        });
                }
            });
        }
    }, [paymentMethod, cartItemsTotal]);

    useEffect(() => {
        const initStripe = async () => {
            if (paymentMethod !== "stripe") return;

            try {
                const rawTotal = parseFloat(cartItemsTotal) || 0;
                const amountInCents = Math.round(rawTotal * 100);

                if (amountInCents <= 0) {
                    toast.error("Cart total must be greater than $0.00 to use Stripe.", {position: "top-right", autoClose: 3000});
                    setClientSecret("");
                    setReservationId("");
                    return;
                }

                const {data} = await axios.post("/api/create-payment-intent", {amount: amountInCents, items: getOrderItems(cart)});

                if (data && data.clientSecret) {
                    setClientSecret(data.clientSecret);
                    setReservationId(data.reservationId || "");
                    setIsStripeReady(true); // ← AUTO-SET: Assume ready if secret exists
                } else {
                    throw new Error("No client secret returned");
                }
            } catch (err) {
                console.error("Stripe init error:", err.response?.data || err);
                toast.error(err.response?.data?.error || "Failed to initialize Stripe.", {position: "top-right", autoClose: 3000});
                setClientSecret("");
                setReservationId("");
                setIsStripeReady(false);
            }
        };

        initStripe();
    }, [paymentMethod, cartItemsTotal, cart]);

    useEffect(() => {
        if (authLoading) return;

        const token = localStorage.getItem("token");
        if (!isLoggedIn || !token) {
            // ← ADD: Check token too
            toast.error("Please log in to complete your order.");
            navigate("/login");
            return;
        }
        // ...
    }, [authLoading, isLoggedIn, navigate]);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleStripeSelect = () => {
        setPaymentMethod("stripe");
        setShowPaymentModal(true);
    };

    const handleApplePaySelect = () => setPaymentMethod("applepay");

    const handlePaymentModalClose = async () => {
        await releaseInventoryReservation(reservationId);
        setReservationId("");
        setClientSecret("");
        setIsStripeReady(false);
        setShowPaymentModal(false);
        setPaymentMethod("");
    };

    const StripeElementsWrapper = ({children}) =>
        clientSecret ? (
            <Elements stripe={stripePromise} options={{clientSecret, appearance: {theme: "stripe"}}}>
                {children}
            </Elements>
        ) : null;

    return (
        <div className="checkout-page-container">
            <div className="checkout-page">
                <header className="header">
                    <button className="back-btn" onClick={() => navigate("/cart")}>
                        <span className="arrow-icon" style={{marginRight: "10px"}}>
                            {"<"}
                        </span>
                        Back to cart
                    </button>
                    <div className="header-right">
                        <div className="cart-header">
                            <p>{cartItemsCount}</p>
                            <h2>My Cart</h2>
                        </div>
                    </div>
                </header>

                <div className="checkout-content">
                    <div className="forms-section">
                        <form>
                            <div className="shipping-info">
                                <div className="checkout-section-heading">
                                    <span>Step 1</span>
                                    <h2>Shipping Information</h2>
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="checkout-first-name">First Name</label>
                                        <input
                                            id="checkout-first-name"
                                            type="text"
                                            name="firstName"
                                            placeholder="Enter first name"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            autoComplete="given-name"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="checkout-last-name">Last Name</label>
                                        <input
                                            id="checkout-last-name"
                                            type="text"
                                            name="lastName"
                                            placeholder="Enter last name"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            autoComplete="family-name"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="checkout-email">Email</label>
                                        <input
                                            id="checkout-email"
                                            type="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="input-group full-width">
                                    <label htmlFor="checkout-address">Shipping Address</label>
                                    <input
                                        id="checkout-address"
                                        type="text"
                                        name="shippingAddress"
                                        placeholder="Street address"
                                        value={formData.shippingAddress}
                                        onChange={handleInputChange}
                                        autoComplete="street-address"
                                        required
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="input-group">
                                        <label htmlFor="checkout-house-number">House Number</label>
                                        <input
                                            id="checkout-house-number"
                                            type="text"
                                            name="houseNumber"
                                            placeholder="Apt, suite, unit"
                                            value={formData.houseNumber}
                                            onChange={handleInputChange}
                                            autoComplete="address-line2"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="checkout-state">State</label>
                                        <input id="checkout-state" type="text" name="state" placeholder="State" value={formData.state} onChange={handleInputChange} autoComplete="address-level1" />
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="checkout-zip">Zip</label>
                                        <input id="checkout-zip" type="text" name="zip" placeholder="Zip code" value={formData.zip} onChange={handleInputChange} autoComplete="postal-code" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="order-summary">
                        <div className="summary-header">
                            <h3>Order Summary</h3>
                            <p className="items-count">
                                {cartItemsCount} {cartItemsCount === 1 ? "item" : "items"}
                            </p>
                        </div>
                        <div className="summary-details">
                            <p className="delivery-charges">
                                Delivery Charges: <span>Delivery charges are included in the total</span>
                            </p>
                            <p className="subtotal">
                                Subtotal: <span>${cartItemsTotal.toFixed(2)}</span>
                            </p>
                            <p className="total">
                                Total: <span>${cartItemsTotal.toFixed(2)}</span> <small>(Including delivery charges)</small>
                            </p>
                        </div>

                        <div className="embedded-payment-info">
                            <label>Select Payment Method</label>
                            <div className="payment-methods">
                                {/* <label className="payment-option">
                                    <input type="radio" name="payment" value="paypal" checked={paymentMethod === "paypal"} onChange={(e) => setPaymentMethod(e.target.value)} />
                                    <img src="https://via.placeholder.com/60x30/003087/ffffff?text=PayPal" alt="PayPal" className="payment-logo" />
                                </label> */}
                                <label className="payment-option">
                                    <input type="radio" name="payment" value="applepay" checked={paymentMethod === "applepay"} onChange={handleApplePaySelect} />
                                    <img src={require("../../assets/img/applepayLogo.png")} alt="Apple Pay" className="payment-logo" />
                                </label>
                                <label className="payment-option">
                                    <input type="radio" name="payment" value="stripe" checked={paymentMethod === "stripe"} onChange={handleStripeSelect} />
                                    <img src={require("../../assets/img/stripeLogo.png")} alt="Stripe" className="payment-logo" />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showPaymentModal && paymentMethod === "stripe" && (
                <div className="payment-modal-overlay">
                    <div className="payment-modal">
                        <div className="modal-header">
                            <h3>Enter Card Details</h3>
                            <button className="modal-close" onClick={handlePaymentModalClose}>
                                x
                            </button>
                        </div>
                        <div className="modal-body">
                            <StripeElementsWrapper>
                                <div className="stripe-payment">
                                    <label>Card Details</label>
                                    <PaymentElement
                                        onReady={() => {
                                            setIsStripeReady(true);
                                        }}
                                        onLoadError={() => {
                                            setIsStripeReady(false);
                                        }}
                                    />
                                    {!isStripeReady && <p>Loading payment form...</p>}
                                </div>

                                <StripeSubmitButton formData={formData} amount={cartItemsTotal} cart={cart} clearCart={clearCart} navigate={navigate} isReady={isStripeReady} reservationId={reservationId} />
                            </StripeElementsWrapper>
                        </div>
                    </div>
                </div>
            )}

            {paymentMethod === "paypal" && paypalClientId && (
                <PayPalScriptProvider options={{"client-id": paypalClientId}}>
                    <div className="paypal-payment">
                        <PayPalButtons
                            createOrder={(data, actions) =>
                                actions.order.create({
                                    purchase_units: [
                                        {
                                            amount: {
                                                value: cartItemsTotal.toFixed(2),
                                                currency_code: "USD",
                                            },
                                        },
                                    ],
                                })
                            }
                            onApprove={(data, actions) => handlePayPalApprove(data, actions, cartItemsTotal, cart, clearCart, navigate, formData)}
                            style={{layout: "vertical"}}
                        />
                    </div>
                </PayPalScriptProvider>
            )}

            {/* Apple Pay Section (Concise: Single check + button) */}
            {paymentMethod === "applepay" && (
                <div className="apple-pay-section">
                    {isApplePaySupported ? (
                        <StripeElementsWrapper>
                            <ApplePayButton formData={formData} amount={cartItemsTotal} cart={cart} clearCart={clearCart} navigate={navigate} stripe={stripePromise} />
                        </StripeElementsWrapper>
                    ) : (
                        <div className="apple-pay-placeholder">
                            <p>
                                Apple Pay unavailable.{" "}
                                <button onClick={handleStripeSelect} className="fallback-btn">
                                    Use Stripe
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            )}

            <ToastContainer />
        </div>
    );
}
