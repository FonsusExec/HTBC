import React, {useEffect, useMemo, useState} from "react";
import axios from "axios";
import {isDemoMode} from "../../demo/demoMode";
import {demoAbout} from "../../demo/demoData";
import "./aboutUs.css";

const fallbackTeamMembers = [
    {id: 1, name: "Paul Austin", imageUrl: require("../../assets/img/blog-htbc1.png")},
    {id: 2, name: "Paul Austin", imageUrl: require("../../assets/img/htbc-new1.png")},
    {id: 3, name: "Paul Austin", imageUrl: require("../../assets/img/blog-htbc2.png")},
    {id: 4, name: "Paul Austin", imageUrl: require("../../assets/img/htbc-news2.png")},
    {id: 5, name: "Paul Austin", imageUrl: require("../../assets/img/htbc-donate1.png")},
    {id: 6, name: "Paul Austin", imageUrl: require("../../assets/img/htbc-donate2.png")},
];

const fallbackAboutPage = {
    heroTitle: "About Us",
    heroImageUrl: "",
    missionText:
        "Our mission is to bring the light of Christ into every heart, home, and community we serve. Rooted in the teachings of the Catholic faith, we are dedicated to evangelizing the Gospel with love, humility, and courage.",
};

const fallbackTestimonials = [
    {
        id: 1,
        name: "Peter Autibell",
        quote: "The homilies truly speak deeply to my heart. Each week, I leave Mass feeling renewed and strengthened to face life's challenges.",
        imageUrl: require("../../assets/img/htbc-news4.png"),
    },
];

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return require("../../assets/img/htbc-news4.png");
    if (typeof imageUrl !== "string") return imageUrl;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

export default function About() {
    const [aboutPage, setAboutPage] = useState(fallbackAboutPage);
    const [teamMembers, setTeamMembers] = useState(fallbackTeamMembers);
    const [testimonials, setTestimonials] = useState(fallbackTestimonials);
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    useEffect(() => {
        let isActive = true;

        const fetchAboutContent = async () => {
            try {
                if (isDemoMode) {
                    setAboutPage(demoAbout.page);
                    setTeamMembers(demoAbout.teamMembers);
                    setTestimonials(demoAbout.testimonials);
                    setActiveTestimonial(0);
                    return;
                }

                const {data} = await axios.get("/api/about");

                if (!isActive) return;
                setAboutPage(data.page || fallbackAboutPage);
                setTeamMembers(data.teamMembers?.length ? data.teamMembers : fallbackTeamMembers);
                setTestimonials(data.testimonials?.length ? data.testimonials : fallbackTestimonials);
                setActiveTestimonial(0);
            } catch (err) {
                if (!isActive) return;
                setAboutPage(fallbackAboutPage);
                setTeamMembers(fallbackTeamMembers);
                setTestimonials(fallbackTestimonials);
            }
        };

        fetchAboutContent();

        return () => {
            isActive = false;
        };
    }, []);

    const selectedTestimonial = useMemo(() => testimonials[activeTestimonial] || testimonials[0] || fallbackTestimonials[0], [testimonials, activeTestimonial]);

    const moveTestimonial = (direction) => {
        if (testimonials.length <= 1) return;
        setActiveTestimonial((index) => (index + direction + testimonials.length) % testimonials.length);
    };

    const heroStyle = aboutPage.heroImageUrl
        ? {
              backgroundImage: `url("${getImageSrc(aboutPage.heroImageUrl)}")`,
          }
        : undefined;

    return (
        <div className="about">
            <section className="about-hero" style={heroStyle}>
                <div className="overlay">
                    <h1>About Us</h1>
                </div>
            </section>

            <section className="mission">
                <h3>Our Mission</h3>
                <p>{aboutPage.missionText || fallbackAboutPage.missionText}</p>
            </section>

            <section className="team">
                <div className="team-header">
                    <div className="yellow-line"></div>
                    <div>
                        <h2>Our Team</h2>
                    </div>
                </div>

                <div className="team-grid">
                    {teamMembers.map((member) => (
                        <div key={member._id || member.id} className="team-card">
                            <img src={getImageSrc(member.imageUrl || member.img)} alt={member.name} />
                            <h3>{member.name}</h3>
                            {member.role && <span>{member.role}</span>}
                            {member.bio && <p>{member.bio}</p>}
                        </div>
                    ))}
                </div>
            </section>

            <section className="testimonials">
                <div className="testimonial-top">
                    <div className="line"></div>
                    <span>WHAT OUR MEMBERS SAY</span>
                    <div className="line"></div>
                </div>

                <h2 className="testimonial-title">Testimonials</h2>

                <div className="testimonial-content">
                    <button type="button" className="arrow left" onClick={() => moveTestimonial(-1)} disabled={testimonials.length <= 1}>
                        &#8249;
                    </button>

                    <div className="testimonial-box">
                        <img src={getImageSrc(selectedTestimonial.imageUrl)} alt={selectedTestimonial.name} />
                        <p>{selectedTestimonial.quote}</p>
                        <h5>{selectedTestimonial.name}</h5>
                        {selectedTestimonial.role && <span>{selectedTestimonial.role}</span>}
                    </div>

                    <button type="button" className="arrow right" onClick={() => moveTestimonial(1)} disabled={testimonials.length <= 1}>
                        &#8250;
                    </button>
                </div>
            </section>
        </div>
    );
}
