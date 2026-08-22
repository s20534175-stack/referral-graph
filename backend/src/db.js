const neo4j = require('neo4j-driver');
require('dotenv').config();

const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;

if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
  console.error(
    'Missing NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD. Copy .env.example to .env and fill in your CognoDB Cloud credentials.'
  );
}

// CognoDB speaks openCypher over Bolt, so the standard Neo4j JS driver works unmodified.
const driver = neo4j.driver(
  NEO4J_URI,
  neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  { disableLosslessIntegers: true }
);

async function verifyConnection() {
  try {
    await driver.verifyConnectivity();
    console.log('Connected to CognoDB instance.');
  } catch (err) {
    console.error('Could not connect to CognoDB instance:', err.message);
  }
}

function getSession() {
  return driver.session();
}

module.exports = { driver, getSession, verifyConnection };
