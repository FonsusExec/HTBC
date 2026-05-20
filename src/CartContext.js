// Updated CartContext.jsx - Fixed Price Parsing
import React, {createContext, useContext, useReducer, useEffect} from "react";

const CartContext = createContext();

const cartReducer = (state, action) => {
    // Helper to parse price (strip currency symbol and convert to number)
    const parsePrice = (price) => {
        if (typeof price === "string") {
            return parseFloat(price.replace(/[^\d.]/g, "")) || 0; // Remove non-digits except '.', fallback to 0
        }
        return parseFloat(price) || 0;
    };

    switch (action.type) {
        case "ADD_ITEM":
            const parsedPayload = {...action.payload, price: parsePrice(action.payload.price)};
            const stockLimit = Number(parsedPayload.stock);
            const hasStockLimit = Number.isFinite(stockLimit) && stockLimit >= 0;
            if (hasStockLimit && stockLimit < 1) return state;
            const existItem = state.cart.find((x) => x._id === parsedPayload._id);
            if (existItem) {
                return {
                    ...state,
                    cart: state.cart.map((x) => (x._id === parsedPayload._id ? {...x, qty: hasStockLimit ? Math.min(stockLimit, x.qty + parsedPayload.qty) : x.qty + parsedPayload.qty} : x)),
                };
            } else {
                return {
                    ...state,
                    cart: [...state.cart, {...parsedPayload, qty: hasStockLimit ? Math.min(stockLimit, parsedPayload.qty) : parsedPayload.qty}],
                };
            }
        case "UPDATE_QTY":
            return {
                ...state,
                cart: state.cart.map((x) => (x._id === action.payload._id ? {...x, qty: action.payload.qty} : x)),
            };
        case "REMOVE_ITEM":
            return {
                ...state,
                cart: state.cart.filter((x) => x._id !== action.payload),
            };
        case "CLEAR_CART":
            return {...state, cart: []};
        case "LOAD_CART":
            // Parse prices on load from localStorage (in case saved as strings)
            const loadedCart = action.payload.map((item) => ({
                ...item,
                price: parsePrice(item.price),
            }));
            return {...state, cart: loadedCart};
        default:
            return state;
    }
};

export const CartProvider = ({children}) => {
    const [state, dispatch] = useReducer(cartReducer, {cart: []});

    // Load from localStorage on mount (now parses prices)
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        dispatch({type: "LOAD_CART", payload: savedCart});
    }, []);

    // Sync to localStorage on state change (save as numbers)
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(state.cart));
    }, [state.cart]);

    const addToCart = (item) => {
        dispatch({type: "ADD_ITEM", payload: item});
    };

    const updateQty = (id, qty) => {
        dispatch({type: "UPDATE_QTY", payload: {_id: id, qty}});
    };

    const removeFromCart = (id) => {
        dispatch({type: "REMOVE_ITEM", payload: id});
    };

    const clearCart = () => {
        dispatch({type: "CLEAR_CART"});
    };

    const getCartCount = () => {
        return state.cart.reduce((total, item) => total + item.qty, 0);
    };

    const getCartTotal = () => {
        return state.cart.reduce((total, item) => total + item.price * item.qty, 0); // Now safe: price is number
    };

    const getCartItems = () => state.cart;

    return (
        <CartContext.Provider
            value={{
                cart: state.cart,
                addToCart,
                updateQty,
                removeFromCart,
                clearCart,
                getCartCount,
                getCartTotal,
                getCartItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within CartProvider");
    }
    return context;
};
