import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import axios from "axios";
import Loading from "../../components/Loading";
import "./donate.css";

export default function Donate() {
    const [impactStories, setImpactStories] = useState([]);
    const [loadingStories, setLoadingStories] = useState(true);
    const [storiesError, setStoriesError] = useState("");

    useEffect(() => {
        const fetchImpactStories = async () => {
            try {
                setLoadingStories(true);
                setStoriesError("");
                const {data} = await axios.get("/api/impact-stories", {
                    params: {page: 1, limit: 6},
                });
                setImpactStories(Array.isArray(data) ? data : data.stories || []);
            } catch (err) {
                setStoriesError(err.response?.data?.message || "Impact stories are unavailable right now.");
            } finally {
                setLoadingStories(false);
            }
        };

        fetchImpactStories();
    }, []);

    return (
        <div className="donate">
            {/* HERO */}
            <section className="donate-hero">
                <div className="overlay">
                    <h1>Donate</h1>
                </div>
            </section>

            {/* IMPACT STORY GRID */}
            <section className="donate-section">
                <div className="donate-container">
                    {loadingStories ? (
                        <div className="donate-state donate-state--loading">
                            <Loading message="Loading impact stories..." />
                        </div>
                    ) : storiesError ? (
                        <div className="donate-state donate-state--error">{storiesError}</div>
                    ) : impactStories.length === 0 ? (
                        <div className="donate-state">No impact stories have been posted yet.</div>
                    ) : (
                        <div className="donate-grid">
                            {impactStories.map((story) => (
                                <Link key={story._id} to={`/donationform/${story._id}`} className="donate-card">
                                    <img src={story.imageUrl} alt={story.title} />
                                    <h3>{story.title}</h3>
                                    <p>{story.description}</p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
