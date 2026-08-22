export default function PathResult({ paths, companyName, loading, error }) {
  if (loading) return <div className="skeleton skeleton--path" />;
  if (error) return <p className="empty-state empty-state--error">{error}</p>;
  if (!paths || paths.length === 0) {
    return (
      <p className="empty-state">
        No connection chain found within 4 hops. Try widening your network, or aim for the
        skill-match / alumni suggestions below instead.
      </p>
    );
  }

  return (
    <div className="path-list">
      {paths.map((path, i) => (
        <div className="path-card" key={i}>
          <div className="path-card__meta">
            {path.hops} hop{path.hops !== 1 ? 's' : ''} to someone at {companyName}
          </div>
          <div className="path-chain">
            {path.people.map((person, idx) => (
              <div className="path-chain__node" key={person.id}>
                <div className="path-chain__bubble">
                  <span className="path-chain__name">{person.name}</span>
                  {person.headline && <span className="path-chain__headline">{person.headline}</span>}
                </div>
                {idx < path.people.length - 1 && (
                  <div className="path-chain__edge">
                    <span>{path.contexts[idx] || 'knows'}</span>
                    <div className="path-chain__arrow">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
