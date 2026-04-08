import React, {useState, useRef, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import "./addProduct.css";
import Loading from "../../components/Loading";

export default function EditProduct() {
    const navigate = useNavigate();
    const {id} = useParams();
    const fileRef = useRef();

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        subCategory: "",
        price: "",
        stock: "",
        description: "",
    });

    const [images, setImages] = useState([]); // mixed: existing + new uploads
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryData, setSelectedCategoryData] = useState(null);
    const [fetchLoading, setFetchLoading] = useState(true);

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

    // Sync selected category data when product or categories load
    useEffect(() => {
        if (formData.category && categories.length > 0) {
            const foundCat = categories.find((c) => c._id === formData.category);
            setSelectedCategoryData(foundCat || null);
        }
    }, [formData.category, categories]);

    const handleCategoryChange = (e) => {
        const catId = e.target.value;
        setFormData((prev) => ({...prev, category: catId, subCategory: ""}));
        const selectedCat = categories.find((cat) => cat._id === catId);
        setSelectedCategoryData(selectedCat || null);
    };

    // Fetch product
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setFetchLoading(true);
                const res = await fetch(`/api/products/${id}`);
                if (!res.ok) throw new Error("Failed to load product");

                const product = await res.json();

                // Handle both old string category and new populated object
                const categoryId = product.category?._id || product.category || "";

                setFormData({
                    title: product.title || "",
                    category: categoryId,
                    subCategory: product.subCategory || "",
                    price: product.price?.toString() || "",
                    stock: product.stock?.toString() || "",
                    description: product.description || "",
                });

                // Load existing images (mainImage + images array)
                const existingImages = [];

                if (product.mainImage) {
                    existingImages.push({
                        preview: product.mainImage,
                        isMain: true,
                        isExisting: true,
                        url: product.mainImage,
                    });
                }

                if (product.images && product.images.length > 0) {
                    product.images.forEach((imgUrl) => {
                        existingImages.push({
                            preview: imgUrl,
                            isMain: false,
                            isExisting: true,
                            url: imgUrl,
                        });
                    });
                }

                setImages(existingImages);
            } catch (err) {
                toast.error("Failed to load product data");
                console.error(err);
            } finally {
                setFetchLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        if (name === "title" && value.length > 250) {
            toast.info("Title limited to 250 characters");
            return;
        }
        if (name === "price") {
            const cleaned = value.replace(/[^0-9.]/g, "");
            if ((cleaned.match(/\./g) || []).length <= 1) {
                setFormData((prev) => ({...prev, [name]: cleaned}));
            }
        } else {
            setFormData((prev) => ({...prev, [name]: value}));
        }
    };

    const handleFiles = (files) => {
        const newImages = Array.from(files).map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            isMain: false,
            isExisting: false,
        }));
        setImages((prev) => [...prev, ...newImages]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const removeImage = (index) => {
        const updated = [...images];
        const removed = updated.splice(index, 1)[0];

        if (removed.isMain && updated.length > 0) {
            updated[0].isMain = true;
        }
        setImages(updated);
    };

    const setMainImage = (index) => {
        const updated = images.map((img, i) => ({
            ...img,
            isMain: i === index,
        }));
        setImages(updated);
    };

    const moveImage = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= images.length) return;
        const updated = [...images];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setImages(updated);
    };

    // Updated Submit - FIXED validation
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title) return toast.error("Title is required");
        if (!formData.category) return toast.error("Category is required");
        if (images.length === 0) return toast.error("At least one image is required");

        setLoading(true);

        try {
            const data = new FormData();

            Object.keys(formData).forEach((key) => data.append(key, formData[key]));

            let mainIndex = -1;

            images.forEach((img, index) => {
                if (img.isExisting) {
                    data.append("existingImages", img.url);
                } else {
                    data.append("images", img.file);
                }
                if (img.isMain) mainIndex = index;
            });

            if (mainIndex !== -1) data.append("mainIndex", mainIndex);

            const res = await fetch(`/api/products/${id}`, {
                method: "PUT",
                body: data,
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message || "Update failed");

            toast.success("Product updated successfully!");
            navigate("/admin/productlist");
        } catch (err) {
            toast.error(err.message || "Failed to update product");
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading)
        return (
            <div className="admin-page">
                <p>
                    <Loading />
                </p>
            </div>
        );

    return (
        <div className="admin-page">
            <div className="admin-card">
                <div className="card-header">
                    <button onClick={() => navigate(-1)}>← Back</button>
                    <h2>Edit Product</h2>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <input name="title" placeholder="Title (max 250 characters)" value={formData.title} onChange={handleChange} maxLength={250} />

                        <div className="form-group">
                            <div className="price-input-wrapper">
                                <span className="dollar-sign">$</span>
                                <input type="text" name="price" placeholder="0.00" value={formatPrice(formData.price)} onChange={handleChange} />
                            </div>
                        </div>

                        <input name="stock" type="number" placeholder="Stock" value={formData.stock} onChange={handleChange} />

                        <select name="category" value={formData.category} onChange={handleCategoryChange} required>
                            <option value="">Select Main Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>

                        {/* Subcategory */}
                        <select name="subCategory" value={formData.subCategory} onChange={handleChange}>
                            <option value="">Select Subcategory</option>
                            {selectedCategoryData?.subCategories?.map((sub) => (
                                <option key={sub.slug} value={sub.slug}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>

                        {/* Drag & Drop Area */}
                        <div className="upload-area full" onClick={() => fileRef.current.click()} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
                            <p>
                                Drag & Drop or Click to Upload <strong>New Images</strong>
                            </p>
                            <input type="file" multiple hidden ref={fileRef} onChange={(e) => handleFiles(e.target.files)} />
                        </div>

                        {/* IMAGE PREVIEW SECTION - NOW UNDERNEATH */}
                        <div className="image-grid full">
                            <p className="image-section-title">Current Images (drag to reorder • click ⭐ to set main)</p>
                            {images.length === 0 ? (
                                <p>No images yet. Upload some above.</p>
                            ) : (
                                images.map((img, index) => (
                                    <div key={index} className={`image-card ${img.isMain ? "main" : ""}`}>
                                        <img src={img.preview} alt="product" />
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
                                ))
                            )}
                        </div>

                        <textarea className="full" name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? "Updating..." : "Update Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
