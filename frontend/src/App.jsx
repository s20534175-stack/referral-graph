import { useEffect, useState } from 'react';
import { api } from './api';
import SearchForm from './components/SearchForm';
import PathResult from './components/PathResult';
import ConnectorList from './components/ConnectorList';

const SEEKER_ID = 'seeker-1'; // the logged-in job seeker persona seeded by seed.js

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [companiesError, setCompaniesError] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('');

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [pathData, setPathData] = useState(null);
  const [connectors, setConnectors] = useState(null);
  const [alumni, setAlumni] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api
      .listCompanies()
      .then(setCompanies)
      .catch((e) => setCompaniesError(e.message));
  }, []);

  const companyName = companies.find((c) => c.id === selectedCompany)?.name || '';

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setErrors({});
    const [pathRes, connRes, alumRes] = await Promise.allSettled([
      api.findPath(SEEKER_ID, selectedCompany),
      api.findConnectors(SEEKER_ID, selectedCompany),
      api.findAlumniBridge(SEEKER_ID, selectedCompany),
    ]);

    if (pathRes.status === 'fulfilled') setPathData(pathRes.value.paths);
    else setErrors((e) => ({ ...e, path: pathRes.reason.message }));

    if (connRes.status === 'fulfilled') setConnectors(connRes.value);
    else setErrors((e) => ({ ...e, connectors: connRes.reason.message }));

    if (alumRes.status === 'fulfilled') setAlumni(alumRes.value);
    else setErrors((e) => ({ ...e, alumni: alumRes.reason.message }));

    setLoading(false);
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__badge">Powered by CognoDB · openCypher</div>
        <h1>ReferralGraph</h1>
        <p className="hero__subtitle">
          Every job search question is really a graph question: who do I know, who do they know,
          and who's already standing inside the company I want to reach. This tool answers that —
          three ways — by walking a real property graph instead of joining flat tables.
        </p>
      </header>

      {companiesError && <p className="empty-state empty-state--error">Couldn't load companies: {companiesError}</p>}

      <SearchForm
        companies={companies}
        selectedCompany={selectedCompany}
        onSelectCompany={setSelectedCompany}
        onSearch={handleSearch}
        loading={loading}
      />

      {searched && (
        <main className="results">
          <section className="panel panel--primary">
            <h3>Shortest referral chain{companyName ? ` to ${companyName}` : ''}</h3>
            <p className="panel__subtitle">
              A variable-length <code>shortestPath()</code> walk across your KNOWS network —
              the kind of query a relational schema needs a recursive CTE (and a hand-picked
              depth limit) to even approximate.
            </p>
            <PathResult paths={pathData} companyName={companyName} loading={loading} error={errors.path} />
          </section>

          <div className="panel-grid">
            <ConnectorList
              title="Skill-match connectors"
              subtitle="People within 3 hops who work there and share a skill with you."
              items={connectors}
              loading={loading}
              error={errors.connectors}
              renderTag={(item) => item.sharedSkills.map((s) => <span className="tag" key={s}>{s}</span>)}
            />
            <ConnectorList
              title="Alumni already there"
              subtitle="People who studied at your college and now work there."
              items={alumni}
              loading={loading}
              error={errors.alumni}
              renderTag={(item) => <span className="tag tag--muted">{item.college}</span>}
            />
          </div>
        </main>
      )}

      <footer className="footer">
        Seeded demo data — not real people. Built for the Wexa AI take-home assignment.
      </footer>
    </div>
  );
}
