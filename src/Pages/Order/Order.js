import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {useAuth} from "../../AuthContext"; // Adjust path
import {toast} from "react-toastify";
import "../Order/order.css"; // New CSS file below
import Loading from "../../components/Loading";

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const {isLoggedIn} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoggedIn) {
            toast.error("Please log in to view orders.");
            navigate("/login");
            return;
        }

        const fetchOrders = async () => {
            try {
                const {data} = await axios.get("/api/orders"); // Protected endpoint
                setOrders(data); // Expects array of { orderId, total, status, createdAt, items: [...] }
                setLoading(false);
            } catch (err) {
                console.error("Fetch orders error:", err);
                setError(err.response?.data?.message || "Failed to load orders.");
                toast.error("Failed to load orders. Please try again.");
                setLoading(false);
            }
        };

        fetchOrders();
    }, [isLoggedIn, navigate]);

    if (loading) {
        return (
            <div className="orders-loading">
                <Loading />
            </div>
        );
    }

    if (error) {
        return <div className="orders-error">{error}</div>;
    }

    return (
        <div className="orders-page">
            <div className="orders-container">
                <h1>My Orders</h1>
                {orders.length === 0 ? (
                    <p>
                        No orders yet. <a href="/shop">Start shopping!</a>
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Items</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.orderId}>
                                        <td>#{order.orderId}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>${order.total.toFixed(2)}</td>
                                        <td>
                                            <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
                                        </td>
                                        <td>{order.items.length}</td>
                                        <td>
                                            <button className="view-details-btn" onClick={() => navigate("/order-confirmation", {state: {orderId: order.orderId}})}>
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
