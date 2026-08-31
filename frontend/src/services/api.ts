import axios from 'axios'

// 1. Create central Axios instance pointing to backend
export const API = axios.create({
    baseURL:'http://localhost:5000/api/v1',
});

// 2. Interceptor: Runs before EVERY outgoing HTTP request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;
