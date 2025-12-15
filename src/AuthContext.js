import React, {createContext, useState, useEffect, useContext} from "react";
import axios from "axios";
import {toast} from "react-toastify";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const setAuthHeader = (token) => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common["Authorization"];
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setAuthHeader(token);
            axios
                .get("/api/users/me")
                .then(({data}) => setUser(data))
                .catch(() => {
                    localStorage.removeItem("token");
                    setAuthHeader(null);
                });
        }
        setLoading(false);
    }, []);

    // NORMAL EMAIL/PASSWORD LOGIN
    const login = async (email, password) => {
        try {
            const {data} = await axios.post("/api/users/signin", {email, password});
            localStorage.setItem("token", data.token);
            setAuthHeader(data.token);
            setUser(data.user);
            toast.success("Login successful!");
            return {success: true};
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed");
            return {success: false};
        }
    };

    // SIGNUP
    const signup = async (name, email, password) => {
        try {
            const {data} = await axios.post("/api/users/signup", {name, email, password});
            localStorage.setItem("token", data.token);
            setAuthHeader(data.token);
            setUser(data.user);
            toast.success("Account created!");
            return {success: true};
        } catch (err) {
            toast.error(err.response?.data?.message || "Signup failed");
            return {success: false};
        }
    };

    // NEW: GOOGLE LOGIN
    const googleLogin = (user, token) => {
        localStorage.setItem("token", token);
        setAuthHeader(token);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setAuthHeader(null);
        setUser(null);
        toast.info("Logged out");
    };

    const value = {
        user,
        login,
        signup,
        googleLogin, // ← MAKE AVAILABLE
        logout,
        loading,
        isLoggedIn: !!user,
        setUser, // ← ALSO MAKE AVAILABLE
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
