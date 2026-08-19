import driver from '../config/database.js';

// 1. Fetch full graph (Nodes & Edges) for Visualization
export const getFullGraph = async () => {
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
            const source = record.get('n');
            if (source && !nodesMap.has(source.identity.toString())) {
                nodesMap.set(source.identity.toString(), {
                    id: source.identity.toString(),
                    labels: source.labels,
                    properties: source.properties,
                });
            }

            const target = record.get('m');
            const rel = record.get('r');

            if (target && rel) {
                if (!nodesMap.has(target.identity.toString())) {
                    nodesMap.set(target.identity.toString(), {
                        id: target.identity.toString(),
                        labels: target.labels,
                        properties: target.properties,
                    });
                }

                links.push({
                    id: rel.identity.toString(),
                    type: rel.type,
                    source: source.identity.toString(),
                    target: target.identity.toString(),
                });
            }
        });

        return {
            nodes: Array.from(nodesMap.values()),
            links,
        };
    } finally {
        await session.close();
    }
};

// 2. 2+ Hop Traversal: Find Missing Skills for a Target Job Role
export const getSkillGapAnalysis = async (developerName, targetRoleTitle) => {
    const session = driver.session();
    try {
        const cypher = `
      MATCH (d:Developer {name: $developerName})
      MATCH (j:JobRole {title: $targetRoleTitle})-[r:REQUIRES]->(reqSkill:Skill)
      WHERE NOT (d)-[:HAS_SKILL]->(reqSkill)
      OPTIONAL MATCH (reqSkill)-[:RELATED_TO]->(prereq:Skill)
      RETURN reqSkill.name AS missingSkill, 
             reqSkill.category AS category, 
             collect(prereq.name) AS prerequisites
    `;

        const result = await session.run(cypher, { developerName, targetRoleTitle });
        return result.records.map((rec) => ({
            missingSkill: rec.get('missingSkill'),
            category: rec.get('category'),
            prerequisites: rec.get('prerequisites'),
        }));
    } finally {
        await session.close();
    }
};