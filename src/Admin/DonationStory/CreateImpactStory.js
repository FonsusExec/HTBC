import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";
import Loading from "../../components/Loading";
import "../CreateBlog/createBlog.css";
import "./impactStories.css";

export default function CreateImpactStory() {
    const {id} = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (!isEditing) return;

        const fetchStory = async () => {
            try {
                setFetching(true);
                const {data} = await axios.get(`/api/impact-stories/${id}`);
                setTitle(data.title || "");
                setDescription(data.description || "");
                setImagePreview(data.imageUrl || "");
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load impact story.");
                navigate("/admin/donation-story-list");
            } finally {
                setFetching(false);
            }
        };

        fetchStory();
    }, [id, isEditing, navigate]);

    useEffect(() => {
        if (!image) return;

        const previewUrl = URL.createObjectURL(image);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [image]);

    const handleImageChange = (e) => {
        const file = e.target.files?.[0] || null;
        setImage(file);
        if (file) setValidationErrors((errors) => ({...errors, image: ""}));
        if (!file && !isEditing) setImagePreview("");
    };

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        if (validationErrors.title) setValidationErrors((errors) => ({...errors, title: ""}));
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        if (validationErrors.description) setValidationErrors((errors) => ({...errors, description: ""}));
    };

    const validateForm = () => {
        const errors = {};

        if (!title.trim()) errors.title = "Title is required.";
        if (!isEditing && !image) errors.image = "Image is required.";
        if (!description.trim()) errors.description = "Description is required.";

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.warning("Please complete the required fields.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        if (image) formData.append("image", image);

        try {
            setLoading(true);

            if (isEditing) {
                await axios.put(`/api/impact-stories/${id}`, formData);
                toast.success("Impact story updated.");
            } else {
                await axios.post("/api/impact-stories", formData);
                toast.success("Impact story created.");
            }

            navigate("/admin/donation-story-list");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save impact story.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="admin-page">
                <div className="admin-card">
                    <Loading message="Loading impact story..." />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-card">
                <div className="card-header">
                    <button className="back-btn" onClick={() => navigate("/admin/donation-story-list")}>
                        Back
                    </button>
                    <h2>{isEditing ? "Edit Impact Story" : "Create Impact Story"}</h2>
                </div>

                <form className="post-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Title</label>
                            <input className={`inputTitle ${validationErrors.title ? "input-error" : ""}`} type="text" placeholder="Enter title" value={title} onChange={handleTitleChange} />
                            {validationErrors.title && <p className="field-error">{validationErrors.title}</p>}
                        </div>

                        <div className="form-group">
                            <label>Image</label>
                            <input className={validationErrors.image ? "input-error" : ""} type="file" accept="image/*" onChange={handleImageChange} />
                            {validationErrors.image && <p className="field-error">{validationErrors.image}</p>}
                            {imagePreview && (
                                <div className="admin-image-preview">
                                    <p>{image ? `Image Preview: ${image.name}` : "Current Image:"}</p>
                                    <img src={imagePreview} alt="Impact story preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full">
                        <label>Description</label>
                        <textarea className={validationErrors.description ? "input-error" : ""} placeholder="Write the impact story description..." value={description} onChange={handleDescriptionChange} rows={8} />
                        {validationErrors.description && <p className="field-error">{validationErrors.description}</p>}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn cancel" onClick={() => navigate("/admin/donation-story-list")}>
                            Cancel
                        </button>
                        <button type="submit" className="btn save" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
