import React from "react";
import "./App.css";
import {HashRouter, Route, Routes} from "react-router-dom";
import {Layout} from "./Global/Layout";
import LandingPage from "./Pages/Home/LandingPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import CreateAccount from "./Pages/CreateAccount/CreateAccount";
import ProductScreen from "./Pages/ProductPage/ProductScreen";
import CartScreen from "./Pages/CartScreen/CartScreen";
import CheckoutScreen from "./Pages/CheckOutPage/CheckOut";
import {CartProvider} from "./CartContext";
import OrderConfirmation from "./Pages/OrderConfirm/OrderConfirmation";
import {AuthProvider} from "./AuthContext";
import Orders from "./Pages/Order/Order";
import {GoogleOAuthProvider} from "@react-oauth/google";

const GOOGLE_CLIENT_ID = "53484533068-h210045g5v4616crba7g8183nicq9rq7.apps.googleusercontent.com";

function App() {
    return (
        <div className="App">
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <AuthProvider>
                    <CartProvider>
                        <HashRouter>
                            <Routes>
                                <Route path="/" element={<Layout />}>
                                    <Route index element={<LandingPage />} />
                                    <Route path="login" element={<LoginPage />} />
                                    <Route path="create-account" element={<CreateAccount />} />
                                    <Route path="product/:htbc" element={<ProductScreen />} />
                                    <Route path="cart" element={<CartScreen />} />
                                    <Route path="checkout" element={<CheckoutScreen />} />
                                    <Route path="order-confirmation" element={<OrderConfirmation />} />
                                    <Route path="orders" element={<Orders />} />

                                    <Route path="*" element={<div>404 Not Found</div>} />
                                </Route>
                            </Routes>
                        </HashRouter>
                    </CartProvider>
                </AuthProvider>
            </GoogleOAuthProvider>
        </div>
    );
}

export default App;
