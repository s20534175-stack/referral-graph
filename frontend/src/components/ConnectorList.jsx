export default function ConnectorList({ title, subtitle, items, loading, error, renderTag }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      <p className="panel__subtitle">{subtitle}</p>
      {loading && <div className="skeleton skeleton--list" />}
      {!loading && error && <p className="empty-state empty-state--error">{error}</p>}
      {!loading && !error && items && items.length === 0 && (
        <p className="empty-state">Nothing here yet — try a different company.</p>
      )}
      {!loading && !error && items && items.length > 0 && (
        <ul className="connector-list">
          {items.map((item) => (
            <li key={item.id} className="connector-list__item">
              <div>
                <span className="connector-list__name">{item.name}</span>
                {item.headline && <span className="connector-list__headline"> · {item.headline}</span>}
              </div>
              {renderTag && <div className="connector-list__tags">{renderTag(item)}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
