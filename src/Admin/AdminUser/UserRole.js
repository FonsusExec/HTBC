import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";
import "../ProductCategory/category.css"; // Reuse category styles for simplicity

export default function UserRole() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return toast.error("Role name is required");
        }

        setLoading(true);

        try {
            const payload = {
                name: name.trim(),
            };

            const res = await axios.post("/api/roles", payload);

            toast.success("Role created successfully!");
            setName(""); // Clear the input
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to create role";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-container">
            <div className="category-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ‹ Back
                </button>
                <h2>Create Role</h2>

                {/* <button className="add-subcategory-btn" onClick={() => navigate("/admin/create-user")}>
                    Create User
                </button> */}
            </div>

            <form className="category-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Role Name *</label>
                    <input type="text" placeholder="e.g. Admin, Manager, Editor, Support" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Creating..." : "Create Role"}
                    </button>
                </div>
            </form>
        </div>
    );
}
