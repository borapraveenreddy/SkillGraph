import axios from 'axios';

// Selects Vercel env variable in production, falls back to local Express server
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15-second timeout for cold starts
});

// Fetch full graph network (nodes & relationships)
export const getGraphData = async () => {
    try {
        const response = await api.get('/api/graph');
        return response.data;
    } catch (error) {
        console.error('API Error [getGraphData]:', error.message);
        throw error;
    }
};

// Fetch 2-hop skill gap traversal analysis
export const getSkillGap = async (developer = 'Alex Johnson', role = 'Graph Database Developer') => {
    try {
        const response = await api.get('/api/skill-gap', {
            params: { developer, role },
        });
        return response.data;
    } catch (error) {
        console.error('API Error [getSkillGap]:', error.message);
        throw error;
    }
};

export default api;