const backendUrl = (import.meta.env.Vite_BACKEND_URL || '').replace(/\/+$/, '');

export function getApiUrl(path) {
  return `${backendUrl}/${path.replace(/^\/+/, '')}`;
}
