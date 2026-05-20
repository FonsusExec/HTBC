export const getAuthHeaders = (headers = {}) => {
    const token = localStorage.getItem("token");
    return token ? {...headers, Authorization: `Bearer ${token}`} : headers;
};
