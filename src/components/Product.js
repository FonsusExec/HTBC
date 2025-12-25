import React from "react";
import {Link} from "react-router-dom";
import {useCart} from "../CartContext";

function Product({product}) {
    const {addToCart} = useCart();

    const addToCartHandler = () => {
        addToCart({
            _id: product.htbc, // 🔑 map htbc → _id
            name: product.name,
            image: product.image,
            price: product.price, // string or number OK (context parses)
            qty: 1, // 🔑 REQUIRED
        });
    };

    return (
        <div className="product-item">
            <img src={product.image} alt={product.name} />

            <Link to={`/product/${product.htbc}`} className="product-name" style={{textDecoration: "none", color: "black"}}>
                <h3>{product.name}</h3>
            </Link>

            <div className="price-and-cart">
                <div className="price">${product.price}</div>
                <button className="add-to-cart" onClick={addToCartHandler}>
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

export default Product;
