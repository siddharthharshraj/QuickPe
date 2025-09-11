// frontend/src/config/api.js - API configuration for production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://quickpe.siddharth-dev.tech/api'
    : 'http://localhost:3001/api/v1';

export default API_BASE_URL;
