// Strip trailing slashes so `${API_URL}/api/...` never becomes `//api/...`
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
