export const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || '/api';

export function apiUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  return `${apiBaseUrl}${path}`;
}
