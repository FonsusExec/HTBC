import React from "react";
import "../Home/landingPage.css";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight, faFacebookF, faTwitter, faInstagram} from "@fortawesome/free-solid-svg-icons";

export default function LandingPage() {
    const resources = [
        {icon: require("../../assets/img/htbc-doc1.webp"), title: "Liturgical Calendar"},
        {icon: require("../../assets/img/htbc-doc1.webp"), title: "Catechism Summary Guide.pdf"},
        {icon: require("../../assets/img/htbc-doc1.webp"), title: "Parish Weekly Bulletin .pdf"},
        {icon: require("../../assets/img/htbc-doc1.webp"), title: "Prayer Booklet.pdf"},
        {icon: require("../../assets/img/htbc-doc1.webp"), title: "Volunteer & Ministry Sign-Up Form"},
    ];

    const donateItems = [
        {
            image: require("../../assets/img/htbc-donate1.png"),
            title: "Outreach & Charity Programs",
            description: "Support our mission to feed the hungry, care for the sick, and assist vulnerable families in our local community.",
        },
        {
            image: require("../../assets/img/htbc-donate2.png"),
            title: "Parish Maintenance & Upkeep",
            description: "Help us maintain a welcoming, prayerful space by supporting ongoing repairs, utilities, and beautification of the church grounds.",
        },
        {
            image: require("../../assets/img/htbc-donate3.png"),
            title: "Youth & Faith Formation",
            description: "Invest in the future of the Church by funding youth programs, catechism classes, retreats, and spiritual education.",
        },
    ];
    return (
        <div>
            <div className="header-banner">
                <div className="header-text">
                    <h1>Explore Our Faith</h1>
                    <p className="header-subtext">
                        Step into the foundation of what we believe, our values, our hope, and the truth that shapes how <br /> we live and love. Whether you’re curious, searching, or ready to grow
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
                        Welcome to our parish—a community rooted in the love of Christ, united in the Sacraments, and committed to living the Gospel every day. We are more than a building—we are a
                        family of faith, journeying together through prayer, and service. Whether you've been here before or this is your first time, there's a place for you here. Our mission is
                        simple: to know Christ, grow in His love, and share that love with the world. Through the Eucharist, Scripture, and fellowship, we strive to reflect God's light in our homes,
                        neighborhoods, and beyond. Join us as we walk in faith, grow in grace, and build a vibrant Catholic community, one heart at a time.
                    </p>
                    <a href="#">Read More</a>
                </div>
                <div className="blog-section">
                    <div className="blog-image">
                        <img src={require("../../assets/img/htbc-blog.jpg")} alt="Church Interior" />
                    </div>
                    <div className="blog-content">
                        <h2>Latest Blog Post</h2>
                        <h3>Faith Reflections & Insights</h3>
                        <p>
                            Thoughtful reflections and spiritual wisdom to nourish your soul. In the midst of life's demands, it's easy to move from one moment to the next without pause. Faith
                            Reflections & Insights offers a gentle space to slow down, breathe deeply, and reconnect with the presence of God in your everyday life. Here you'll find reflections
                            grounded in the Sacred Scriptures, the teachings of the Catholic Church, and the seasons of the liturgical calendar—inviting you to walk more closely with Christ. Whether
                            you're seeking a deeper understanding of the Sacraments, seeking clarity in times of struggle, or simply wanting to grow in grace, these reflections are written to inspire,
                            challenge, and uplift...
                        </p>
                        <a href="#">Read More</a>
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
                                {/* <p>View all</p> */}
                                <FontAwesomeIcon icon={faAngleRight} className="news-arrow" />
                            </a>
                        </div>
                    </div>
                    <div className="shop-grid">
                        <div className="product-item">
                            <img src={require("../../assets/img/htbc-shop1.png")} alt="Rosary" />
                            <h3>Rosary</h3>
                            <div className="price-and-cart">
                                <div className="price">$25</div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                        <div className="product-item">
                            <img src={require("../../assets/img/htbc-shop2.png")} alt="Crucifix Necklace" />
                            <h3>Crucifix Necklace</h3>
                            <div className="price-and-cart">
                                <div className="price">$18</div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                        <div className="product-item">
                            <img src={require("../../assets/img/htbc-shop3.png")} alt="Devotional Candle" />
                            <h3>Devotional Candle</h3>
                            <div className="price-and-cart">
                                <div className="price">$8</div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                        <div className="product-item">
                            <img src={require("../../assets/img/htbc-shop4.png")} alt="Daily Missal" />
                            <h3>Daily Missal</h3>
                            <div className="price-and-cart">
                                <div className="price">$23</div>
                                <button className="add-to-cart">Add to Cart</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="resources-container">
                    <div className="view-items">VIEW ITEMS</div>
                    <h1 className="resources-title">Resources</h1>
                    <p className="resources-subtitle">Guides, prayers, and teachings to support your journey</p>
                    <div className="resource-grid">
                        {resources.map((resource, index) => (
                            <div key={index} className="resource-item">
                                <img src={resource.icon} alt={`${resource.title} icon`} />
                                <p className="resource-text">{resource.title}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="community-container">
                    <div className="community-text">
                        <h1>Our Community</h1>
                        <p>
                            At the heart of our parish is a vibrant, welcoming community united by faith, love, and service. From young families to seniors, lifelong Catholics to those just beginning
                            their journey—we grow together as one body in Christ.
                        </p>
                        <p>
                            Here, faith comes to life through friendship, fellowship, and shared purpose. Whether it’s through small groups, ministries, outreach programs, or Sunday coffee after Mass,
                            there’s always a place for you to belong, serve, and be supported. Come as you are. Let’s grow in grace—together.
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
                    <div className="donate-grid">
                        {donateItems.map((item, index) => (
                            <div key={index} className="donate-item">
                                <img src={item.image} alt={item.title} />
                                <div className="donate-overlay">
                                    <button className="donate-button">Donate</button>
                                </div>
                                <p>{item.title}</p>
                                <p className="description">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
