import React, {useState} from "react";
import axios from "axios";
import {Link, useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import "../LoginPage/loginPage.css";
import "./forgotPassword.css";

export default function ResetPassword() {
    const {token} = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((currentForm) => ({...currentForm, [name]: value}));
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!formData.password || !formData.confirmPassword) {
            toast.error("Please fill in both password fields.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        try {
            setIsSubmitting(true);
            const {data} = await axios.post(`/api/users/reset-password/${token}`, formData);
            toast.success(data.message || "Password reset successfully.");
            navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to reset password right now.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container login-page-container password-page-container">
            <div className="login-form password-form">
                <h2>Reset Password</h2>
                <p className="password-helper-text">Choose a new password for your account.</p>

                <form className="form" onSubmit={submitHandler}>
                    <input type="password" name="password" placeholder="New Password" value={formData.password} onChange={handleInputChange} required minLength="6" />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        minLength="6"
                    />
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Reset Password"}
                    </button>
                    <div className="create-account">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
