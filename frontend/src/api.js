const BASE = '';

export async function api(method, path, body) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    console.error(`API ${method} ${path} → ${res.status}`);
    return null;
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const fetchGames = () => api('GET', '/api/games');
export const fetchGame = (id) => api('GET', `/api/games/${id}`);
export const fetchCodes = (id) => api('GET', `/api/games/${id}/codes`);
export const mountDisk = (drive, gameId, diskFile) =>
  api('POST', `/api/fdd/${drive}`, { gameId, diskFile });
export const ejectDisk = (drive) => api('DELETE', `/api/fdd/${drive}`);
export const rescanLibrary = () => api('POST', '/api/library/rescan');
