import React, {useState, useEffect} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {toast} from "react-toastify";
import "./viewProduct.css"; // You can reuse or create viewProduct.css
import Loading from "../../components/Loading";

export default function ViewProduct() {
    const navigate = useNavigate();
    const {id} = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mainImage, setMainImage] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/products/${id}`);

                if (!res.ok) throw new Error("Product not found");

                const data = await res.json();
                setProduct(data);

                // Set initial main image
                setMainImage(data.mainImage || (data.images && data.images[0]) || "");
            } catch (err) {
                toast.error("Failed to load product details");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="admin-page">
                <p>
                    <Loading />
                </p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="admin-page">
                <p>Product not found.</p>
                <button onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-card view-card">
                <div className="card-header">
                    <button onClick={() => navigate(-1)}>← Back to List</button>
                    <h2>Product Details</h2>
                    {/* <div className="header-actions">
                        <button className="edit-btn" onClick={() => navigate(`/admin/edit-product/${id}`)}>
                            Edit Product
                        </button>
                    </div> */}
                </div>

                <div className="view-content">
                    {/* Main Image Display */}
                    <div className="main-image-container">
                        {mainImage ? <img src={mainImage} alt={product.title} className="main-product-image" /> : <div className="no-image-placeholder">No Image Available</div>}
                    </div>

                    {/* Thumbnail Gallery */}
                    <div className="image-gallery">
                        {product.mainImage && (
                            <div className={`gallery-thumb ${mainImage === product.mainImage ? "active" : ""}`} onClick={() => setMainImage(product.mainImage)}>
                                <img src={product.mainImage} alt="main" />
                            </div>
                        )}

                        {product.images &&
                            product.images.map((img, index) => (
                                <div key={index} className={`gallery-thumb ${mainImage === img ? "active" : ""}`} onClick={() => setMainImage(img)}>
                                    <img src={img} alt={`product ${index + 1}`} />
                                </div>
                            ))}
                    </div>

                    {/* Product Information */}
                    <div className="product-info">
                        <h1 className="product-title">{product.title}</h1>

                        <div className="info-grid">
                            <div className="info-item">
                                <strong>Category: </strong>
                                <span>{product.category?.name || product.category || "Uncategorized"}</span>
                            </div>
                            {product.subCategory && (
                                <div className="info-item">
                                    <strong>Sub-Category: </strong>
                                    <span>{product.subCategory}</span>
                                </div>
                            )}
                            <div className="info-item">
                                <strong>Price: </strong>
                                <span className="price">${parseFloat(product.price).toFixed(2)}</span>
                            </div>
                            <div className="info-item">
                                <strong>Stock: </strong>
                                <span className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>{product.stock} units</span>
                            </div>
                            <div className="info-item">
                                <strong>Date Created: </strong>
                                <span>
                                    {new Date(product.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="description-section">
                            <h3>Description</h3>
                            <p className="product-description">{product.description || "No description provided."}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="form-actions">
                    <button className="btn-secondary" onClick={() => navigate(-1)}>
                        Back to Products
                    </button>
                    <button className="btn-primary" onClick={() => navigate(`/admin/edit-product/${id}`)}>
                        Edit This Product
                    </button>
                </div>
            </div>
        </div>
    );
}
