import axios from 'axios';

// Replace with your exact Render backend URL
const API_BASE_URL = 'https://skillgraph-backend-6kkn.onrender.com/api';

export const getGraphData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/graph`);
        console.log('Graph data received from server:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching graph data:', error);
        throw error;
    }
};

export const getSkillGap = async (developer, role) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/skill-gap`, {
            params: { developer, role }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching skill gap:', error);
        throw error;
    }
};

export const getCareerPathway = async (developer, role) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/career-pathway`, {
            params: { developer, role }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching career pathway:', error);
        throw error;
    }
};