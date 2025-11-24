// lib/axios.ts
import axios from "axios"
import { getToken, removeToken } from "./auth"

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ||
        "https://shipsupply.kodlanabilir.com",
})

// Before every request, insert the header
instance.interceptors.request.use(config => {
    // If config.headers is AxiosHeaders, use .set; otherwise, mutate as object or assign if undefined
    if (config.headers && typeof config.headers.set === 'function') {
        const token = getToken();
        if (token) config.headers.set('Authorization', `Bearer ${token}`);
        if (typeof window !== 'undefined') {
            const selectedBusinessId = localStorage.getItem('selected_business_id');
            if (selectedBusinessId) config.headers.set('x-business-id', selectedBusinessId);
        }
    } else {
        // config.headers is undefined or a plain object
        const token = getToken();
        const headers = (config.headers && typeof config.headers === 'object') ? { ...config.headers } : {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (typeof window !== 'undefined') {
            const selectedBusinessId = localStorage.getItem('selected_business_id');
            if (selectedBusinessId) headers['x-business-id'] = selectedBusinessId;
        }
        config.headers = headers;
    }
    return config;
}, error => Promise.reject(error))

// Optional: If you ever get a 401 back, clear token & redirect
instance.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            removeToken()
            if (typeof window !== "undefined") window.location.href = "/login"
        }
        return Promise.reject(err)
    }
)

export default instance
