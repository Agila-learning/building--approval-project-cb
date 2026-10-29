export const getApiUrl = (): string => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

export const API_BASE_URL = getApiUrl();
