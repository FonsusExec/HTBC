export const getProductsFromResponse = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
};

export const getProductId = (product) => product?._id || product?.htbc || product?.id || "";

export const getProductRouteId = (product) => product?.htbc || product?._id || product?.id || "";

export const getProductName = (product) => product?.name || product?.title || "Untitled Product";

export const getProductImage = (product) => product?.image || product?.mainImage || product?.images?.[0] || "/img/htbc-shop1.png";

export const getProductPrice = (product) => product?.price ?? 0;

export const toCartItem = (product, qty = 1) => ({
    _id: getProductId(product),
    name: getProductName(product),
    image: getProductImage(product),
    price: getProductPrice(product),
    qty,
});
