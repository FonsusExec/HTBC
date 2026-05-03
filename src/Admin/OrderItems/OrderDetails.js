import React, {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";
import "./orderDetails.css";

const paymentStyle = (p) => {
    if (p === "Success") return "ord-pay ord-pay--success";
    if (p === "Failed") return "ord-pay ord-pay--failed";
    return "ord-pay";
};

const progressStyle = (p) => {
    if (p === "Completed") return "ord-badge ord-badge--completed";
    if (p === "Ongoing") return "ord-badge ord-badge--ongoing";
    if (p === "Cancelled") return "ord-badge ord-badge--cancelled";
    return "ord-badge";
};

export default function OrderDetail() {
    const navigate = useNavigate();
    const {id} = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    toast.error("Please login to view this order");
                    navigate("/login");
                    return;
                }

                const {data} = await axios.get(`/api/orders/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                setOrder(data);
            } catch (err) {
                console.error("Order detail error:", err);

                if (err.response?.status === 401) {
                    setError("Session expired. Please login again.");
                    toast.error("Session expired. Please login again.");
                } else if (err.response?.status === 404) {
                    setError("Order not found");
                    toast.error("Order not found");
                } else {
                    const msg = err.response?.data?.message || "Failed to load order details";
                    setError(msg);
                    toast.error(msg);
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id, navigate]);

    if (loading) return <div className="ord-detail-loading">Loading order details...</div>;

    if (error || !order) {
        return (
            <div className="ord-detail-error">
                <p>{error || "Order not found"}</p>
                <button onClick={() => navigate(-1)} className="ord-btn-secondary">
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="ord-detail-wrapper">
            <div className="ord-detail-card">
                <div className="ord-detail-header">
                    <button className="ord-back-btn" onClick={() => navigate(-1)}>
                        ← Back to Orders
                    </button>
                    <h1>Order Details</h1>
                    <span className="ord-detail-id">Order #{order.orderId || order._id}</span>
                </div>

                <div className="ord-detail-content">
                    <div className="ord-detail-summary">
                        <div className="ord-detail-info">
                            <p>
                                <strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <p>
                                <strong>Customer:</strong> {order.shipping?.firstName} {order.shipping?.lastName || ""}
                            </p>
                            <p>
                                <strong>Email:</strong> {order.shipping?.email}
                            </p>
                            {order.shipping?.phone && (
                                <p>
                                    <strong>Phone:</strong> {order.shipping.phone}
                                </p>
                            )}
                        </div>

                        <div className="ord-detail-status">
                            <span className={paymentStyle(order.payment || "Pending")}>Payment: {order.payment || "Pending"}</span>
                            <span className={progressStyle(order.status || "Ongoing")}>Status: {order.status || "Ongoing"}</span>
                        </div>
                    </div>

                    {order.shipping && (
                        <div className="ord-detail-section">
                            <h3>Shipping Address</h3>
                            <p>{order.shipping.shippingAddress}</p>
                            <p>
                                {order.shipping.city}, {order.shipping.state} {order.shipping.zip}
                            </p>
                        </div>
                    )}

                    <div className="ord-detail-section">
                        <h3>Order Items ({order.items?.length || 0})</h3>
                        <div className="ord-items-list">
                            {order.items &&
                                order.items.map((item, index) => (
                                    <div key={index} className="ord-item-row">
                                        <div>
                                            <strong>{item.name}</strong>
                                        </div>
                                        <div>
                                            Qty: {item.quantity} × ${item.price?.toFixed(2)}
                                        </div>
                                        <div>${(item.quantity * (item.price || 0)).toFixed(2)}</div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="ord-detail-total">
                        <div className="total-row">
                            <span>Total Amount</span>
                            <span>${(order.total || order.subtotal || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="ord-detail-footer">
                    <button className="ord-btn-secondary" onClick={() => navigate(-1)}>
                        Back to Orders
                    </button>
                </div>
            </div>
        </div>
    );
}
