import React from "react";
import "./donate.css";

const donateItems = [
    {
        id: 1,
        title: "Outreach & Charity Programs",
        desc: "Support our mission to feed the hungry, care for the sick, and assist vulnerable families in our local community.",
        img: require("../../assets/img/htbc-donate1.png"),
    },
    {
        id: 2,
        title: "Parish Maintenance & Upkeep",
        desc: "Help us maintain a welcoming, prayerful space by supporting ongoing repairs, utilities, and beautification of the church grounds.",
        img: require("../../assets/img/htbc-donate2.png"),
    },
    {
        id: 3,
        title: "Youth & Faith Formation",
        desc: "Invest in the future of the Church by funding youth programs, catechism classes, retreats, and spiritual education.",
        img: require("../../assets/img/htbc-donate3.png"),
    },
    {
        id: 4,
        title: "Outreach & Charity Programs",
        desc: "Support our mission to feed the hungry, care for the sick, and assist vulnerable families in our local community.",
        img: require("../../assets/img/htbc-news2.png"),
    },
    {
        id: 5,
        title: "Parish Maintenance & Upkeep",
        desc: "Help us maintain a welcoming, prayerful space by supporting ongoing repairs, utilities, and beautification of the church grounds.",
        img: require("../../assets/img/htbc-news3.png"),
    },
    {
        id: 6,
        title: "Youth & Faith Formation",
        desc: "Invest in the future of the Church by funding youth programs, catechism classes, retreats, and spiritual education.",
        img: require("../../assets/img/blog-htbc4.png"),
    },
];

export default function Donate() {
    return (
        <div className="donate">
            {/* HERO */}
            <section className="donate-hero">
                <div className="overlay">
                    <h1>Donate</h1>
                </div>
            </section>

            {/* DONATION GRID */}
            <section className="donate-section">
                <div className="donate-container">
                    <div className="donate-grid">
                        {donateItems.map((item) => (
                            <div key={item.id} className="donate-card">
                                <img src={item.img} alt={item.title} />
                                <h3>{item.title}</h3>
                                <p>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
