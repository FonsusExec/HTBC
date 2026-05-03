import React from "react";
import {Link} from "react-router-dom";
import {FaComments, FaDonate, FaHeart, FaUsers} from "react-icons/fa";
import "./communityManagement.css";

export default function CommunityManagement() {
    return (
        <div className="cm-page">
            <div className="cm-card">
                <div className="cm-header">
                    <div>
                        <p className="cm-eyebrow">Community Management</p>
                        <h1>Community Tools</h1>
                        <p>Review the community-facing areas that need attention from the admin team.</p>
                    </div>
                    <span className="cm-icon">
                        <FaComments />
                    </span>
                </div>

                <div className="cm-grid">
                    <Link to="/admin/donation-story-list" className="cm-tool">
                        <span>
                            <FaHeart />
                        </span>
                        <strong>Impact Stories</strong>
                        <small>Manage stories displayed in the donation experience.</small>
                    </Link>
                    <Link to="/admin/donation-tracker" className="cm-tool">
                        <span>
                            <FaDonate />
                        </span>
                        <strong>Donations</strong>
                        <small>Review donation records and donor activity.</small>
                    </Link>
                    <Link to="/admin/view-users" className="cm-tool">
                        <span>
                            <FaUsers />
                        </span>
                        <strong>Users</strong>
                        <small>Manage registered users and role assignments.</small>
                    </Link>
                </div>

                <div className="cm-note">
                    Comment moderation is not connected to a backend collection yet. When that feature is added, this page and the dashboard notification queue can read from it directly.
                </div>
            </div>
        </div>
    );
}
