const express = require('express');
const cors = require('cors');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Allow requests from your deployed frontend
app.use(cors({
    origin: '*', // Allows Vercel frontend to fetch graph data freely
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5000;

// Initialize CognoDB / Neo4j Bolt Driver
const driver = neo4j.driver(
    process.env.COGNODB_URI,
    neo4j.auth.basic(process.env.COGNODB_USERNAME, process.env.COGNODB_PASSWORD)
);

// Helper function to seed sample data if DB is empty
const seedDatabaseIfEmpty = async (session) => {
    const check = await session.run('MATCH (n) RETURN count(n) AS count');
    const count = check.records[0].get('count').toNumber();

    if (count === 0) {
        console.log('Database empty. Seeding sample SkillGraph dataset...');
        await session.run(`
      CREATE (dev:Developer {name: "Alex Johnson"})
      CREATE (role1:JobRole {title: "Graph Database Developer"})
      CREATE (role2:JobRole {title: "Full Stack Engineer"})
      
      CREATE (s1:Skill {name: "Cypher"})
      CREATE (s2:Skill {name: "Neo4j"})
      CREATE (s3:Skill {name: "React"})
      CREATE (s4:Skill {name: "Node.js"})
      CREATE (s5:Skill {name: "Graph Theory"})

      CREATE (dev)-[:HAS_SKILL]->(s1)
      CREATE (dev)-[:HAS_SKILL]->(s3)
      CREATE (dev)-[:HAS_SKILL]->(s4)

      CREATE (role1)-[:REQUIRES]->(s1)
      CREATE (role1)-[:REQUIRES]->(s2)
      CREATE (role1)-[:REQUIRES]->(s5)

      CREATE (role2)-[:REQUIRES]->(s3)
      CREATE (role2)-[:REQUIRES]->(s4)

      CREATE (s2)-[:RELATED_TO]->(s1)
    `);
        console.log('Seeding complete!');
    }
};

// 1. Fetch entire graph for canvas visualization
app.get('/api/graph', async (req, res) => {
    const session = driver.session();
    try {
        await seedDatabaseIfEmpty(session);

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

// Phase 4 Endpoint: Multi-hop career pathway traversal
// Phase 4 Endpoint: Multi-hop career pathway traversal
app.get('/api/career-pathway', async (req, res) => {
    const { developer = 'Alex Johnson', role = 'Graph Database Developer' } = req.query;
    const session = driver.session();

    try {
        const query = `
      MATCH (d:Developer {name: $developer})
      MATCH (j:JobRole {title: $role})-[:REQUIRES]->(requiredSkill:Skill)
      OPTIONAL MATCH (d)-[:HAS_SKILL]->(devSkill:Skill)
      WITH d, j, requiredSkill, collect(devSkill) AS devSkills
      WHERE NOT requiredSkill IN devSkills
      
      OPTIONAL MATCH (requiredSkill)-[:RELATED_TO]->(prereq:Skill)

      RETURN 
        requiredSkill.name AS missingSkill,
        collect(DISTINCT prereq.name) AS prerequisites
    `;

        const result = await session.run(query, { developer, role });

        const pathway = result.records.map((record) => {
            const missingSkill = record.get('missingSkill');
            const prerequisites = record.get('prerequisites') || [];

            // Construct structured step sequence
            return {
                targetSkill: missingSkill,
                prerequisites: prerequisites.filter(Boolean),
                recommendedSteps: prerequisites.length > 0
                    ? [...prerequisites, missingSkill]
                    : [missingSkill]
            };
        });

        res.json({
            developer,
            role,
            totalMissing: pathway.length,
            pathway,
        });
    } catch (err) {
        console.error('Career Pathway Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await session.close();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});