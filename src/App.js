import React, {useEffect} from "react";
import "./App.css";
import {HashRouter, Navigate, Route, Routes, useLocation} from "react-router-dom";
import {HelmetProvider} from "react-helmet-async";
import {Layout} from "./Global/Layout";
import LandingPage from "./Pages/Home/LandingPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import CreateAccount from "./Pages/CreateAccount/CreateAccount";
import ForgotPassword from "./Pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./Pages/ForgotPassword/ResetPassword";
import ProductScreen from "./Pages/ProductPage/ProductScreen";
import CartScreen from "./Pages/CartScreen/CartScreen";
import CheckoutScreen from "./Pages/CheckOutPage/CheckOut";
import {CartProvider} from "./CartContext";
import OrderConfirmation from "./Pages/OrderConfirm/OrderConfirmation";
import {AuthProvider, useAuth} from "./AuthContext";
import Orders from "./Pages/Order/Order";
import {GoogleOAuthProvider} from "@react-oauth/google";
import AllProductPage from "./Pages/AllProductPage/AllProductPage";
import Blog from "./Pages/BlogPage/Blog";
import PublicBlogDetail from "./Pages/BlogPage/BlogDetail";
import CreateBlog from "./Admin/CreateBlog/CreateBlog";
import BlogList from "./Admin/BlogList/BlogList ";
import AdminLayout from "./components/AdminLayout";
import {ToastContainer} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditBlog from "./Admin/CreateBlog/EditBlog";
import BlogDetail from "./Admin/BlogDetail/BlogDetail";
import NewsArticle from "./Pages/News/NewsArticle";
import NewsDetail from "./Pages/News/NewsDetail";
import CreateNews from "./Admin/CreateNews/CreateNews";
import EditNews from "./Admin/CreateNews/EditNews";
import CreateResources from "./Admin/Resources/CreateResources";
import ResourceList from "./Admin/ResourceList/ResourceList";
import AboutUs from "./Pages/AboutUs/AboutUs";
import Donate from "./Pages/Donate/Donate";
import Community from "./Pages/Community/Community";
import EditResource from "./Admin/Resources/EditResource";
import AddProduct from "./Admin/ProductItems/AddProduct";
import ProductList from "./Admin/ProductItemList/ProductList";
import EditProduct from "./Admin/ProductItems/EditProduct";
import ViewProduct from "./Admin/ProductItems/ViewProduct";
import CategoryForm from "./Admin/ProductCategory/Category";
import SubCategoryForm from "./Admin/ProductCategory/SubCategory";
import EditCategory from "./Admin/ProductCategory/EditCategory";
import AdminOrders from "./Admin/OrderItems/Orders";
import OrderDetail from "./Admin/OrderItems/OrderDetails";
import CreateUser from "./Admin/AdminUser/CreateUser";
import UserRole from "./Admin/AdminUser/UserRole";
import UserView from "./Admin/AdminUser/UserView";
import ViewUserDetail from "./Admin/AdminUser/ViewUserDetail";
import EditUser from "./Admin/AdminUser/EditUser";
import DonationForm from "./Pages/Donate/DonationForm";
import DonationTracking from "./Admin/DonationTracker/DonationTracker";
import ImpactStories from "./Admin/DonationStory/ImpactStories";
import CreateImpactStory from "./Admin/DonationStory/CreateImpactStory";
import Dashboard from "./Admin/Dashboard/Dashboard";
import CommunityManagement from "./Admin/Community/CommunityManagement";
import ContactMessages from "./Admin/ContactMessages/ContactMessages";
import AboutContent from "./Admin/AboutContent/AboutContent";
import TestimonialsAdmin from "./Admin/Testimonials/TestimonialsAdmin";
import "./assets/css/responsive.css";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function ScrollToTop() {
    const {pathname, search} = useLocation();

    useEffect(() => {
        window.scrollTo({top: 0, left: 0, behavior: "auto"});
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, [pathname, search]);

    return null;
}

const normalizeRole = (role) => {
    if (!role) return "";
    const roleValue = typeof role === "string" ? role : role.name || role.slug || "";
    return roleValue.toLowerCase().replace(/[-_]+/g, " ").trim();
};

function RequireSuperAdmin({children}) {
    const {user, loading, isLoggedIn} = useAuth();

    if (loading) return null;
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (normalizeRole(user?.role) !== "super admin") return <Navigate to="/" replace />;

    return children;
}

function App() {
    return (
        <div className="App">
            <HelmetProvider>
                <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                    <AuthProvider>
                        <CartProvider>
                            <HashRouter>
                                <ScrollToTop />
                                <Routes>
                                    <Route path="/" element={<Layout />}>
                                        <Route index element={<LandingPage />} />
                                        <Route path="login" element={<LoginPage />} />
                                        <Route path="create-account" element={<CreateAccount />} />
                                        <Route path="forgot-password" element={<ForgotPassword />} />
                                        <Route path="reset-password/:token" element={<ResetPassword />} />
                                        <Route path="product/:htbc" element={<ProductScreen />} />
                                        <Route path="cart" element={<CartScreen />} />
                                        <Route path="checkout" element={<CheckoutScreen />} />
                                        <Route path="order-confirmation" element={<OrderConfirmation />} />
                                        <Route path="all-products" element={<AllProductPage />} />
                                        <Route path="blog" element={<Blog />} />
                                        <Route path="blog/:id" element={<PublicBlogDetail />} />
                                        <Route path="orders" element={<Orders />} />
                                        <Route path="news" element={<NewsArticle />} />
                                        <Route path="news/:id" element={<NewsDetail />} />
                                        <Route path="about-us" element={<AboutUs />} />
                                        <Route path="contact-us" element={<AboutUs />} />
                                        <Route path="donate" element={<Donate />} />
                                        <Route path="community" element={<Community />} />
                                        <Route path="donationform" element={<DonationForm />} />
                                        <Route path="donationform/:donationId" element={<DonationForm />} />
                                        <Route path="*" element={<div>404 Not Found</div>} />
                                    </Route>

                                    {/* Admin Routes */}
                                    <Route
                                        path="admin"
                                        element={
                                            <RequireSuperAdmin>
                                                <AdminLayout />
                                            </RequireSuperAdmin>
                                        }
                                    >
                                        <Route index element={<Dashboard />} />
                                        <Route path="dashboard" element={<Dashboard />} />
                                        {/* <Route path="bloglist" element={<BlogList />} /> */}
                                        <Route path="bloglist" element={<BlogList contentType="blog" />} />
                                        <Route path="newslist" element={<BlogList contentType="news" />} />
                                        <Route path="create-blog" element={<CreateBlog />} />
                                        <Route path="edit-blog/:id" element={<EditBlog />} />
                                        <Route path="create-news" element={<CreateNews />} />
                                        <Route path="edit-news/:id" element={<EditNews />} />
                                        <Route path="view-news/:id" element={<BlogDetail contentType="news" />} />
                                        <Route path="view-blog/:id" element={<BlogDetail contentType="blog" />} />
                                        <Route path="resourcelist" element={<ResourceList />} />
                                        <Route path="create-resource" element={<CreateResources />} />
                                        <Route path="edit-resource/:id" element={<EditResource />} />
                                        <Route path="add-product" element={<AddProduct />} />
                                        <Route path="productlist" element={<ProductList />} />
                                        <Route path="edit-product/:id" element={<EditProduct />} />
                                        <Route path="view-product/:id" element={<ViewProduct />} />
                                        <Route path="add-category" element={<CategoryForm />} />
                                        <Route path="add-subcategory" element={<SubCategoryForm />} />
                                        <Route path="edit-category/:id" element={<EditCategory />} />
                                        <Route path="orders" element={<AdminOrders />} />
                                        <Route path="view-orders/:id" element={<OrderDetail />} />
                                        <Route path="create-users" element={<CreateUser />} />
                                        <Route path="create-roles" element={<UserRole />} />
                                        <Route path="view-users" element={<UserView />} />
                                        <Route path="user-detail/:id" element={<ViewUserDetail />} />
                                        <Route path="edit-users/:id" element={<EditUser />} />
                                        <Route path="donation-tracker" element={<DonationTracking />} />
                                        <Route path="donation-story-list" element={<ImpactStories />} />
                                        <Route path="create-impact-story" element={<CreateImpactStory />} />
                                        <Route path="edit-impact-story/:id" element={<CreateImpactStory />} />
                                        <Route path="community" element={<CommunityManagement />} />
                                        <Route path="about-us" element={<AboutContent />} />
                                        <Route path="testimonials" element={<TestimonialsAdmin />} />
                                        <Route path="contact-messages" element={<ContactMessages />} />
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
