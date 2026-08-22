const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  searchPeople: (q) => get(`/api/people?q=${encodeURIComponent(q)}`),
  listCompanies: () => get(`/api/companies`),
  findPath: (seekerId, companyId) => get(`/api/path?seekerId=${seekerId}&companyId=${companyId}`),
  findConnectors: (seekerId, companyId) => get(`/api/connectors?seekerId=${seekerId}&companyId=${companyId}`),
  findAlumniBridge: (seekerId, companyId) => get(`/api/alumni-bridge?seekerId=${seekerId}&companyId=${companyId}`),
};
