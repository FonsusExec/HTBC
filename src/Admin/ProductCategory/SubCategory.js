import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import "./category.css";

const SubCategoryForm = () => {
    const navigate = useNavigate();

    const [mainCategories, setMainCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [subCategoryName, setSubCategoryName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Fetch all main categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setMainCategories(data);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load main categories");
            } finally {
                setFetching(false);
            }
        };

        fetchCategories();
    }, []);

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    };

    const resetForm = () => {
        setSubCategoryName("");
        setSelectedCategoryId("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedCategoryId) {
            return toast.error("Please select a main category");
        }
        if (!subCategoryName.trim()) {
            return toast.error("Subcategory name is required");
        }

        setLoading(true);

        const payload = {
            name: subCategoryName.trim(),
        };

        try {
            const res = await fetch(`/api/categories/${selectedCategoryId}/subcategories`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.message || "Failed to add subcategory");

            toast.success(`Subcategory "${subCategoryName}" added successfully!`);

            // Clear only the subcategory name (keep category selected for convenience)
            setSubCategoryName("");
        } catch (err) {
            toast.error(err.message || "Something went wrong");
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
                <h2>Add Subcategory</h2>
            </div>

            <form className="category-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Main Category *</label>
                    <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={fetching} required>
                        <option value="">Select Main Category</option>
                        {mainCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Subcategory Name *</label>
                    <input type="text" placeholder="e.g. Rosary, Crucifix, Bible Study, Jewelry" value={subCategoryName} onChange={(e) => setSubCategoryName(e.target.value)} required />
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Adding..." : "Add Subcategory"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubCategoryForm;
