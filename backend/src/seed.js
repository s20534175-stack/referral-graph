/**
 * seed.js
 * Wipes the CognoDB instance and loads a realistic professional network:
 * Person, Company, College, Skill nodes connected by WORKS_AT, STUDIED_AT,
 * HAS_SKILL, KNOWS and REFERRED relationships.
 *
 * Run with: npm run seed
 */
const { getSession, driver } = require('./db');

const COLLEGES = [
  'Rajalakshmi Engineering College',
  'IIT Madras',
  'Anna University',
  'VIT Vellore',
  'PSG College of Technology',
  'BITS Pilani',
  'NIT Trichy',
  'SRM Institute of Science and Technology',
];

const COMPANIES = [
  { name: 'Wexa AI', industry: 'AI / Developer Tools' },
  { name: 'Zoho', industry: 'SaaS' },
  { name: 'Freshworks', industry: 'SaaS' },
  { name: 'Chargebee', industry: 'Fintech SaaS' },
  { name: 'Swiggy', industry: 'Consumer Tech' },
  { name: 'Razorpay', industry: 'Fintech' },
  { name: 'CRED', industry: 'Fintech' },
  { name: 'Ather Energy', industry: 'Hardware / EV' },
  { name: 'Zerodha', industry: 'Fintech' },
  { name: 'Postman', industry: 'Developer Tools' },
];

const SKILLS = [
  'React', 'Node.js', 'Python', 'Graph Databases', 'System Design',
  'Machine Learning', 'DevOps', 'Product Sense', 'TypeScript', 'Go',
  'Data Engineering', 'UI/UX Design', 'FastAPI', 'PostgreSQL', 'Cypher',
];

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Karthik', 'Divya', 'Sanjay', 'Meera', 'Vikram', 'Anjali',
  'Rahul', 'Sneha', 'Aditya', 'Kavya', 'Naveen', 'Pooja', 'Rohit', 'Lakshmi',
  'Suresh', 'Nisha', 'Deepak', 'Swathi', 'Manoj', 'Ritu', 'Gokul', 'Harini',
  'Vishal', 'Preethi', 'Ashwin', 'Bhavana', 'Kiran', 'Yamini', 'Arun', 'Shalini',
  'Dinesh', 'Tara', 'Prakash', 'Ishita', 'Balaji', 'Nandini', 'Ganesh', 'Aarthi',
];
const LAST_NAMES = [
  'Iyer', 'Krishnan', 'Menon', 'Reddy', 'Nair', 'Rao', 'Sharma', 'Pillai',
  'Subramanian', 'Varma', 'Chandran', 'Raman', 'Kumar', 'Srinivasan', 'Ramesh',
];

function pick(arr, n = 1) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildPeople(count) {
  const people = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    let name;
    do {
      name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    people.push({
      id: `p${i + 1}`,
      name,
      headline: pick(['Software Engineer', 'Data Scientist', 'Product Manager', 'SDE II', 'Founding Engineer', 'ML Engineer', 'Frontend Engineer', 'Backend Engineer']),
      years_exp: randInt(0, 12),
    });
  }
  return people;
}

