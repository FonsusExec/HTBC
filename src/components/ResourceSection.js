import React from "react";

export default function ResourcesSection({resources}) {
    return (
        <div className="resources-container">
            <div className="view-items">VIEW ITEMS</div>
            <h1 className="resources-title">Resources</h1>
            <p className="resources-subtitle">Guides, prayers, and teachings to support your journey</p>
            <div className="resource-grid">
                {resources.map((resource, index) => (
                    <div key={index} className="resource-item">
                        <img
                            src={resource.icon}
                            alt={`${resource.title} icon`}
                            loading="lazy"
                            width="100"
                            height="100" // Adjust as needed
                        />
                        <p className="resource-text">{resource.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
