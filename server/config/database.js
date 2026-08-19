import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.COGNODB_URI;
const user = process.env.COGNODB_USERNAME || 'cognodb';
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
    console.warn('⚠️ Warning: COGNODB_URI or COGNODB_PASSWORD environment variables are missing!');
}

// Driver configuration with explicit timeout limits
const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, password),
    {
        maxConnectionLifetime: 3 * 60 * 1000, // 3 minutes
        maxConnectionPoolSize: 25,
        connectionAcquisitionTimeout: 20000, // 20 seconds timeout
    }
);

export const verifyConnection = async () => {
    const session = driver.session();
    try {
        const result = await session.run('RETURN 1 AS test');
        if (result.records.length > 0) {
            console.log('✅ Connected to CognoDB Cloud successfully!');
        }
    } catch (error) {
        console.error('❌ Failed to connect to CognoDB:', error.message);
    } finally {
        await session.close();
    }
};

export default driver;