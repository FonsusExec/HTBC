import React from "react";
// import backgroundImage from "../assets/img/htbc-login.png";
import "../CreateAccount/createAccount.css";
import htbcGoogleLogo from "../../assets/img/htbc-google.webp";

export default function CreateAccount() {
    return (
        <div className="login-container">
            <div className="signup-form">
                <h2>Create an Account</h2>
                <form>
                    {/* <label htmlFor="fullName">Full Name</label> */}
                    <input type="text" id="fullName" placeholder="Full Name" />
                    {/* <label htmlFor="email">Email Address</label> */}
                    <input type="email" id="email" placeholder="Email Address" />
                    {/* <label htmlFor="password">Password</label> */}
                    <input type="password" id="password" placeholder="Password" />
                    {/* <label htmlFor="confirmPassword">Confirm Password</label> */}
                    <input type="password" id="confirmPassword" placeholder="Confirm Password" />
                    <button type="submit">Sign Up</button>
                    <div className="login-link">
                        Already have an account? <a href="#">Login</a>
                    </div>
                    <div className="google-signup">
                        <a href="#" onClick={() => alert("Google signup functionality to be implemented")}>
                            <img src={htbcGoogleLogo} alt="Google Logo" className="google-logo" />
                            Sign Up with Google
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
