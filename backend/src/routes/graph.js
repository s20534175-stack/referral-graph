const express = require('express');
const { getSession } = require('../db');

const router = express.Router();

// ---- Lookup endpoints (for the search UI's autocomplete) ----------------

router.get('/people', async (req, res) => {
  const session = getSession();
  try {
    const q = (req.query.q || '').toLowerCase();
    const result = await session.run(
      `MATCH (p:Person)
       WHERE toLower(p.name) CONTAINS $q
       RETURN p.id AS id, p.name AS name, p.headline AS headline
       ORDER BY p.name LIMIT 15`,
      { q }
    );
    res.json(result.records.map((r) => r.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

router.get('/companies', async (req, res) => {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Company) RETURN c.id AS id, c.name AS name, c.industry AS industry ORDER BY c.name`
    );
    res.json(result.records.map((r) => r.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// ---- Core feature 1: shortest referral path (variable-length traversal) -
// This is the query a relational database handles awkwardly: finding the
// shortest chain of KNOWS relationships connecting two people is a
// recursive, unbounded-depth problem. In SQL it needs a recursive CTE with
// a manually chosen depth cap and cycle-detection bookkeeping. In Cypher
// it's a native, parameterised, one-line pattern.
router.get('/path', async (req, res) => {
  const { seekerId, companyId, maxHops = 4 } = req.query;
  if (!seekerId || !companyId) {
    return res.status(400).json({ error: 'seekerId and companyId are required' });
  }
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (seeker:Person {id: $seekerId}), (target:Person)-[:WORKS_AT]->(c:Company {id: $companyId})
       MATCH path = shortestPath((seeker)-[:KNOWS*1..${Number(maxHops)}]-(target))
       WHERE seeker <> target
       RETURN path,
              [n IN nodes(path) | {id: n.id, name: n.name, headline: n.headline}] AS people,
              [r IN relationships(path) | r.context] AS contexts,
              c.name AS companyName
       ORDER BY length(path) ASC
       LIMIT 5`,
      { seekerId, companyId }
    );

    const paths = result.records.map((r) => ({
      hops: r.get('people').length - 1,
      people: r.get('people'),
      contexts: r.get('contexts'),
      companyName: r.get('companyName'),
    }));

    res.json({ paths });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// ---- Core feature 2: skill-overlap connectors within N hops -------------
// "Who do I know (directly or through a friend) who works at Company X and
// shares a skill with me?" This mixes a bounded traversal with a set
// intersection on a *different* relationship type (HAS_SKILL) in the same
// query - exactly the kind of multi-dimensional join that gets painful in
// SQL once the join fan-out crosses two or three hops.
router.get('/connectors', async (req, res) => {
  const { seekerId, companyId, maxHops = 3 } = req.query;
  if (!seekerId || !companyId) {
    return res.status(400).json({ error: 'seekerId and companyId are required' });
  }
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (seeker:Person {id: $seekerId})-[:KNOWS*1..${Number(maxHops)}]-(connector:Person)-[:WORKS_AT]->(c:Company {id: $companyId})
       WHERE connector <> seeker
       MATCH (seeker)-[:HAS_SKILL]->(sharedSkill:Skill)<-[:HAS_SKILL]-(connector)
       RETURN DISTINCT connector.id AS id, connector.name AS name, connector.headline AS headline,
              collect(DISTINCT sharedSkill.name) AS sharedSkills
       LIMIT 10`,
      { seekerId, companyId }
    );
    res.json(result.records.map((r) => r.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

// ---- Core feature 3: alumni bridge ---------------------------------------
router.get('/alumni-bridge', async (req, res) => {
  const { seekerId, companyId } = req.query;
  if (!seekerId || !companyId) {
    return res.status(400).json({ error: 'seekerId and companyId are required' });
  }
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (seeker:Person {id: $seekerId})-[:STUDIED_AT]->(col:College)<-[:STUDIED_AT]-(alum:Person)-[:WORKS_AT]->(c:Company {id: $companyId})
       WHERE alum <> seeker
       RETURN alum.id AS id, alum.name AS name, alum.headline AS headline, col.name AS college
       LIMIT 10`,
      { seekerId, companyId }
    );
    res.json(result.records.map((r) => r.toObject()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await session.close();
  }
});

module.exports = router;
