import {useCallback, useEffect, useState} from "react";
import axios from "axios";
import {toast} from "react-toastify";
import {FaEdit, FaInfoCircle, FaSave, FaTimes, FaTrash, FaUsers} from "react-icons/fa";
import Loading from "../../components/Loading";
import {getAuthHeaders} from "../../utils/authHeaders";
import "./aboutContent.css";

const defaultPageForm = {
    heroTitle: "About Us",
    heroImageUrl: "",
    missionTitle: "Our Mission",
    missionText: "",
    teamTitle: "Our Team",
    testimonialTitle: "Testimonials",
};

const emptyTeamForm = {
    name: "",
    role: "",
    bio: "",
    order: "0",
    status: "active",
    image: null,
};

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return "";
    if (typeof imageUrl !== "string") return imageUrl;
    if (imageUrl.startsWith("http") || imageUrl.startsWith("blob:") || imageUrl.startsWith("/")) return imageUrl;
    return `/${imageUrl}`;
};

const createAuthConfig = () => ({headers: getAuthHeaders()});

export default function AboutContent() {
    const [pageForm, setPageForm] = useState(defaultPageForm);
    const [teamForm, setTeamForm] = useState(emptyTeamForm);
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingPage, setSavingPage] = useState(false);
    const [savingTeam, setSavingTeam] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState("");
    const [heroImage, setHeroImage] = useState(null);
    const [heroImagePreview, setHeroImagePreview] = useState("");
    const [imagePreview, setImagePreview] = useState("");
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState("");

    const fetchAboutContent = useCallback(async () => {
        try {
            setLoading(true);
            const {data} = await axios.get("/api/about/admin", createAuthConfig());
            setPageForm({...defaultPageForm, ...(data.page || {})});
            setHeroImage(null);
            setHeroImagePreview(getImageSrc(data.page?.heroImageUrl));
            setTeamMembers(data.teamMembers || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to load about page content");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAboutContent();
    }, [fetchAboutContent]);

    const activeTeamCount = teamMembers.filter((member) => member.status === "active").length;

    const handlePageChange = (e) => {
        const {name, value, files} = e.target;

        if (name === "heroImage") {
            const file = files?.[0] || null;
            setHeroImage(file);
            setHeroImagePreview(file ? URL.createObjectURL(file) : getImageSrc(pageForm.heroImageUrl));
            return;
        }

        setPageForm((currentForm) => ({...currentForm, [name]: value}));
    };

    const savePageContent = async (e) => {
        e.preventDefault();

        if (!pageForm.missionText.trim()) {
            toast.warning("Mission text is required");
            return;
        }

        const formData = new FormData();
        formData.append("heroTitle", "About Us");
        formData.append("missionTitle", "Our Mission");
        formData.append("missionText", pageForm.missionText);
        formData.append("teamTitle", "Our Team");
        formData.append("testimonialTitle", "Testimonials");
        if (heroImage) formData.append("heroImage", heroImage);

        try {
            setSavingPage(true);
            const {data} = await axios.put("/api/about/admin", formData, createAuthConfig());
            setPageForm({...defaultPageForm, ...(data.page || {})});
            setHeroImage(null);
            setHeroImagePreview(getImageSrc(data.page?.heroImageUrl));
            toast.success("About page content saved");
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to save about page content");
        } finally {
            setSavingPage(false);
        }
    };

    const handleTeamChange = (e) => {
        const {name, value, files} = e.target;

        if (name === "image") {
            const file = files?.[0] || null;
            setTeamForm((currentForm) => ({...currentForm, image: file}));
            setImagePreview(file ? URL.createObjectURL(file) : "");
            return;
        }

        setTeamForm((currentForm) => ({...currentForm, [name]: value}));
    };

    const resetTeamForm = () => {
        setTeamForm(emptyTeamForm);
        setEditingTeamId("");
        setImagePreview("");
    };

    const editTeamMember = (member) => {
        setEditingTeamId(member._id);
        setTeamForm({
            name: member.name || "",
            role: member.role || "",
            bio: member.bio || "",
            order: String(member.order || 0),
            status: member.status || "active",
            image: null,
        });
        setImagePreview(getImageSrc(member.imageUrl));
    };

    const saveTeamMember = async (e) => {
        e.preventDefault();

        if (!teamForm.name.trim()) {
            toast.warning("Team member name is required");
            return;
        }

        if (!editingTeamId && !teamForm.image) {
            toast.warning("Please select an image for the team member");
            return;
        }

        const formData = new FormData();
        formData.append("name", teamForm.name);
        formData.append("role", teamForm.role);
        formData.append("bio", teamForm.bio);
        formData.append("order", teamForm.order || 0);
        formData.append("status", teamForm.status);
        if (teamForm.image) formData.append("image", teamForm.image);

        try {
            setSavingTeam(true);
            if (editingTeamId) {
                await axios.put(`/api/about/team/${editingTeamId}`, formData, createAuthConfig());
                toast.success("Team member updated");
            } else {
                await axios.post("/api/about/team", formData, createAuthConfig());
                toast.success("Team member created");
            }

            resetTeamForm();
            fetchAboutContent();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to save team member");
        } finally {
            setSavingTeam(false);
        }
    };

    const deleteTeamMember = async () => {
        if (!teamToDelete?._id) return;

        try {
            setDeletingId(teamToDelete._id);
            await axios.delete(`/api/about/team/${teamToDelete._id}`, createAuthConfig());
            toast.success("Team member deleted");
            setTeamToDelete(null);
            fetchAboutContent();
        } catch (err) {
            toast.error(err.response?.data?.message || "Unable to delete team member");
        } finally {
            setDeletingId("");
        }
    };

    if (loading) {
        return (
            <div className="about-admin-page">
                <div className="about-admin-card about-admin-loading">
                    <Loading message="Loading about page content..." />
                </div>
            </div>
        );
    }

    return (
        <div className="about-admin-page">
            <div className="about-admin-card">
                <div className="about-admin-header">
                    <div>
                        <p className="about-admin-eyebrow">Community Management</p>
                        <h1>About Us Content</h1>
                        <p>Manage the public About page mission text, page labels, and team members.</p>
                    </div>
                    <span className="about-admin-icon">
                        <FaInfoCircle />
                    </span>
                </div>

                <div className="about-admin-stats">
                    <div className="about-admin-stat">
                        <span>
                            <FaUsers />
                        </span>
                        <strong>{teamMembers.length}</strong>
                        <small>Total team members</small>
                    </div>
                    <div className="about-admin-stat">
                        <span>
                            <FaUsers />
                        </span>
                        <strong>{activeTeamCount}</strong>
                        <small>Visible on site</small>
                    </div>
                </div>

                <section className="about-admin-section">
                    <div className="about-admin-section-header">
                        <div>
                            <h2>About Page Settings</h2>
                            <p>Control the public About page banner image and mission body text.</p>
                        </div>
                    </div>

                    <div className="about-admin-note">
                        This section does not create team member cards. The page headings stay fixed as About Us, Our Mission, Our Team, and Testimonials.
                    </div>

                    <form className="about-admin-form" onSubmit={savePageContent}>
                        <div className="about-admin-grid about-admin-grid--single">
                            <label>
                                Banner Background Image
                                <input type="file" name="heroImage" accept="image/*" onChange={handlePageChange} />
                            </label>
                        </div>
                        <label>
                            Mission Section Body
                            <textarea name="missionText" value={pageForm.missionText} onChange={handlePageChange} rows="5" />
                        </label>
                        {heroImagePreview && (
                            <div className="about-admin-hero-preview">
                                <img src={heroImagePreview} alt="About hero preview" />
                            </div>
                        )}
                        <button type="submit" className="about-admin-primary" disabled={savingPage}>
                            <FaSave />
                            {savingPage ? "Saving..." : "Save About Page Settings"}
                        </button>
                    </form>
                </section>

                <section className="about-admin-section">
                    <form className="about-admin-form about-admin-team-form" onSubmit={saveTeamMember}>
                        <div className="about-admin-section-header">
                            <div>
                                <h2>{editingTeamId ? "Edit Team Member Profile" : "Create Team Member Profile"}</h2>
                                <p>These profiles appear as cards under the Team section on the public About page.</p>
                            </div>
                            {editingTeamId && (
                                <button type="button" className="about-admin-secondary" onClick={resetTeamForm}>
                                    <FaTimes />
                                    Cancel
                                </button>
                            )}
                        </div>

                        <label>
                            Name
                            <input type="text" name="name" value={teamForm.name} onChange={handleTeamChange} placeholder="Full name" />
                        </label>
                        <div className="about-admin-grid">
                            <label>
                                Role
                                <input type="text" name="role" value={teamForm.role} onChange={handleTeamChange} placeholder="Pastor, volunteer..." />
                            </label>
                            <label>
                                Display Order
                                <input type="number" name="order" value={teamForm.order} onChange={handleTeamChange} />
                            </label>
                        </div>
                        <small className="about-admin-field-tip">Lower numbers show first on the public About page. Use 1, 2, 3 to control the order.</small>
                        <label>
                            Bio
                            <textarea name="bio" value={teamForm.bio} onChange={handleTeamChange} rows="4" placeholder="Short public bio" />
                        </label>
                        <div className="about-admin-grid">
                            <label>
                                Status
                                <select name="status" value={teamForm.status} onChange={handleTeamChange}>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </label>
                            <label>
                                Image
                                <input type="file" name="image" accept="image/*" onChange={handleTeamChange} />
                            </label>
                        </div>

                        {imagePreview && (
                            <div className="about-admin-preview">
                                <img src={imagePreview} alt="Team member preview" />
                            </div>
                        )}

                        <button type="submit" className="about-admin-primary" disabled={savingTeam}>
                            <FaSave />
                            {savingTeam ? "Saving..." : editingTeamId ? "Update Team Member Profile" : "Create Team Member Profile"}
                        </button>
                    </form>
                </section>

                <section className="about-admin-section about-admin-table-section">
                    <div className="about-admin-table-panel">
                        <div className="about-admin-section-header">
                            <div>
                                <h2>Team Member Profiles</h2>
                                <p>Use status to hide a person without deleting them.</p>
                            </div>
                        </div>

                        <div className="about-admin-table-wrapper">
                            <table className="about-admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Order</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamMembers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="about-admin-empty">
                                                No team members have been created yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        teamMembers.map((member) => (
                                            <tr key={member._id}>
                                                <td>
                                                    <img className="about-admin-thumb" src={getImageSrc(member.imageUrl)} alt={member.name} />
                                                </td>
                                                <td className="about-admin-name">{member.name}</td>
                                                <td>{member.role || "N/A"}</td>
                                                <td>
                                                    <span className={`about-admin-status about-admin-status--${member.status}`}>{member.status}</span>
                                                </td>
                                                <td>{member.order || 0}</td>
                                                <td>
                                                    <div className="about-admin-actions">
                                                        <button type="button" onClick={() => editTeamMember(member)}>
                                                            <FaEdit />
                                                            Edit
                                                        </button>
                                                        <button type="button" className="about-admin-danger" onClick={() => setTeamToDelete(member)}>
                                                            <FaTrash />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {teamToDelete && (
                <div className="about-admin-confirm-overlay">
                    <div className="about-admin-confirm">
                        <div className="about-admin-confirm-icon">!</div>
                        <h3>Confirm Deletion</h3>
                        <p>
                            Are you sure you want to delete <strong>{teamToDelete.name}</strong> from the team list?
                        </p>
                        <div className="about-admin-confirm-actions">
                            <button type="button" onClick={() => setTeamToDelete(null)} disabled={Boolean(deletingId)}>
                                Cancel
                            </button>
                            <button type="button" className="about-admin-confirm-delete" onClick={deleteTeamMember} disabled={Boolean(deletingId)}>
                                {deletingId ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
