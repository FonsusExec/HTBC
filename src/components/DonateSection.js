import React from "react";

export default function DonateSection({donateItems}) {
    return (
        <div className="donate-container">
            <div className="donate-header">
                <div className="support-mission">SUPPORT OUR MISSION</div>
                <h1>Donate</h1>
                <p>Your gift fuels faith, service, and growth. Thank you.</p>
            </div>
            <div className="donate-grid">
                {donateItems.map((item, index) => (
                    <div key={index} className="donate-item">
                        <img src={item.image} alt={item.title} loading="lazy" width="300" height="200" />
                        <div className="donate-overlay">
                            <button className="donate-button">Donate</button>
                        </div>
                        <p>{item.title}</p>
                        <p className="description">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
