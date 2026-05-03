import React from "react";
import "../Home/landingPage.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import axios from "axios";
import Product from "../../components/Product";
import Loading from "../../components/Loading";
import {getProductId, getProductsFromResponse} from "../../utils/productHelpers";

const ResourcesSection = React.lazy(() => import("../../components/ResourceSection"));
const fallbackBlogImage = require("../../assets/img/htbc-blog.jpg");
const fallbackDonationImage = require("../../assets/img/htbc-donate1.png");

const reducer = (state, action) => {
    switch (action.type) {
        case "FETCH_REQUEST":
            return {...state, loading: true};
        case "FETCH_SUCCESS":
            return {...state, loading: false, products: action.payload};
        case "FETCH_FAIL":
            return {...state, loading: false, error: action.payload};
        default:
            return state;
    }
};

export default function LandingPage() {
    const [{loading, products, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        products: [],
        error: "",
    });
    const [latestBlog, setLatestBlog] = React.useState(null);
    const [resources, setResources] = React.useState([]);
    const [impactStories, setImpactStories] = React.useState([]);
    const [contentLoading, setContentLoading] = React.useState({
        blog: true,
        resources: true,
        donations: true,
    });
    const [contentErrors, setContentErrors] = React.useState({
        blog: "",
        resources: "",
        donations: "",
    });

    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
            try {
                const result = await axios.get("/api/products", {params: {limit: 4}});
                dispatch({type: "FETCH_SUCCESS", payload: getProductsFromResponse(result.data)});
            } catch (error) {
                dispatch({type: "FETCH_FAIL", payload: error.message});
            }
        };

        fetchData();
    }, []);

    React.useEffect(() => {
        let isMounted = true;

        const fetchLandingContent = async () => {
            setContentLoading({blog: true, resources: true, donations: true});
            setContentErrors({blog: "", resources: "", donations: ""});

            const [blogResult, resourcesResult, impactStoriesResult] = await Promise.allSettled([
                axios.get("/api/blogs", {params: {page: 1, limit: 1, type: "blog"}}),
                axios.get("/api/resources", {params: {page: 1, limit: 5}}),
                axios.get("/api/impact-stories", {params: {page: 1, limit: 3}}),
            ]);

            if (!isMounted) return;

            const nextErrors = {blog: "", resources: "", donations: ""};

            if (blogResult.status === "fulfilled") {
                const blogData = blogResult.value.data;
                const blogPosts = Array.isArray(blogData) ? blogData : blogData?.posts || [];
                setLatestBlog(blogPosts[0] || null);
            } else {
                nextErrors.blog = blogResult.reason?.response?.data?.message || "Latest blog post is unavailable right now.";
            }

            if (resourcesResult.status === "fulfilled") {
                const resourcesData = resourcesResult.value.data;
                setResources(Array.isArray(resourcesData) ? resourcesData : resourcesData?.resources || []);
            } else {
                nextErrors.resources = resourcesResult.reason?.response?.data?.message || "Resources are unavailable right now.";
            }

            if (impactStoriesResult.status === "fulfilled") {
                const storiesData = impactStoriesResult.value.data;
                setImpactStories(Array.isArray(storiesData) ? storiesData : storiesData?.stories || []);
            } else {
                nextErrors.donations = impactStoriesResult.reason?.response?.data?.message || "Donation stories are unavailable right now.";
            }

            setContentErrors(nextErrors);
            setContentLoading({blog: false, resources: false, donations: false});
        };

        fetchLandingContent();

        return () => {
            isMounted = false;
        };
    }, []);

    const latestBlogImage = latestBlog?.imageUrl || fallbackBlogImage;
    const latestBlogExcerpt = latestBlog?.excerpt || latestBlog?.metaDescription || "Read the latest reflection from our parish community.";

    return (
        <div>
            <div className="header-banner">
                <div className="header-text">
                    <h1>Explore Our Faith</h1>
                    <p className="header-subtext">
                        Step into the foundation of what we believe, our values, our hope, and the truth that shapes how <br /> we live and love. Whether you're curious, searching, or ready to grow
                        deeper,
                        <br />
                        this is where the journey begins
                    </p>
                </div>
            </div>

            <div className="main-content">
                <div className="about-us">
                    <div className="who-we-are">WHO WE ARE</div>
                    <h2>About Us</h2>
                    <p>
                        Welcome to our parish, a community rooted in the love of Christ, united in the Sacraments, and committed to living the Gospel every day. We are more than a building; we are a
                        family of faith, journeying together through prayer, and service. Whether you've been here before or this is your first time, there's a place for you here. Our mission is
                        simple: to know Christ, grow in His love, and share that love with the world. Through the Eucharist, Scripture, and fellowship, we strive to reflect God's light in our homes,
                        neighborhoods, and beyond. Join us as we walk in faith, grow in grace, and build a vibrant Catholic community, one heart at a time.
                    </p>
                    <a href="#">Read More</a>
                </div>

                <div className="blog-section">
                    <div className="blog-image">
                        <img src={latestBlogImage} alt={latestBlog?.title || "Church Interior"} />
                    </div>
                    <div className="blog-content">
                        <h2>Latest Blog Post</h2>
                        {contentLoading.blog ? (
                            <div className="landing-section-state landing-section-state--inline">
                                <Loading message="Loading latest blog..." />
                            </div>
                        ) : contentErrors.blog ? (
                            <div className="landing-section-state landing-section-state--error landing-section-state--inline">{contentErrors.blog}</div>
                        ) : latestBlog ? (
                            <>
                                <h3>{latestBlog.title}</h3>
                                <p>{latestBlogExcerpt}</p>
                                <Link to="/blog">Read More</Link>
                            </>
                        ) : (
                            <div className="landing-section-state landing-section-state--inline">No blog post has been published yet.</div>
                        )}
                    </div>
                </div>

                <div className="news-section">
                    <div className="news-header">
                        <div className="date">TODAY</div>
                        <h2>News</h2>
                        <p>Stay informed with the latest from our parish community.</p>
                        <FontAwesomeIcon icon={faAngleLeft} className="news-arrow" />
                        <FontAwesomeIcon icon={faAngleRight} className="news-arrow" />
                    </div>
                    <div className="news-grid">
                        <div className="news-item">
                            <img src={require("../../assets/img/htbc-new1.png")} alt="Church in the World" />
                            <h3>Church in the World</h3>
                            <p>
                                Pope Francis calls for "Global Day of Prayer for Peace" in response to ongoing conflicts around the world. Pope Francis has declared July 7th a day of fasting and
                                prayer for global peace and reconciliation.
                            </p>
                            <a href="#" className="read-more">
                                Read More
                            </a>
                        </div>
                        <div className="news-item">
                            <img src={require("../../assets/img/htbc-news2.png")} alt="Parish Announcements" />
                            <h3>Parish Announcements</h3>
                            <p>
                                New Mass Schedule Begins July 1st. Starting July 1st, weekday Mass will now begin at 6:30 AM instead of 7:00 AM to accommodate early workers. Sunday Mass times remain
                                unchanged.
                            </p>
                            <a href="#" className="read-more">
                                Read More
                            </a>
                        </div>
                        <div className="news-item">
                            <img src={require("../../assets/img/htbc-news3.png")} alt="Faith in Action" />
                            <h3>Faith in Action</h3>
                            <p>Parish Feeds 300 Families in Outreach Drive. Thanks to your generosity, our Corpus Christi Food Drive provided meals for over 300 families in need last week.</p>
                            <a href="#" className="read-more">
                                Read More
                            </a>
                        </div>
                        <div className="news-item">
                            <img src={require("../../assets/img/htbc-news4.png")} alt="From the Parish Priest's Desk" />
                            <h3>From the Parish Priest's Desk</h3>
                            <p>
                                Walking in Faith, Even When It's Hard. In this week's reflection, Fr. Michael discusses how doubt and faith often walk hand and how God's grace meets us right where we
                                are.
                            </p>
                            <a href="#" className="read-more">
                                Read More
                            </a>
                        </div>
                    </div>
                </div>

                <div className="shop-section">
                    <div className="shop-header">
                        <div className="title">Shop</div>
                        <div className="header-content">
                            <h2>Discover Our Featured Products</h2>

                            <div className="cart-badge">
                                <p>0</p>
                                <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                            </div>

                            <a href="#" className="view-all">
                                <FontAwesomeIcon icon={faAngleRight} className="news-arrow" />
                            </a>
                        </div>
                    </div>
                    <div className="shop-grid">
                        {loading ? (
                            <div className="shop-loading">
                                <Loading message="Loading products..." />
                            </div>
                        ) : error ? (
                            <div className="shop-error">{error}</div>
                        ) : (
                            products.map((product) => <Product key={getProductId(product)} product={product} />)
                        )}
                    </div>
                </div>

                <React.Suspense fallback={<Loading message="Loading resources..." />}>
                    <ResourcesSection resources={resources} loading={contentLoading.resources} error={contentErrors.resources} />
                </React.Suspense>

                <div className="community-container">
                    <div className="community-text">
                        <h1>Our Community</h1>
                        <p>
                            At the heart of our parish is a vibrant, welcoming community united by faith, love, and service. From young families to seniors, lifelong Catholics to those just beginning
                            their journey, we grow together as one body in Christ.
                        </p>
                        <p>
                            Here, faith comes to life through friendship, fellowship, and shared purpose. Whether it's through small groups, ministries, outreach programs, or Sunday coffee after Mass,
                            there's always a place for you to belong, serve, and be supported. Come as you are. Let's grow in grace together.
                        </p>
                        <a href="#">Explore Our Community</a>
                    </div>
                    <div className="community-image">
                        <img src={require("../../assets/img/htbc-commu.png")} alt="Community gathering" />
                    </div>
                </div>

                <div className="donate-container">
                    <div className="donate-header">
                        <div className="support-mission">SUPPORT OUR MISSION</div>
                        <h1>Donate</h1>
                        <p>Your gift fuels faith, service, and growth. Thank you.</p>
                    </div>
                    {contentLoading.donations ? (
                        <div className="landing-section-state">
                            <Loading message="Loading donation stories..." />
                        </div>
                    ) : contentErrors.donations ? (
                        <div className="landing-section-state landing-section-state--error">{contentErrors.donations}</div>
                    ) : impactStories.length === 0 ? (
                        <div className="landing-section-state">No donation stories have been posted yet.</div>
                    ) : (
                        <div className="donate-grid">
                            {impactStories.map((story) => (
                                <div key={story._id} className="donate-item">
                                    <img src={story.imageUrl || fallbackDonationImage} alt={story.title} />
                                    <div className="donate-overlay">
                                        <Link to={`/donationform/${story._id}`} className="donate-button">
                                            Donate
                                        </Link>
                                    </div>
                                    <p>{story.title}</p>
                                    <p className="description">{story.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
