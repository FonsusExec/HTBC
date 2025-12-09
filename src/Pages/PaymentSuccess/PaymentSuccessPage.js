// PaymentSuccess.jsx
import React from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";

export default function PaymentSuccess() {
    const navigate = useNavigate();

    return (
        <div style={{textAlign: "center", padding: "50px"}}>
            <h1>Payment Successful!</h1>
            <p>Thank you for your order. We'll process it soon.</p>
            <button onClick={() => navigate("/")}>Continue Shopping</button>
            <button
                onClick={() => {
                    toast.info("Order confirmed!");
                    navigate("/orders");
                }}
            >
                View Orders
            </button>
        </div>
    );
}
