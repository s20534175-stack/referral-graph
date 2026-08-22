# ReferralGraph

**Find the shortest path to a warm introduction at any company — through your real professional network.**

Built for the Wexa AI take-home assignment: *Build a Graph Database Application*, using CognoDB as the graph layer.

Every job search eventually reduces to the same question: *who do I know who can get me in the door?* That question is a graph traversal problem in disguise — chains of people, shared history, and overlapping skills — and it is exactly the kind of problem a relational schema is the wrong shape for. ReferralGraph makes that traversal explicit and queryable.

---

## Live demo

- App: https://referral-graph.vercel.app
- API: https://referral-graph-6prm.onrender.com
- Screen recording: attached to the submission email

---

## 1. Why a graph database?

The core question this app answers is a variable-length path search. In a relational schema, KNOWS would be a self-referencing join table, and finding a shortest path between two arbitrary rows means a recursive CTE with a hand-picked depth limit. In Cypher, the same question is one line using shortestPath().

The second and third features compound this further: finding connectors who are simultaneously within N hops and share a skill, or who share a college and work at the target company, means joining across relationship types that have nothing to do with each other in a flat schema. In a graph, that's just pattern matching.

---

## 2. Data model

(Person) --WORKS_AT--> (Company)
(Person) --STUDIED_AT--> (College)
(Person) --HAS_SKILL--> (Skill)
(Person) --KNOWS-- (Person)
(Person) --REFERRED--> (Person)

Nodes: Person, Company, College, Skill.
Relationships: WORKS_AT, STUDIED_AT, HAS_SKILL, KNOWS, REFERRED.

There's one seeded persona, seeker-1 ("You"), representing the job seeker.

---

## 3. The three queries

All three live in backend/src/routes/graph.js, run through the official Neo4j driver with parameterised Cypher.

1. GET /api/path — shortestPath() over KNOWS*1..4, the multi-hop traversal.
2. GET /api/connectors — bounded KNOWS traversal intersected with a shared HAS_SKILL.
3. GET /api/alumni-bridge — a 2-hop pattern through a shared College.

---

## 4. Tech stack

- Database: CognoDB Cloud (openCypher over Bolt) via the official neo4j-driver
- Backend: Node.js + Express
- Frontend: React + Vite, plain CSS
- Hosting: Render (API) + Vercel (frontend)

---

## 5. Setup & running locally

### 5.1 Create your CognoDB instance
Sign up at console.cognodb.com/signup, create a free instance, copy the URI and password.

### 5.2 Backend
cd backend
cp .env.example .env
npm install
npm run seed
npm start

### 5.3 Frontend
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev

---

## 6. Deploying

Backend deployed to Render (root directory: backend, build: npm install, start: npm start).
Frontend deployed to Vercel (root directory: frontend).

---

## 7. Error handling

- Express error middleware catches DB failures and returns a clean 500.
- Frontend uses Promise.allSettled for the three panels so one failure doesn't blank the page.
- Explicit empty states instead of blank screens.

---

## 8. What I'd extend with more time

- Cache /api/companies and /api/people client-side.
- A visual force-directed graph view as a second tab.
- Weighting KNOWS* paths by relationship recency/strength.