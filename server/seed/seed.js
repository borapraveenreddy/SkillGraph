import driver from '../config/database.js';

const seedDatabase = async () => {
    const session = driver.session();
    try {
        console.log('🧹 Clearing existing database graph...');
        await session.run('MATCH (n) DETACH DELETE n');

        console.log('🌱 Seeding Nodes & Relationships...');

        // Seed Cypher execution
        await session.run(`
      // Create Skills
      CREATE (js:Skill {name: 'JavaScript', category: 'Language'})
      CREATE (react:Skill {name: 'React', category: 'Frontend'})
      CREATE (node:Skill {name: 'Node.js', category: 'Backend'})
      CREATE (cypher:Skill {name: 'Cypher', category: 'Database Query'})
      CREATE (graphDb:Skill {name: 'Graph Databases', category: 'Database'})

      // Create Skill-to-Skill Relationships
      CREATE (react)-[:RELATED_TO]->(js)
      CREATE (node)-[:RELATED_TO]->(js)
      CREATE (cypher)-[:RELATED_TO]->(graphDb)

      // Create Job Roles
      CREATE (fullstack:JobRole {title: 'Full Stack Engineer', minExperience: 2})
      CREATE (graphDev:JobRole {title: 'Graph Database Developer', minExperience: 3})

      // Link Job Role Requirements
      CREATE (fullstack)-[:REQUIRES]->(js)
      CREATE (fullstack)-[:REQUIRES]->(react)
      CREATE (fullstack)-[:REQUIRES]->(node)
      CREATE (graphDev)-[:REQUIRES]->(graphDb)
      CREATE (graphDev)-[:REQUIRES]->(cypher)

      // Create Sample Developers
      CREATE (dev1:Developer {name: 'Alex Johnson', email: 'alex@example.com'})
      CREATE (dev1)-[:HAS_SKILL {proficiency: 'Advanced'}]->(js)
      CREATE (dev1)-[:HAS_SKILL {proficiency: 'Intermediate'}]->(react)

      // Create Projects
      CREATE (proj1:Project {name: 'SkillGraph Navigator', status: 'In Progress'})
      CREATE (dev1)-[:BUILT]->(proj1)
      CREATE (proj1)-[:USES]->(react)
      CREATE (proj1)-[:USES]->(node)
      CREATE (proj1)-[:USES]->(graphDb)
    `);

        console.log('🎉 Graph Database successfully seeded!');
    } catch (error) {
        console.error('❌ Error during database seeding:', error);
    } finally {
        await session.close();
        await driver.close();
    }
};

seedDatabase();