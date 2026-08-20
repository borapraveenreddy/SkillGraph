const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Initialize CognoDB / Neo4j Bolt Driver
const driver = neo4j.driver(
    process.env.COGNODB_URI,
    neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);

// 1. Fetch entire graph for canvas visualization
app.get('/api/graph', async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m LIMIT 100
    `);

        const nodesMap = new Map();
        const links = [];

        result.records.forEach((record) => {
            const nodeN = record.get('n');
            const nodeM = record.get('m');
            const relR = record.get('r');

            if (nodeN) {
                nodesMap.set(nodeN.identity.toString(), {
                    id: nodeN.identity.toString(),
                    labels: nodeN.labels,
                    properties: nodeN.properties,
                });
            }

            if (nodeM) {
                nodesMap.set(nodeM.identity.toString(), {
                    id: nodeM.identity.toString(),
                    labels: nodeM.labels,
                    properties: nodeM.properties,
                });
            }

            if (relR) {
                links.push({
                    source: relR.start.toString(),
                    target: relR.end.toString(),
                    type: relR.type,
                });
            }
        });

        res.json({
            nodes: Array.from(nodesMap.values()),
            links,
        });
    } catch (err) {
        console.error('Graph Fetch Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

// 2. 2-Hop Traversal Skill Gap Analysis
app.get('/api/skill-gap', async (req, res) => {
    const { developer = 'Alex Johnson', role = 'Graph Database Developer' } = req.query;
    const session = driver.session();

    try {
        const query = `
      MATCH (j:JobRole {title: $role})-[:REQUIRES]->(requiredSkill:Skill)
      OPTIONAL MATCH (d:Developer {name: $developer})-[:HAS_SKILL]->(devSkill:Skill)
      WITH j, requiredSkill, collect(devSkill) AS devSkills
      WHERE NOT requiredSkill IN devSkills
      OPTIONAL MATCH (requiredSkill)-[:RELATED_TO]->(prereq:Skill)
      RETURN requiredSkill.name AS missingSkill, collect(prereq.name) AS prerequisites
    `;

        const result = await session.run(query, { developer, role });

        const skillGaps = result.records.map((record) => ({
            missingSkill: record.get('missingSkill'),
            prerequisites: record.get('prerequisites'),
        }));

        res.json({
            developer,
            role,
            skillGaps,
        });
    } catch (err) {
        console.error('Skill Gap Fetch Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});