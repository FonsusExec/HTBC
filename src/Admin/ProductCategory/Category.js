import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import "./category.css";
import {getAuthHeaders} from "../../utils/authHeaders";

const CategoryForm = () => {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            return toast.error("Category name is required");
        }

        setLoading(true);

        try {
            const res = await fetch("/api/categories", {
                method: "POST",
                headers: getAuthHeaders({"Content-Type": "application/json"}),
                body: JSON.stringify({name: name.trim()}),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.message);

            toast.success("Main Category created successfully!");
            setName(""); // Clear input after success
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-container">
            <div className="category-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h2>Create Main Category</h2>

                {/* Add Subcategory Button - Positioned on the right */}
                <button className="add-subcategory-btn" onClick={() => navigate("/admin/add-subcategory")}>
                    Add Subcategory
                </button>
            </div>

            <form className="category-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Main Category Name *</label>
                    <input type="text" placeholder="e.g. Sacramentals, Books, Jewelry" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Saving..." : "Create Main Category"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;
