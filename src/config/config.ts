export function getEndpoints() {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  return {
    auth: `${BASE_URL}/auth`,
    user: `${BASE_URL}/users`,
    estimation: `${BASE_URL}/estimation`,
    hsp: `${BASE_URL}/hsp`,
    importHsp: `${BASE_URL}/hsp/import`,
  };
}