async function seed() {
  const session = getSession();
  try {
    console.log('Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    console.log('Creating constraints...');
    await session.run('CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT college_id IF NOT EXISTS FOR (c:College) REQUIRE c.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE');

    console.log('Loading companies, colleges, skills...');
    await session.run(
      `UNWIND $companies AS c
       CREATE (:Company {id: c.id, name: c.name, industry: c.industry})`,
      { companies: COMPANIES.map((c, i) => ({ id: `co${i + 1}`, ...c })) }
    );
    await session.run(
      `UNWIND $colleges AS name
       CREATE (:College {id: randomUUID(), name: name})`,
      { colleges: COLLEGES }
    );
    await session.run(
      `UNWIND $skills AS name
       CREATE (:Skill {id: 'sk-' + toLower(replace(name, ' ', '-')), name: name})`,
      { skills: SKILLS }
    );

    const people = buildPeople(60);
    console.log(`Loading ${people.length} people...`);
    await session.run(
      `UNWIND $people AS p
       CREATE (:Person {id: p.id, name: p.name, headline: p.headline, years_exp: p.years_exp})`,
      { people }
    );

    // Designate the seeker persona - a recent graduate job-hunting, same shape as this project's author.
    await session.run(
      `CREATE (:Person {id: 'seeker-1', name: 'You', headline: 'Recent Grad - Full-Stack & AI', years_exp: 0})`
    );
    const allPersonIds = ['seeker-1', ...people.map((p) => p.id)];

    console.log('Wiring WORKS_AT...');
    for (const pid of people.map((p) => p.id)) {
      const company = pick(COMPANIES.map((c, i) => `co${i + 1}`));
      await session.run(
        `MATCH (p:Person {id:$pid}), (c:Company {id:$cid})
         MERGE (p)-[:WORKS_AT {since: $since, role: 'Team Member'}]->(c)`,
        { pid, cid: company, since: 2015 + randInt(0, 9) }
      );
    }

    console.log('Wiring STUDIED_AT...');
    const collegeRows = await session.run('MATCH (c:College) RETURN c.id AS id, c.name AS name');
    const collegeIds = collegeRows.records.map((r) => r.get('id'));
    for (const pid of allPersonIds) {
      const college = pick(collegeIds);
      await session.run(
        `MATCH (p:Person {id:$pid}), (c:College {id:$cid})
         MERGE (p)-[:STUDIED_AT {batch: $batch}]->(c)`,
        { pid, cid: college, batch: 2016 + randInt(0, 10) }
      );
    }
    // Anchor the seeker's own college explicitly (matches this project's real-world origin story).
    await session.run(
      `MATCH (p:Person {id:'seeker-1'})-[r:STUDIED_AT]->() DELETE r`
    );
    await session.run(
      `MATCH (p:Person {id:'seeker-1'}), (c:College {name:'Rajalakshmi Engineering College'})
       MERGE (p)-[:STUDIED_AT {batch: 2026}]->(c)`
    );

    console.log('Wiring HAS_SKILL...');
    const skillRows = await session.run('MATCH (s:Skill) RETURN s.id AS id');
    const skillIds = skillRows.records.map((r) => r.get('id'));
    for (const pid of allPersonIds) {
      const mySkills = pick(skillIds, randInt(2, 5));
      for (const sid of mySkills) {
        await session.run(
          `MATCH (p:Person {id:$pid}), (s:Skill {id:$sid})
           MERGE (p)-[:HAS_SKILL {level: $level}]->(s)`,
          { pid, sid, level: pick(['beginner', 'intermediate', 'advanced']) }
        );
      }
    }
    // Give the seeker a concrete, defensible skill set.
    await session.run(`MATCH (p:Person {id:'seeker-1'})-[r:HAS_SKILL]->() DELETE r`);
    for (const name of ['React', 'Node.js', 'Python', 'Graph Databases', 'System Design']) {
      await session.run(
        `MATCH (p:Person {id:'seeker-1'}), (s:Skill {name:$name})
         MERGE (p)-[:HAS_SKILL {level:'intermediate'}]->(s)`,
        { name }
      );
    }

    console.log('Wiring KNOWS (professional network)...');
    for (const pid of allPersonIds) {
      const connections = pick(allPersonIds.filter((id) => id !== pid), randInt(2, 6));
      for (const otherId of connections) {
        await session.run(
          `MATCH (a:Person {id:$a}), (b:Person {id:$b})
           MERGE (a)-[:KNOWS {context: $context}]-(b)`,
          { a: pid, b: otherId, context: pick(['ex-colleague', 'college friend', 'hackathon teammate', 'conference met', 'LinkedIn connection']) }
        );
      }
    }

    console.log('Wiring a handful of REFERRED edges (historical outcomes)...');
    const referralPairs = pick(
      allPersonIds.filter((id) => id !== 'seeker-1'),
      10
    );
    for (let i = 0; i < referralPairs.length - 1; i += 2) {
      await session.run(
        `MATCH (a:Person {id:$a}), (b:Person {id:$b})
         MERGE (a)-[:REFERRED {date: date(), outcome: $outcome}]->(b)`,
        { a: referralPairs[i], b: referralPairs[i + 1], outcome: pick(['hired', 'interviewed', 'pending']) }
      );
    }

    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
