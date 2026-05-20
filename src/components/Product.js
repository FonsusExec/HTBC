import React from "react";
import {Link} from "react-router-dom";
import {useCart} from "../CartContext";
import {getProductImage, getProductName, getProductPrice, getProductRouteId, toCartItem} from "../utils/productHelpers";

function Product({product}) {
    const {addToCart} = useCart();
    const name = getProductName(product);
    const image = getProductImage(product);
    const price = getProductPrice(product);
    const routeId = getProductRouteId(product);
    const stock = Number(product?.stock ?? product?.countInStock);
    const isOutOfStock = Number.isFinite(stock) && stock <= 0;

    const addToCartHandler = () => {
        if (isOutOfStock) return;
        addToCart(toCartItem(product));
    };

    return (
        <div className="product-item">
            <img src={image} alt={name} />

            <Link to={`/product/${routeId}`} className="product-name" style={{textDecoration: "none", color: "black"}}>
                <h3>{name}</h3>
            </Link>

            <div className="price-and-cart">
                <div className="price">${price}</div>
                <button className="add-to-cart" onClick={addToCartHandler} disabled={isOutOfStock}>
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </div>
    );
}

export default Product;
