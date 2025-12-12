// For production: Set via Netlify environment variable
// For development: Use localhost
// Normalize URL without trailing slash
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = RAW_API_URL.replace(/\/$/, '');  // Remove trailing slash if present

console.log('API URL:', API_URL);
export { API_URL };
export default API_URL;

