import axios from 'axios';

// Change to your actual backend API URL
const api = axios.create({
    baseURL: "https://your-backend.onrender.com",
    withCredentials: true,
});

export const login = (identifier, password) =>
    api.post('/auth/login', { identifier, password });

// Participant APIs
export const searchParticipants = (query) =>
    api.get(`/participants/search?query=${encodeURIComponent(query)}`);

export const getAllParticipants = () =>
    api.get('/participants');

export const uploadParticipantsExcel = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload-excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Barcode APIs
export const assignBarcode = (email, barcode) =>
    api.post('/assign-barcode', { email, barcode });

export const deassignBarcode = (email) =>
    api.post('/deassign-barcode', { email });

// Entry APIs
export const markEntry = (barcode, venue) =>
    api.post('/mark-entry', { barcode, venue });

export const getEntryHistory = (barcode) =>
    api.get(`/entries/${barcode}`);

export const getAllEntries = (params = {}) =>
    api.get('/entries/all', { params });

export const getEntryStats = () =>
    api.get('/entries/stats');

export default api;
