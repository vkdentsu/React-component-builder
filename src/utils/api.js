const backendUrl = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');

export function getApiUrl(path) {
  return `${backendUrl}/${path.replace(/^\/+/, '')}`;
}
