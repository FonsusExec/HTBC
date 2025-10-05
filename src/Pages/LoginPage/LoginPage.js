import React, {useState} from "react";
// import backgroundImage from "../assets/img/htbc-login.png";
import "../LoginPage/loginPage.css";
import {Link} from "react-router-dom";
import {Axios} from "axios";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const data = await Axios.post("/api/users/signup", {
                email,
                password,
            });
        } catch (err) {}
    };

    return (
        <div className="login-container">
            <div className="login-form">
                <h2>Login</h2>
                <form className="form" onSubmit={submitHandler}>
                    {/* <label htmlFor="email">Email Address</label> */}
                    <input type="email" required placeholder="Email Address" onChange={(e) => setEmail(e.target.value)} />
                    {/* <label htmlFor="password">Password</label> */}
                    <input type="password" required placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
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
