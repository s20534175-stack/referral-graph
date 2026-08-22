export default function SearchForm({ companies, selectedCompany, onSelectCompany, onSearch, loading }) {
  return (
    <form
      className="search-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <div className="search-form__field">
        <label htmlFor="company">Target company</label>
        <select
          id="company"
          value={selectedCompany}
          onChange={(e) => onSelectCompany(e.target.value)}
        >
          <option value="" disabled>
            Choose where you want to get in...
          </option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.industry}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={!selectedCompany || loading}>
        {loading ? 'Searching the graph…' : 'Find my way in'}
      </button>
    </form>
  );
}
