import React from "react";
import {Link} from "react-router-dom";

function Product(props) {
    const {product} = props;
    return (
        <>
            <div className="product-item" key={product.htbc}>
                <img src={product.image} alt={product.htbc} />
                <Link to={`/product/${product.htbc}`} className="product-name" style={{textDecoration: "none", color: "black"}}>
                    <h3>{product.name}</h3>
                </Link>
                <div className="price-and-cart">
                    <div className="price">${product.price}</div>
                    <button className="add-to-cart">Add to Cart</button>
                </div>
            </div>
        </>
    );
}

export default Product;
