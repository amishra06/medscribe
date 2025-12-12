// For production: Set via Netlify environment variable
// For development: Use localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

console.log('API URL:', API_URL);

export { API_URL };
export default API_URL;
