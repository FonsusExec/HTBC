import React from "react";
import "../assets/css/loading.css"; // Assuming a separate CSS file for loading styles

const Loading = ({message = "Loading..."}) => {
    return (
        <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default Loading;
