import React from "react";
// import backgroundImage from "../assets/img/htbc-login.png";
import "../LoginPage/loginPage.css";
import {Link} from "react-router-dom";

export default function LoginPage() {
    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Login</h2>
                <form>
                    {/* <label htmlFor="email">Email Address</label> */}
                    <input type="email" placeholder="Email Address" />
                    {/* <label htmlFor="password">Password</label> */}
                    <input type="password" placeholder="Password" />
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
                    <button type="submit">Login</button>
                    <div className="create-account">
                        <Link to="/create-account">Create an Account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
