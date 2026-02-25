import React from "react";
import "./App.css";
import {HashRouter, Route, Routes} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
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
import AllProductPage from "./Pages/AllProductPage/AllProductPage";
import Blog from "./Pages/BlogPage/Blog";
import CreateBlog from "./Admin/CreateBlog/CreateBlog";
import BlogList from "./Admin/BlogList/BlogList ";
import AdminLayout from "./components/AdminLayout";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditBlog from "./Admin/CreateBlog/EditBlog";
import BlogDetail from "./Admin/BlogDetail/BlogDetail";
import NewsArticle from "./Pages/News/NewsArticle";
import CreateNews from "./Admin/CreateNews/CreateNews";
import EditNews from "./Admin/CreateNews/EditNews";

const GOOGLE_CLIENT_ID = "53484533068-h210045g5v4616crba7g8183nicq9rq7.apps.googleusercontent.com";

function App() {
    return (
        <div className="App">
            <HelmetProvider>
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
                                        <Route path="all-products" element={<AllProductPage />} />
                                        <Route path="blog" element={<Blog />} />
                                        <Route path="orders" element={<Orders />} />
                                        <Route path="news" element={<NewsArticle />} />
                                        <Route path="*" element={<div>404 Not Found</div>} />
                                    </Route>

                                    {/* Admin Routes */}
                                    <Route path="admin" element={<AdminLayout />}>
                                        {/* <Route path="bloglist" element={<BlogList />} /> */}
                                        <Route path="bloglist" element={<BlogList contentType="blog" />} />
                                        <Route path="newslist" element={<BlogList contentType="news" />} />
                                        <Route path="create-blog" element={<CreateBlog />} />
                                        <Route path="edit-blog/:id" element={<EditBlog />} />
                                        <Route path="view-blog/:id" element={<BlogDetail contentType="blog" />} />
                                        <Route path="create-news" element={<CreateNews />} />
                                        <Route path="edit-news/:id" element={<EditNews />} />
                                        <Route path="view-news/:id" element={<BlogDetail contentType="news" />} />
                                        <Route path="*" element={<div>Admin 404 Not Found</div>} />
                                    </Route>

                                    <Route path="*" element={<div>404 Not Found</div>} />
                                </Routes>
                            </HashRouter>
                        </CartProvider>
                    </AuthProvider>
                </GoogleOAuthProvider>
            </HelmetProvider>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default App;
