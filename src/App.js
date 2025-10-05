import React from "react";
import "./App.css";
import {HashRouter, Route, Routes} from "react-router-dom";
import {Layout} from "./Global/Layout";
import LandingPage from "./Pages/Home/LandingPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import CreateAccount from "./Pages/CreateAccount/CreateAccount";
import ProductScreen from "./Pages/ProductPage/ProductScreen";

function App() {
    return (
        <div className="App">
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<LandingPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="create-account" element={<CreateAccount />} />
                        <Route path="product/:htbc" element={<ProductScreen />} />
                        <Route path="*" element={<div>404 Not Found</div>} />
                    </Route>
                </Routes>
            </HashRouter>
        </div>
    );
}

export default App;
