import express from 'express';
import { getFullGraph, getSkillGapAnalysis } from '../queries/graphQueries.js';

const router = express.Router();

// Get graph nodes and links for visualization
router.get('/graph', async (req, res) => {
    try {
        const data = await getFullGraph();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch graph data', details: error.message });
    }
});

// Perform 2+ hop skill gap analysis
router.get('/skill-gap', async (req, res) => {
    const { developer = 'Alex Johnson', role = 'Graph Database Developer' } = req.query;
    try {
        const gapData = await getSkillGapAnalysis(developer, role);
        res.json({ developer, targetRole: role, skillGaps: gapData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to compute skill gap', details: error.message });
    }
});

export default router;