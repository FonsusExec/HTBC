import React from "react";
import "./aboutUs.css";

const teamMembers = [
    {id: 1, name: "Paul Austin", img: require("../../assets/img/blog-htbc1.png")},
    {id: 2, name: "Paul Austin", img: require("../../assets/img/htbc-new1.png")},
    {id: 3, name: "Paul Austin", img: require("../../assets/img/blog-htbc2.png")},
    {id: 4, name: "Paul Austin", img: require("../../assets/img/htbc-news2.png")},
    {id: 5, name: "Paul Austin", img: require("../../assets/img/htbc-donate1.png")},
    {id: 6, name: "Paul Austin", img: require("../../assets/img/htbc-donate2.png")},
];

export default function About() {
    return (
        <div className="about">
            {/* HERO SECTION */}
            <section className="about-hero">
                <div className="overlay">
                    <h1>About Us</h1>
                </div>
            </section>

            {/* MISSION SECTION */}
            <section className="mission">
                <h3>Our Mission</h3>
                <p>
                    Our mission is to bring the light of Christ into every heart, home, and community we serve. Rooted in the teachings of the Catholic faith, we are dedicated to evangelizing the
                    Gospel with love, humility, and courage.
                </p>
            </section>

            {/* TEAM SECTION */}
            <section className="team">
                <div className="team-header">
                    <div className="yellow-line"></div>
                    <div>
                        {/* <span>Team</span> */}
                        <h2>Our Team</h2>
                    </div>
                </div>

                <div className="team-grid">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="team-card">
                            <img src={member.img} alt={member.name} />
                            <p>{member.name}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials">
                <div className="testimonial-top">
                    <div className="line"></div>
                    <span>WHAT OUR MEMBERS SAY</span>
                    <div className="line"></div>
                </div>

                <h2 className="testimonial-title">Testimonials</h2>

                <div className="testimonial-content">
                    <button className="arrow left">‹</button>

                    <div className="testimonial-box">
                        <img src={require("../../assets/img/htbc-news4.png")} alt="testimonial" />
                        <p>The homilies truly speak deeply to my heart. Each week, I leave Mass feeling renewed and strengthened to face life's challenges.</p>
                        <h5>Peter Autibell</h5>
                    </div>

                    <button className="arrow right">›</button>
                </div>
            </section>
        </div>
    );
}
