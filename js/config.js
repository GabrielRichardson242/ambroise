export function getApiBaseUrl() {
  const stored = localStorage.getItem('AMBROISE_PUBLIC_API_BASE_URL');
  return stored && stored.trim().length > 0 ? stored : 'http://localhost:3000';
}

export const Config = { apiBaseUrl: getApiBaseUrl() };


