import React, {useState, useRef, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import "./addProduct.css";

export default function AddProduct() {
    const navigate = useNavigate();
    const fileRef = useRef();

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        subCategory: "",
        price: "",
        stock: "",
        description: "",
    });

    const [images, setImages] = useState([]); // [{file, preview, isMain}]
    const [categories, setCategories] = useState([]);
    const [selectedCategoryData, setSelectedCategoryData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch all categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch("/api/categories");
                const data = await res.json();
                setCategories(data);
            } catch (err) {
                toast.error("Failed to load categories");
            }
        };
        fetchCategories();
    }, []);

    // Handle category change - load its subcategories
    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        setFormData((prev) => ({...prev, category: catId, subCategory: ""}));

        const selectedCat = categories.find((cat) => cat._id === catId);
        setSelectedCategoryData(selectedCat || null);
    };

    // Format price with $ and commas
    const formatPrice = (value) => {
        if (!value) return "";
        const num = parseFloat(value.replace(/[^0-9.]/g, ""));
        return isNaN(num)
            ? ""
            : num.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });
    };

    // HANDLE INPUT
    const handleChange = (e) => {
        const {name, value} = e.target;

        if (name === "price") {
            // Allow only numbers and one decimal point
            const cleaned = value.replace(/[^0-9.]/g, "");
            if ((cleaned.match(/\./g) || []).length <= 1) {
                setFormData((prev) => ({...prev, [name]: cleaned}));
            }
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }
    };

    // HANDLE FILES
    const handleFiles = (files) => {
        const newImages = Array.from(files).map((file, index) => ({
            file,
            preview: URL.createObjectURL(file),
            isMain: images.length === 0 && index === 0, // first image = main
        }));

        setImages((prev) => [...prev, ...newImages]);
    };

    // DRAG DROP
    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    // REMOVE IMAGE
    const removeImage = (index) => {
        const updated = [...images];
        updated.splice(index, 1);

        // Ensure one main image exists
        if (updated.length && !updated.some((img) => img.isMain)) {
            updated[0].isMain = true;
        }

        setImages(updated);
    };

    // SET MAIN IMAGE
    const setMainImage = (index) => {
        const updated = images.map((img, i) => ({
            ...img,
            isMain: i === index,
        }));
        setImages(updated);
    };

    // REORDER
    const moveImage = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= images.length) return;

        const updated = [...images];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

        setImages(updated);
    };

    // SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) return toast.error("Title required");
        if (!formData.category) return toast.error("Category required");
        if (!images.length) return toast.error("Upload at least one image");

        setLoading(true);

        try {
            const data = new FormData();

            Object.keys(formData).forEach((key) => {
                data.append(key, formData[key]);
            });

            images.forEach((img, index) => {
                data.append("images", img.file);
                if (img.isMain) data.append("mainIndex", index);
            });

            const res = await fetch("/api/products", {
                method: "POST",
                body: data,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            toast.success("Product added!");
            navigate("/admin/productlist");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-card">
                <div className="card-header">
                    <button onClick={() => navigate(-1)}>← Back</button>
                    <h2>Add Product</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <input name="title" placeholder="Title" onChange={handleChange} />

                        <div className="form-group">
                            <div className="price-input-wrapper">
                                <span className="dollar-sign">$</span>
                                <input
                                    type="text"
                                    name="price"
                                    placeholder="0.00"
                                    value={formatPrice(formData.price)}
                                    onChange={handleChange}
                                    onBlur={(e) => setFormData((prev) => ({...prev, price: e.target.value.replace(/[^0-9.]/g, "")}))}
                                    required
                                />
                            </div>
                        </div>
                        <input name="stock" type="number" placeholder="Stock" onChange={handleChange} />

                        <select name="category" value={formData.category} onChange={handleCategoryChange} required>
                            <option value="">Select Main Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        <select name="subCategory" value={formData.subCategory} onChange={handleChange} disabled={!selectedCategoryData}>
                            <option value="">Select Subcategory</option>
                            {selectedCategoryData?.subCategories?.map((sub) => (
                                <option key={sub.slug} value={sub.slug}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>

                        {/* UPLOADER */}
                        <div className="upload-area full" onClick={() => fileRef.current.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <p>Drag & Drop or Click to Upload</p>
                            <input type="file" multiple hidden ref={fileRef} onChange={(e) => handleFiles(e.target.files)} />
                        </div>

                        {/* PREVIEW GRID */}
                        <div className="image-grid full">
                            {images.map((img, index) => (
                                <div key={index} className={`image-card ${img.isMain ? "main" : ""}`}>
                                    <img src={img.preview} alt="" />

                                    {img.isMain && <span className="badge">Main</span>}

                                    <div className="image-actions">
                                        <button type="button" onClick={() => setMainImage(index)}>
                                            ⭐
                                        </button>
                                        <button type="button" onClick={() => moveImage(index, -1)}>
                                            ←
                                        </button>
                                        <button type="button" onClick={() => moveImage(index, 1)}>
                                            →
                                        </button>
                                        <button type="button" onClick={() => removeImage(index)}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <textarea className="full" name="description" placeholder="Description" onChange={handleChange} />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit">{loading ? "Saving..." : "Save"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
