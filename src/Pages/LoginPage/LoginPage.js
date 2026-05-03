import React, {useState} from "react";
// import backgroundImage from "../assets/img/htbc-login.png";
import "../LoginPage/loginPage.css";
import {Link} from "react-router-dom";
import {useAuth} from "../../AuthContext"; // Adjust path
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {GoogleLogin} from "@react-oauth/google";

export default function LoginPage() {
    const {googleLogin} = useAuth();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const {login} = useAuth();
    // const {setUser, setIsLoggedIn} = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const res = await fetch("http://localhost:5000/api/users/google-auth", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({credential: credentialResponse.credential}),
            });

            const data = await res.json();

            if (!data.success) {
                toast.error(data.message || "Google login failed");
                return;
            }

            // Use AuthContext for everything
            googleLogin(data.user, data.token);

            toast.success("Logged in with Google!");

            navigate("/");
        } catch (err) {
            toast.error("Google login error");
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields!");
            return;
        }

        setIsSubmitting(true);
        const {success} = await login(formData.email, formData.password);
        if (success) {
            navigate("/"); // Or home/orders
        }
        setIsSubmitting(false);
    };

    return (
        <div className="login-container login-page-container">
            <div className="login-form">
                <h2>Login</h2>
                <form className="form" onSubmit={submitHandler}>
                    {/* <label htmlFor="email">Email Address</label> */}
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} required />
                    {/* <label htmlFor="password">Password</label> */}
                    <input type="password" name="password" required placeholder="Password" value={formData.password} onChange={handleInputChange} minLength="6" />
                    <div className="remember-me">
                        <div>
                            <input type="checkbox" id="remember" />
                            <label htmlFor="remember">Remember Me</label>
                        </div>
                        <div>
                            <p>
                                <a href="#">Forgot Password?</a>
                            </p>
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </button>
                    <div className="google-signup" style={{marginTop: "15px"}}>
                        <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast.error("Google login failed")} size="large" shape="pill" width="100%" />
                    </div>

                    <div className="create-account">
                        <Link to="/create-account">Create an Account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
