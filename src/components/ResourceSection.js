import React from "react";
import Loading from "./Loading";

const fallbackIcon = require("../assets/img/htbc-doc1.webp");

const normalizeResourceUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("/") || /^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
};

export default function ResourcesSection({resources = [], loading = false, error = ""}) {
    return (
        <div className="resources-container">
            <div className="view-items">VIEW ITEMS</div>
            <h1 className="resources-title">Resources</h1>
            <p className="resources-subtitle">Guides, prayers, and teachings to support your journey</p>
            {loading ? (
                <div className="landing-section-state">
                    <Loading message="Loading resources..." />
                </div>
            ) : error ? (
                <div className="landing-section-state landing-section-state--error">{error}</div>
            ) : resources.length === 0 ? (
                <div className="landing-section-state">No resources have been posted yet.</div>
            ) : (
                <div className="resource-grid">
                    {resources.map((resource, index) => {
                        const resourceUrl = normalizeResourceUrl(resource.link || resource.pdfUrl);
                        const isPdf = Boolean(!resource.link && resource.pdfUrl);
                        const Wrapper = resourceUrl ? "a" : "div";

                        return (
                            <Wrapper
                                key={resource._id || resource.title || index}
                                className="resource-item"
                                href={resourceUrl || undefined}
                                target={resourceUrl ? "_blank" : undefined}
                                rel={resourceUrl ? "noopener noreferrer" : undefined}
                                download={isPdf || undefined}
                            >
                                <img src={resource.icon || fallbackIcon} alt={`${resource.title} icon`} loading="lazy" width="100" height="100" />
                                <p className="resource-text">{resource.title}</p>
                                {(resource.link || resource.pdfUrl) && <span className="resource-type">{isPdf ? "PDF" : "Link"}</span>}
                            </Wrapper>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
