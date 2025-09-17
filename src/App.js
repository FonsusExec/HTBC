import React from "react";
import "./App.css";
import {HashRouter, Route, Routes} from "react-router-dom";
import {Layout} from "./Global/Layout";
import LandingPage from "./Pages/Home/LandingPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import CreateAccount from "./Pages/CreateAccount/CreateAccount";

function App() {
    return (
        <div className="App">
            <HashRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<LandingPage />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="create-account" element={<CreateAccount />} />
                        {/* Add other routes as needed */}
                        {/* Example: <Route path="about" element={<About />} /> */}
                        <Route path="*" element={<div>404 Not Found</div>} />
                    </Route>
                </Routes>
            </HashRouter>
        </div>
    );
}

export default App;
