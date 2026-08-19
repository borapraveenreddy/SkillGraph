import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { verifyConnection } from './config/database.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SkillGraph Server Running' });
});

app.listen(PORT, async () => {
    console.log(`🚀 Express Server running on http://localhost:${PORT}`);
    await verifyConnection();
});