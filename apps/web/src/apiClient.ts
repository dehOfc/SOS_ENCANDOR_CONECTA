export const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '/api';

export function apiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  if (normalizedBase && path.startsWith(normalizedBase)) {
    return path;
  }

  return `${normalizedBase}${path}`;
}
