import React from "react";
import Loading from "./Loading";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft, faAngleRight} from "@fortawesome/free-solid-svg-icons";

const fallbackIcon = require("../assets/img/htbc-doc1.webp");

const normalizeResourceUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("/") || /^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
};

export default function ResourcesSection({resources = [], loading = false, error = ""}) {
    const latestResources = React.useMemo(() => resources.slice(0, 4), [resources]);
    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useEffect(() => {
        setActiveIndex(0);
    }, [latestResources.length]);

    const goToPreviousResource = () => {
        setActiveIndex((current) => (current === 0 ? latestResources.length - 1 : current - 1));
    };

    const goToNextResource = () => {
        setActiveIndex((current) => (current + 1) % latestResources.length);
    };

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
            ) : latestResources.length === 0 ? (
                <div className="landing-section-state">No resources have been posted yet.</div>
            ) : (
                <div className="resource-carousel">
                    {latestResources.length > 1 && (
                        <button type="button" className="resource-carousel-btn resource-carousel-btn--prev" onClick={goToPreviousResource} aria-label="Previous resource">
                            <FontAwesomeIcon icon={faAngleLeft} />
                        </button>
                    )}
                    <div className="resource-carousel__viewport">
                        <div className="resource-grid resource-grid--carousel" style={{"--resource-index": activeIndex}}>
                            {latestResources.map((resource, index) => {
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
                    </div>
                    {latestResources.length > 1 && (
                        <button type="button" className="resource-carousel-btn resource-carousel-btn--next" onClick={goToNextResource} aria-label="Next resource">
                            <FontAwesomeIcon icon={faAngleRight} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
