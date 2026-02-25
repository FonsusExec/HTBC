import React from "react";
import {useRef} from "react";
import "./newsArticle.css";

export default function News() {
    const slider = useRef();

    const slide = (dir) => {
        slider.current.scrollBy({
            left: dir * 300,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* BANNER */}
            <div className="news-banner">
                <h1>News</h1>
            </div>

            {/* MAIN CONTENT */}
            <div className="news-container">
                {/* HERO */}

                <section className="news-hero">
                    <img src={require("../../assets/img/htbc-new1.png")} className="hero-img" />

                    <div className="hero-text">
                        <span className="tag">Church in the world</span>

                        <h2>
                            Faith Reflections
                            <br /> & Insights
                        </h2>

                        <p>Thoughtful reflections and spiritual wisdom to nourish your soul. Explore stories of faith, hope, and service.</p>
                    </div>

                    <div className="hero-filter">
                        <h4>Filter</h4>

                        <select>
                            <option>Source</option>
                        </select>

                        <select>
                            <option>Topic</option>
                        </select>

                        <select>
                            <option>Date</option>
                        </select>
                    </div>
                </section>

                {/* CARDS */}

                <section className="news-cards-wrapper">
                    <button className="arrow left" onClick={() => slide(-1)}>
                        ‹
                    </button>

                    <div className="news-cards" ref={slider}>
                        {[1, 2, 3, 4, 5, 6].map((x) => (
                            <div className="news-card" key={x}>
                                <img src={`/card${x}.jpg`} />
                                <h4>Faith in Action</h4>
                                <p>Stories of compassion and hope.</p>
                            </div>
                        ))}
                    </div>

                    <button className="arrow right" onClick={() => slide(1)}>
                        ›
                    </button>
                </section>

                {/* SUBMIT */}

                <section className="submit-section">
                    <div className="submit-title">
                        <h2>
                            Submit a<br />
                            Story
                        </h2>
                    </div>

                    <div className="submit-form">
                        <input placeholder="Title" />
                        <input placeholder="URL" />
                        <textarea placeholder="Description" />

                        <button>Submit</button>
                    </div>
                </section>
            </div>
        </>
    );
}
