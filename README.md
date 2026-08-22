# ReferralGraph

**Find the shortest path to a warm introduction at any company — through your real professional network.**

Built for the Wexa AI take-home assignment: *Build a Graph Database Application*, using CognoDB as the graph layer.

Every job search eventually reduces to the same question: *who do I know who can get me in the door?* That question is a graph traversal problem in disguise — chains of people, shared history, and overlapping skills — and it is exactly the kind of problem a relational schema is the wrong shape for. ReferralGraph makes that traversal explicit and queryable.

---

## Live demo

- App: `<add your Vercel URL here after deploying>`
- API: `<add your Render URL here after deploying>`
- Screen recording: `<add a 60–90s Loom/screen recording link here>`

*(See "Deploying" below — these three links are the only things left to fill in once you've pushed this to your own GitHub account and connected CognoDB.)*

---

## 1. Why a graph database?

The core question this app answers — *"what is the shortest chain of people connecting me to someone at Company X?"* — is a **variable-length path search**. In a relational schema, `KNOWS` would be a self-referencing join table (`person_id`, `known_person_id`), and finding a shortest path between two arbitrary rows means a **recursive CTE**: you pick a maximum depth up front, `UNION` a growing set of visited rows at every level, manually filter out cycles, and re-run the whole thing for every new seeker/target pair. It gets slower and uglier with every extra hop, and "shortest path" isn't a primitive SQL understands — you're approximating it with `LIMIT 1 ORDER BY depth`.

In Cypher, the same question is one line:

```cypher
MATCH path = shortestPath((seeker:Person)-[:KNOWS*1..4]-(target:Person))
```

The second and third features compound this further: finding connectors who are *simultaneously* within N hops **and** share a skill, or who share a college **and** work at the target company, means joining across relationship types that have nothing to do with each other in a flat schema (`HAS_SKILL`, `STUDIED_AT`, `WORKS_AT`, `KNOWS`). In a graph, that's just pattern matching — walk one relationship type, then pivot to another, in the same query, with no join-table explosion. That's the gap this project is built to demonstrate.

---

## 2. Data model

```
 (Person) --WORKS_AT--> (Company)
 (Person) --STUDIED_AT--> (College)
 (Person) --HAS_SKILL--> (Skill)
 (Person) --KNOWS-- (Person)         [undirected professional connection]
 (Person) --REFERRED--> (Person)     [historical referral outcomes]
```

| Node       | Key properties                          |
|------------|------------------------------------------|
| `Person`   | `id`, `name`, `headline`, `years_exp`     |
| `Company`  | `id`, `name`, `industry`                  |
| `College`  | `id`, `name`                              |
| `Skill`    | `id`, `name`                              |

| Relationship         | Properties                | Meaning                                   |
|----------------------|----------------------------|--------------------------------------------|
| `WORKS_AT`            | `since`, `role`            | current employer                          |
| `STUDIED_AT`          | `batch`                    | alma mater                                |
| `HAS_SKILL`           | `level`                    | skill + proficiency                       |
| `KNOWS`                | `context`                  | how the two people know each other        |
| `REFERRED`             | `date`, `outcome`          | a past referral and what happened         |

There's one seeded persona, `seeker-1` ("You"), representing the job seeker — a recent grad with React/Node/Python/Graph Databases/System Design skills, seeded from Rajalakshmi Engineering College — so the demo mirrors a real job-search scenario rather than an abstract dataset.

---

## 3. The three queries

All three live in `backend/src/routes/graph.js`, run through the official Neo4j driver with **parameterised Cypher** (no string concatenation).

1. **`GET /api/path`** — `shortestPath()` over `KNOWS*1..4`, the multi-hop traversal.
2. **`GET /api/connectors`** — bounded `KNOWS` traversal intersected with a shared `HAS_SKILL` — the query that's awkward in SQL because it mixes a recursive join with a set intersection on a second relationship.
3. **`GET /api/alumni-bridge`** — a 2-hop pattern through a shared `College`.

---

## 4. Tech stack

- **Database:** CognoDB Cloud (openCypher over Bolt) via the official `neo4j-driver`
- **Backend:** Node.js + Express
- **Frontend:** React + Vite, plain CSS (no framework) — transit-map-inspired visual language, where people are "stations" and the referral chain is drawn as a line connecting them
- **Hosting:** Render (API) + Vercel (frontend) — free tiers, no credit card

---

## 5. Setup & running locally

### 5.1 Create your CognoDB instance
1. Go to https://console.cognodb.com/signup and sign up (no credit card).
2. Create a free `c0` instance and pick a region.
3. Copy the connection URI (`bolt+s://<instance-id>.databases.cognodb.cloud`) and the generated password for user `cognodb` **immediately** — it's shown once.

### 5.2 Backend
```bash
cd backend
cp .env.example .env
# edit .env: paste your NEO4J_URI and NEO4J_PASSWORD
npm install
npm run seed     # loads ~60 people, 10 companies, colleges, skills, and relationships
npm start         # http://localhost:4000
```

### 5.3 Frontend
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:4000" > .env
npm run dev        # http://localhost:5173
```

Open the app, pick a target company, and hit **Find my way in**.

---

## 6. Deploying (matches the assignment's mandatory hosted-demo requirement)

**Backend → Render**
1. Push this repo to your own GitHub account.
2. On Render: New → Web Service → connect the repo → root directory `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`, and `CORS_ORIGIN` (your Vercel URL, added after step below).
5. After first deploy, run `npm run seed` once — either via Render's shell, or temporarily as a one-off Job — to populate CognoDB.

**Frontend → Vercel**
1. New Project → import the repo → root directory `frontend`.
2. Add environment variable `VITE_API_URL` = your Render URL.
3. Deploy.
4. Go back to Render and set `CORS_ORIGIN` to your live Vercel URL, then redeploy the backend.

Fill in both URLs (and a short screen recording) at the top of this README before submitting.

---

## 7. Error handling

- The Express error middleware catches DB failures and returns a clean `500` instead of crashing.
- The frontend uses `Promise.allSettled` for the three panels, so if one query fails (e.g. CognoDB free-tier connection cap), the other two still render — no single point of failure across the page.
- Empty states are explicit ("no chain found within 4 hops — try the skill-match panel instead") rather than blank screens.

---

## 8. What I'd extend with more time

- Cache `/api/companies` and `/api/people` client-side; they rarely change.
- A visual force-directed graph view (e.g. via `react-force-graph`) as a second tab alongside the transit-line view.
- Weighting `KNOWS*` paths by relationship recency/strength instead of pure hop-count.
