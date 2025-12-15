import React, {useState} from "react";
import "../CreateAccount/createAccount.css";
import {useAuth} from "../../AuthContext"; // Adjust path
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {GoogleLogin} from "@react-oauth/google";
import axios from "axios";

export default function CreateAccount() {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const {signup} = useAuth(); // your existing email/password signup function
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }
        if (!formData.fullName || !formData.email || !formData.password) {
            toast.error("Please fill in all fields!");
            return;
        }

        setIsSubmitting(true);
        try {
            const {success, user, message} = await signup(formData.fullName, formData.email, formData.password);

            if (success) {
                localStorage.setItem("userInfo", JSON.stringify(user));
                toast.success("Account created successfully!");
                navigate("/"); // or wherever you want
            } else {
                toast.error(message || "Signup failed");
            }
        } catch (err) {
            toast.error(err.message || "Signup error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Google login handler
    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const token = credentialResponse.credential; // JWT from Google

            // Decode JWT to get user info
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split("")
                    .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                    .join("")
            );
            const googleUser = JSON.parse(jsonPayload);

            // Send to backend
            const response = await axios.post("http://localhost:5000/api/users/google-auth", {
                name: googleUser.name,
                email: googleUser.email,
                googleId: googleUser.sub,
            });

            localStorage.setItem("userInfo", JSON.stringify(response.data.user));
            toast.success("Logged in with Google successfully!");
            navigate("/"); // navigate after login
        } catch (err) {
            toast.error(err.response?.data?.message || "Google login failed");
        }
    };

    return (
        <div className="login-container">
            <div className="signup-form">
                <h2>Create an Account</h2>
                <form className="form" onSubmit={submitHandler}>
                    <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleInputChange} required />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
                    <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required minLength="6" />
                    <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleInputChange} required />
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating..." : "Sign Up"}
                    </button>
                    <div className="login-link">
                        Already have an account? <a href="/login">Login</a>
                    </div>
                </form>

                <div className="google-signup" style={{marginTop: "20px", textAlign: "center"}}>
                    <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error("Google login failed")} />
                </div>
            </div>
        </div>
    );
}
