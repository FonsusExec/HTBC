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
import PaymentSuccess from "./Pages/PaymentSuccess/PaymentSuccessPage";

function App() {
    return (
        <div className="App">
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
                            <Route path="payment-success" element={<PaymentSuccess />} />
                            <Route path="*" element={<div>404 Not Found</div>} />
                        </Route>
                    </Routes>
                </HashRouter>
            </CartProvider>
        </div>
    );
}

export default App;
