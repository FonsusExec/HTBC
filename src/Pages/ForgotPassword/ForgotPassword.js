import React, {useState} from "react";
import axios from "axios";
import {Link} from "react-router-dom";
import {toast} from "react-toastify";
import "../LoginPage/loginPage.css";
import "./forgotPassword.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitHandler = async (e) => {
        e.preventDefault();
        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            toast.error("Please enter your email address.");
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage("");
            const {data} = await axios.post("/api/users/forgot-password", {email: trimmedEmail});
            setMessage(data.message || "If an account exists for that email, a password reset link has been sent.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to send reset link right now.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container login-page-container password-page-container">
            <div className="login-form password-form">
                <h2>Forgot Password</h2>
                <p className="password-helper-text">Enter your account email and we will send you a secure link to reset your password.</p>

                <form className="form" onSubmit={submitHandler}>
                    <input type="email" name="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    {message && <p className="password-status-message">{message}</p>}
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                    <div className="create-account">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
