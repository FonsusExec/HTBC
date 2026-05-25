import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {FaArrowRight, FaHandHoldingHeart, FaHeart} from "react-icons/fa";
import axios from "axios";
import Loading from "../../components/Loading";
import "./donate.css";

const fallbackDonateImage = require("../../assets/img/htbc-donate1.png");

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return fallbackDonateImage;
    if (typeof imageUrl !== "string") return imageUrl;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const getStorySummary = (description = "") => {
    const cleanDescription = String(description).replace(/\s+/g, " ").trim();
    if (!cleanDescription) return "Your gift helps support lives, faith, and service through this mission.";
    return cleanDescription;
};

export default function Donate() {
    const [impactStories, setImpactStories] = useState([]);
    const [totalStories, setTotalStories] = useState(0);
    const [loadingStories, setLoadingStories] = useState(true);
    const [storiesError, setStoriesError] = useState("");

    useEffect(() => {
        let isActive = true;

        const fetchImpactStories = async () => {
            try {
                setLoadingStories(true);
                setStoriesError("");
                const {data} = await axios.get("/api/impact-stories", {
                    params: {page: 1, limit: 6},
                });

                if (!isActive) return;

                const stories = Array.isArray(data) ? data : data.stories || [];
                setImpactStories(stories);
                setTotalStories(Array.isArray(data) ? stories.length : data.total || stories.length);
            } catch (err) {
                if (!isActive) return;
                setImpactStories([]);
                setTotalStories(0);
                setStoriesError(err.response?.data?.message || "Impact stories are unavailable right now.");
            } finally {
                if (isActive) setLoadingStories(false);
            }
        };

        fetchImpactStories();

        return () => {
            isActive = false;
        };
    }, []);

    return (
        <div className="donate-page">
            <section className="donate-banner">
                <div className="donate-banner-content">
                    <span>Support The Mission</span>
                    <h1>Donate</h1>
                    <p>Give toward stories of faith, care, and service that continue beyond the first gift.</p>
                </div>
            </section>

            <main className="donate-main">
                <section className="donate-intro">
                    <div>
                        <p className="donate-eyebrow">Impact Stories</p>
                        <h2>Choose a mission to support</h2>
                        <p>
                            Each story below connects your donation to a real need. Select a story to continue to the donation form and support that work directly.
                        </p>
                    </div>

                    <div className="donate-summary-card">
                        <span className="donate-summary-icon">
                            <FaHandHoldingHeart aria-hidden="true" />
                        </span>
                        <strong>{totalStories}</strong>
                        <small>{totalStories === 1 ? "active impact story" : "active impact stories"}</small>
                    </div>
                </section>

                {loadingStories ? (
                    <section className="donate-state donate-state--loading">
                        <Loading message="Loading impact stories..." />
                    </section>
                ) : storiesError ? (
                    <section className="donate-state donate-state--error">
                        <p>{storiesError}</p>
                    </section>
                ) : impactStories.length === 0 ? (
                    <section className="donate-state">
                        <FaHeart aria-hidden="true" />
                        <h3>No impact stories yet</h3>
                        <p>Impact stories will appear here once the admin publishes them.</p>
                    </section>
                ) : (
                    <section className="donate-grid" aria-label="Impact stories">
                        {impactStories.map((story) => (
                            <Link key={story._id} to={`/donationform/${story._id}`} className="donate-card">
                                <div className="donate-card-image">
                                    <img src={getImageSrc(story.imageUrl)} alt={story.title} />
                                    <span>Donate</span>
                                </div>
                                <div className="donate-card-body">
                                    <h3>{story.title}</h3>
                                    <p>{getStorySummary(story.description)}</p>
                                    <span className="donate-card-action">
                                        Support this story
                                        <FaArrowRight aria-hidden="true" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </section>
                )}
            </main>
        </div>
    );
}
