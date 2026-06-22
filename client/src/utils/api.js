const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // References
  getReferences: (category) => request(`/references${category ? `?category=${category}` : ''}`),
  deleteReference: (id) => request(`/references/${id}`, { method: 'DELETE' }),
  updateReference: (id, data) => request(`/references/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  uploadReference: async (file, meta) => {
    const form = new FormData();
    form.append('image', file);
    Object.entries(meta).forEach(([k, v]) => form.append(k, v));
    const res = await fetch('/api/references/upload', { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // Generate
  generateWordmarks: (project, references) =>
    request('/generate/wordmarks', { method: 'POST', body: JSON.stringify({ project, references }) }),
  generateMascots: (project, references) =>
    request('/generate/mascots', { method: 'POST', body: JSON.stringify({ project, references }) }),
  generateBackgrounds: (project, references) =>
    request('/generate/backgrounds', { method: 'POST', body: JSON.stringify({ project, references }) }),
  generateFullBrand: (project, wordmarkUrl, mascotUrl, backgroundUrl) =>
    request('/generate/full-brand', { method: 'POST', body: JSON.stringify({ project, wordmarkUrl, mascotUrl, backgroundUrl }) }),
};
