import React from "react";
import Product from "../../components/Product";
import Loading from "../../components/Loading";
import {useCart} from "../../CartContext";
import axios from "axios";
import "./allProductPage.css";
import {Link} from "react-router-dom";
import {getProductId, getProductsFromResponse} from "../../utils/productHelpers";

const reducer = (state, action) => {
    switch (action.type) {
        case "FETCH_REQUEST":
            return {...state, loading: true};
        case "FETCH_SUCCESS":
            return {...state, loading: false, products: action.payload};
        case "FETCH_FAIL":
            return {...state, loading: false, error: action.payload};
        default:
            return state;
    }
};

export default function AllProductPage() {
    const {getCartCount} = useCart();
    const [{loading, products, error}, dispatch] = React.useReducer(reducer, {
        loading: true,
        products: [],
        error: "",
    });

    React.useEffect(() => {
        const fetchData = async () => {
            dispatch({type: "FETCH_REQUEST"});
            try {
                const result = await axios.get("/api/products", {params: {limit: 100}});
                dispatch({type: "FETCH_SUCCESS", payload: getProductsFromResponse(result.data)});
            } catch (error) {
                dispatch({type: "FETCH_FAIL", payload: error.message});
            }
        };
        fetchData();
    }, []);
    return (
        <>
            <div className="allproduct-page-container">
                <div className="allproduct-page-content">
                    <header className="header">
                        <button className="nav-btn">
                            <span className="arrow-icon" style={{marginRight: "10px"}}>
                                ◀
                            </span>
                            Back
                        </button>
                        <div className="header-right">
                            <Link to="/cart" className="cart-header" style={{textDecoration: "none"}}>
                                <p>{getCartCount()}</p>
                                <img src={require("../../assets/img/htbc-cart.png")} alt="Cart" />
                                <h2>My Cart</h2>
                            </Link>
                        </div>
                    </header>
                    <div className="allproduct-content">
                        {loading ? (
                            <div>
                                <Loading />
                            </div>
                        ) : error ? (
                            <div>{error}</div>
                        ) : (
                            products.map((product) => <Product key={getProductId(product)} product={product} />)
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
