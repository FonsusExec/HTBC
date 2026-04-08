import React, {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import "./category.css";

const EditCategory = () => {
    const navigate = useNavigate();
    const {id} = useParams(); // category id from URL

    const [categoryName, setCategoryName] = useState("");
    const [subCategories, setSubCategories] = useState([]); // array of {name, slug}
    const [newSubName, setNewSubName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);

    // Fetch category data
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                setFetchLoading(true);

                const res = await fetch(`/api/categories/${id}`);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || `Server error: ${res.status}`);
                }

                const cat = await res.json();

                setCategoryName(cat.name || "");
                setSubCategories(cat.subCategories || []);
            } catch (err) {
                console.error("Fetch category error:", err);
                toast.error(err.message || "Failed to load category");
                // Optional: navigate back after error
                navigate("/admin/productlist");
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) fetchCategory();
    }, [id, navigate]);

    const generateSlug = (text) => {
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
    };

    // Add new subcategory (local only)
    const addSubCategory = () => {
        if (!newSubName.trim()) return toast.error("Subcategory name cannot be empty");

        const slug = generateSlug(newSubName);
        const exists = subCategories.some((sub) => sub.slug === slug);

        if (exists) return toast.error("This subcategory already exists");

        setSubCategories([...subCategories, {name: newSubName.trim(), slug}]);
        setNewSubName("");
    };

    // Remove subcategory (local only)
    const removeSubCategory = (slugToRemove) => {
        setSubCategories(subCategories.filter((sub) => sub.slug !== slugToRemove));
    };

    // Save changes
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) return toast.error("Category name is required");

        setLoading(true);

        try {
            const res = await fetch(`/api/categories/${id}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: categoryName.trim(),
                    subCategories: subCategories,
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success("Category updated successfully!");
            navigate("/admin/productlist"); // or back to categories list
        } catch (err) {
            toast.error(err.message || "Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading)
        return (
            <div className="admin-page">
                <p>Loading category...</p>
            </div>
        );

    return (
        <div className="category-container">
            <div className="category-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <h2>Edit Category</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Main Category Name *</label>
                    <input type="text" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                </div>

                {/* Subcategories Section */}
                <div className="form-group">
                    <label>Subcategories</label>

                    <div className="subcategory-list">
                        {subCategories.map((sub, index) => (
                            <div key={index} className="subcategory-item">
                                <span>{sub.name}</span>
                                <button type="button" className="remove-sub-btn" onClick={() => removeSubCategory(sub.slug)}>
                                    ✕
                                </button>
                            </div>
                        ))}
                        {subCategories.length === 0 && <p className="no-sub">No subcategories yet.</p>}
                    </div>

                    {/* Add new subcategory */}
                    <div className="add-sub-row">
                        <input type="text" placeholder="New subcategory name (e.g. Rosary)" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} />
                        <button type="button" onClick={addSubCategory} className="add-sub-btn">
                            + Add
                        </button>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn" disabled={loading}>
                        {loading ? "Updating..." : "Update Category"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditCategory;
