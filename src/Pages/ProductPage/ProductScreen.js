import React from "react";
import {useParams} from "react-router-dom";
import "../ProductPage/productScreen.css";

export default function ProductScreen() {
    const params = useParams();
    const {htbc} = params;

    const [quantity, setQuantity] = React.useState(0);

    const handleIncrement = () => setQuantity(quantity + 1);
    const handleDecrement = () => setQuantity(quantity > 0 ? quantity - 1 : 0);

    return (
        // <div>ProductScreen: {htbc}</div>;
        <div className="product-page-container">
            <div className="product-page">
                {/* Header/Navigation */}
                <header className="header">
                    <button className="nav-btn">Continue Shopping</button>
                    <div className="header-right">
                        <button className="icon-btn">🛒 My Cart</button>
                        <button className="icon-btn">📋 Order</button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="product-content">
                    {/* Product Images */}
                    <div className="product-images">
                        <div className="main-image yellow-border">
                            <img src="https://via.placeholder.com/300x400?text=Rosary+Main" alt="Main Rosary" />
                        </div>
                        {/* <div className="thumbnail-images">
                        <img src="https://via.placeholder.com/80x80?text=Thumb1" alt="Thumbnail 1" className="thumbnail" />
                        <img src="https://via.placeholder.com/80x80?text=Thumb2" alt="Thumbnail 2" className="thumbnail" />
                        <img src="https://via.placeholder.com/80x80?text=Thumb3" alt="Thumbnail 3" className="thumbnail" />
                        <img src="https://via.placeholder.com/80x80?text=Thumb4" alt="Thumbnail 4" className="thumbnail" />
                    </div> */}
                    </div>

                    {/* Product Details */}
                    <div className="product-details">
                        <h1 className="product-title">Rosary</h1>
                        <p className="product-price">$18</p>
                        <p className="product-description">for the simplicity and beauty of this handcrafted wooden rosary</p>
                        <p className="product-description">Each bead is smoothly polished for comfortable prayer and meditation.</p>
                        <p className="product-description">Made from durable natural wood for lasting devotion.</p>
                        <div className="rating">
                            <span className="stars">★★★★☆</span>
                            <span className="reviews">27 Reviews</span>
                        </div>

                        {/* Buy Now Button */}
                        <button className="buy-now-btn">Buy Now</button>

                        {/* Quantity */}
                        <div className="quantity-section">
                            <label className="quantity-label">Quantity</label>
                            <div className="quantity-controls">
                                <button className="qty-btn" onClick={handleDecrement}>
                                    -
                                </button>
                                <input type="number" className="qty-input" value={quantity} readOnly />
                                <button className="qty-btn" onClick={handleIncrement}>
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <button className="add-to-cart-btn">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
