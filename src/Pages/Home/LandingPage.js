import React from "react";
import "../Home/landingPage.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import axios from "axios";
import Product from "../../components/Product";
import Loading from "../../components/Loading";
import {getProductId, getProductsFromResponse} from "../../utils/productHelpers";
import {useCart} from "../../CartContext";

const ResourcesSection = React.lazy(() => import("../../components/ResourceSection"));
const fallbackBlogImage = require("../../assets/img/htbc-blog.jpg");
const fallbackDonationImage = require("../../assets/img/htbc-donate1.png");
const fallbackNewsImage = require("../../assets/img/htbc-new1.png");

const decodeHtmlEntities = (value = "") => {
    let text = String(value).replace(/&nbsp;|&#160;|\u00a0/gi, " ");

    if (typeof document === "undefined") return text;

    const textarea = document.createElement("textarea");
    for (let i = 0; i < 2; i += 1) {
        textarea.innerHTML = text;
        text = textarea.value;
    }

    return text.replace(/&nbsp;|&#160;|\u00a0/gi, " ");
};

const stripHtml = (value = "") => {
    const decodedValue = decodeHtmlEntities(value);

    return decodeHtmlEntities(
        decodedValue
            .replace(/&nbsp;|&#160;|\u00a0/gi, " ")
            .replace(/<[^>]*>/g, " "),
    )
        .replace(/\s+/g, " ")
        .trim();
};

const getImageSrc = (imageUrl, fallbackImage) => {
    if (!imageUrl) return fallbackImage;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const truncateText = (value = "", maxLength = 135) => {
    const text = stripHtml(value);
    if (text.length <= maxLength) return text;

    const trimmed = text.slice(0, maxLength).trimEnd();
    const lastSpace = trimmed.lastIndexOf(" ");
    const safeText = lastSpace > 80 ? trimmed.slice(0, lastSpace) : trimmed;

    return `${safeText}...`;
};

const getNewsSummary = (article) => stripHtml(article.description || article.metaDescription || article.content || "") || "Read the latest update from How To Be Catholic.";

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
    const newsTrackRef = React.useRef(null);
    const {getCartCount} = useCart();
    const [{loading, products, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        products: [],
        error: "",
    });
    const [latestBlog, setLatestBlog] = React.useState(null);
    const [latestNews, setLatestNews] = React.useState([]);
    const [resources, setResources] = React.useState([]);
    const [impactStories, setImpactStories] = React.useState([]);
    const [contentLoading, setContentLoading] = React.useState({
        blog: true,
        news: true,
        resources: true,
        donations: true,
    });
    const [contentErrors, setContentErrors] = React.useState({
        blog: "",
        news: "",
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
            setContentLoading({blog: true, news: true, resources: true, donations: true});
            setContentErrors({blog: "", news: "", resources: "", donations: ""});

            const [blogResult, newsResult, resourcesResult, impactStoriesResult] = await Promise.allSettled([
                axios.get("/api/blogs", {params: {page: 1, limit: 1, type: "blog"}}),
                axios.get("/api/news", {params: {page: 1, limit: 8, sort: "newest"}}),
                axios.get("/api/resources", {params: {page: 1, limit: 5}}),
                axios.get("/api/impact-stories", {params: {page: 1, limit: 3}}),
            ]);

            if (!isMounted) return;

            const nextErrors = {blog: "", news: "", resources: "", donations: ""};

            if (blogResult.status === "fulfilled") {
                const blogData = blogResult.value.data;
                const blogPosts = Array.isArray(blogData) ? blogData : blogData?.posts || [];
                setLatestBlog(blogPosts[0] || null);
            } else {
                nextErrors.blog = blogResult.reason?.response?.data?.message || "Latest blog post is unavailable right now.";
            }

            if (newsResult.status === "fulfilled") {
                const newsData = newsResult.value.data;
                setLatestNews(Array.isArray(newsData) ? newsData.slice(0, 8) : (newsData?.articles || []).slice(0, 8));
            } else {
                nextErrors.news = newsResult.reason?.response?.data?.message || "Latest news is unavailable right now.";
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
            setContentLoading({blog: false, news: false, resources: false, donations: false});
        };

        fetchLandingContent();

        return () => {
            isMounted = false;
        };
    }, []);

    const latestBlogImage = getImageSrc(latestBlog?.imageUrl, fallbackBlogImage);
    const latestBlogExcerpt = stripHtml(latestBlog?.excerpt || latestBlog?.metaDescription || latestBlog?.content || "") || "Read the latest reflection from our parish community.";
    const featuredProducts = products.slice(0, 4);
    const cartCount = getCartCount();

    const scrollLatestNews = (direction) => {
        if (!newsTrackRef.current) return;
        const card = newsTrackRef.current.querySelector(".landing-news-item");
        const scrollAmount = card ? card.offsetWidth + 18 : 300;
        newsTrackRef.current.scrollBy({left: direction * scrollAmount, behavior: "smooth"});
    };

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
                                <Link to={`/blog/${latestBlog._id}`}>Read More</Link>
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
                        <div className="landing-news-controls" aria-label="Latest news carousel controls">
                            <button type="button" className="landing-news-arrow" onClick={() => scrollLatestNews(-1)} aria-label="Scroll latest news left">
                                <FontAwesomeIcon icon={faAngleLeft} />
                            </button>
                            <button type="button" className="landing-news-arrow" onClick={() => scrollLatestNews(1)} aria-label="Scroll latest news right">
                                <FontAwesomeIcon icon={faAngleRight} />
                            </button>
                        </div>
                    </div>
                    {contentLoading.news ? (
                        <div className="landing-section-state">
                            <Loading message="Loading latest news..." />
                        </div>
                    ) : contentErrors.news ? (
                        <div className="landing-section-state landing-section-state--error">{contentErrors.news}</div>
                    ) : latestNews.length === 0 ? (
                        <div className="landing-section-state">No news has been published yet.</div>
                    ) : (
                        <div className="landing-news-track" ref={newsTrackRef}>
                            {latestNews.map((article) => {
                                const title = stripHtml(article.title || "News update");

                                return (
                                    <article className="landing-news-item" key={article._id}>
                                        <img src={getImageSrc(article.imageUrl, fallbackNewsImage)} alt={title} />
                                        <div className="landing-news-copy">
                                            <h3>{title}</h3>
                                            <p>{getNewsSummary(article)}</p>
                                        </div>
                                        <Link to={`/news/${article._id}`} className="read-more">
                                            Read More
                                        </Link>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="shop-section">
                    <div className="shop-header">
                        <div className="title">Shop</div>
                        <div className="header-content">
                            <h2>Discover Our Featured Products</h2>

                            <Link to="/cart" className="cart-badge" aria-label={`View cart with ${cartCount} items`}>
                                <p>{cartCount}</p>
                                <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                            </Link>

                            <Link to="/all-products" className="view-all" aria-label="View all products">
                                <FontAwesomeIcon icon={faAngleRight} className="news-arrow" />
                            </Link>
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
                            featuredProducts.map((product) => <Product key={getProductId(product)} product={product} />)
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
                                    <p className="description">{truncateText(story.description)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
