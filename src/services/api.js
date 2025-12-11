import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "https://icnan-25-backend.onrender.com",
    withCredentials: true,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export default api;

// ---- Your API function exports below ----

export const login = (identifier, password) =>
    api.post('/auth/login', { identifier, password });

export const searchParticipants = (query) =>
    api.get(`/participants/search?query=${encodeURIComponent(query)}`);

export const getAllParticipants = () => api.get('/participants');

export const uploadParticipantsExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const assignBarcode = (email, barcode) =>
    api.post('/assign-barcode', { email, barcode });

export const deassignBarcode = (email) =>
    api.post('/deassign-barcode', { email });

export const markEntry = (barcode, venue) =>
    api.post('/mark-entry', { barcode, venue });

export const getEntryHistory = (barcode) =>
    api.get(`/entries/${barcode}`);

export const getAllEntries = (params = {}) =>
    api.get('/entries/all', { params });

export const getEntryStats = () =>
    api.get('/entries/stats');

