// OrderConfirmation.jsx - Enhanced Order Confirmation Page (Builds on Your Simple Success Page)
import React, {useEffect, useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {toast, ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import {useCart} from "../../CartContext"; // Optional for cart reference if needed
import "./orderConfirmation.css"; // Reuse your existing CSS file

export default function OrderConfirmation() {
    const navigate = useNavigate();
    const location = useLocation();
    const {getCartTotal} = useCart(); // Optional

    const [orderDetails, setOrderDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get order ID from location state (passed from CheckoutScreen)
    const orderId = location.state?.orderId || "order_" + Date.now(); // Fallback mock ID

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (!orderId) {
                setError("No order ID found.");
                setLoading(false);
                return;
            }

            try {
                // Fetch order details from backend (adjust endpoint)
                const {data} = await axios.get(`/api/orders/${orderId}`);
                setOrderDetails(data);

                // ← INSERT THE SNIPPET HERE
                const formattedOrderDetails = {
                    ...data,
                    date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                };
                setOrderDetails(formattedOrderDetails);
                // END INSERT

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch order:", err);
                setError("Failed to load order details. Please contact support.");
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (loading) {
        return (
            <div className="payment-page-container">
                <div className="payment-page">
                    <div className="loading-container" style={{textAlign: "center", padding: "50px"}}>
                        <h2>Loading Order Confirmation...</h2>
                        <p>Your payment was successful. Fetching details.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="payment-page-container">
                <div className="payment-page">
                    <div className="error-container" style={{textAlign: "center", padding: "50px"}}>
                        <h2>Oops! Something Went Wrong</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate("/")} className="continue-shopping-button">
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Mock data if no backend fetch (replace with real data from API)
    const mockOrder = orderDetails || {
        id: orderId,
        items: location.state?.cart || [{name: "Sample Item", qty: 1, price: 18.0}], // From state or cart
        subtotal: location.state?.total || getCartTotal() || 18.0,
        total: location.state?.total || 18.0,
        shipping: location.state?.shipping || {firstName: "John", lastName: "Doe", address: "123 Main St"},
        paymentId: location.state?.paymentId || "pi_123",
        status: "confirmed",
        date: new Date().toLocaleDateString(),
    };

    return (
        <div className="payment-page-container">
            <div className="payment-page">
                <div className="confirmation-header">
                    <h1>Order Confirmed!</h1>
                    <img src="https://cdn-icons-png.flaticon.com/512/845/845646.png" alt="Success" style={{width: "150px", height: "150px"}} />
                    <p>Thank you for your purchase. Your order #{mockOrder.id} has been placed successfully.</p>
                </div>

                <div className="confirmation-content">
                    {/* Order Summary */}
                    <div className="confirmation-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {mockOrder.items.map((item, index) => (
                                <div key={index} className="summary-item">
                                    <span>
                                        {item.name} (x{item.qty})
                                    </span>
                                    <span>${(item.price * item.qty).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>${mockOrder.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row">
                                <span>Shipping:</span>
                                <span>$0.00</span> {/* Dynamic from backend */}
                            </div>
                            <div className="total-row bold">
                                <span>Total:</span>
                                <span>${mockOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shipping Details */}
                    <div className="confirmation-shipping">
                        <h2>Shipping Details</h2>
                        <p>
                            {mockOrder.shipping.firstName} {mockOrder.shipping.lastName}
                        </p>
                        <p>{mockOrder.shipping.shippingAddress}</p>
                        <p>
                            {mockOrder.shipping.houseNumber}, {mockOrder.shipping.state} {mockOrder.shipping.zip}
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div className="confirmation-payment">
                        <h2>Payment Details</h2>
                        <p>Payment ID: {mockOrder.paymentId}</p>
                        <p>Status: {mockOrder.status.toUpperCase()}</p>
                        <p>Date: {mockOrder.date}</p>
                    </div>
                </div>

                <div className="confirmation-actions">
                    <button onClick={() => navigate("/")} className="continue-shopping-button">
                        Continue Shopping
                    </button>
                    <button
                        className="view-orders-button"
                        onClick={() => {
                            toast.info("Order confirmed!");
                            navigate("/orders");
                        }}
                    >
                        View Orders
                    </button>
                    <button className="print-button" onClick={() => window.print()}>
                        Print Confirmation
                    </button>
                </div>
            </div>

            <ToastContainer />
        </div>
    );
}
