// Minimal REST client for the SQLite backend
// Handles JWT storage and common API calls used by the app.

export type User = {
  id: number;
  email: string;
  display_name?: string | null;
  role?: string;
};

export type TreeSpecies = {
  id: number;
  name: string;
  description?: string | null;
  image_seedling?: string | null;
  image_sprout?: string | null;
  image_sapling?: string | null;
  image_full_tree?: string | null;
};

export type GrowthStage = 'seedling' | 'sprout' | 'sapling' | 'full_tree';

export type Tree = {
  id: number;
  user_id?: number | null; // sqlite schema might be evolving; keep optional
  species_id: number;
  planted_at?: string | null;
  health?: string | null;
  growth_stage: GrowthStage;
  growth_points?: number | null;
  last_evaluation?: string | null;
  last_user_activity?: string | null;
  target_water?: number | null;
  target_sunlight?: number | null;
  target_feed?: number | null;
  target_love?: number | null;
  tree_species?: TreeSpecies | null;
};

export type RandomEvent = {
  id: number;
  name: string;
  description: string;
  emoji?: string | null;
  health_impact?: string | null;
  water_modifier?: number | null;
  sunlight_modifier?: number | null;
  feed_modifier?: number | null;
  love_modifier?: number | null;
};

export type TreeEvent = {
  id: number;
  tree_id: number;
  created_at: number; // epoch seconds
  event_type?: string | null; // sqlite variant
  description?: string | null;
  metadata?: string | null;
  // extended fields when joining random_events-like data
  random_event?: RandomEvent | null;
  water_change?: number | null;
  sunlight_change?: number | null;
  feed_change?: number | null;
  love_change?: number | null;
  point_change?: number | null;
  occurred_at?: string | null;
};

const TOKEN_KEY = 'tt_token';
const USER_KEY = 'tt_user';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function setUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  async register(email: string, password: string, display_name?: string) {
    const res = await request<{ user: User; access_token: string; starter_tree?: Tree }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, display_name }) }
    );
    setToken(res.access_token);
    setUser(res.user);
    return res;
  },

  async login(email: string, password: string) {
    const res = await request<{ user: User; access_token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(res.access_token);
    setUser(res.user);
    return res;
  },

  async logout() {
    setToken(null);
    setUser(null);
  },

  async getMyTree(): Promise<Tree | null> {
    // backend endpoint to implement; fallback to filtering all trees by current user
    try {
      return await request<Tree>('/api/my-tree');
    } catch {
      const me = getCurrentUser();
      if (!me) return null;
      const rows = await request<Tree[]>('/api/trees');
      const mine = rows.find((t) => (t as any).user_id === me.id || (t as any).owner === me.email || (t as any).owner === String(me.id));
      if (!mine) return null;
      // fetch species join if possible
      const species = await request<TreeSpecies[]>('/api/tree_species');
      const sp = species.find((s) => s.id === mine.species_id) || null;
      return { ...mine, tree_species: sp } as Tree;
    }
  },

  async postCare(action: 'water' | 'sunlight' | 'feed' | 'love', treeId?: number) {
    if (!treeId) {
      const tree = await this.getMyTree();
      if (!tree) throw new Error('No tree found');
      treeId = tree.id;
    }
    return request('/api/care', { method: 'POST', body: JSON.stringify({ tree_id: treeId, action }) });
  },

  async evaluate() {
    return request('/api/evaluate', { method: 'POST' });
  },

  async getTreeEvents(treeId: number, limit = 10): Promise<TreeEvent[]> {
    const rows = await request<TreeEvent[]>(`/api/tree-events?tree_id=${encodeURIComponent(String(treeId))}&limit=${limit}`);
    return rows;
  },

  async getCurrentEvent(treeId: number): Promise<TreeEvent | null> {
    return request<TreeEvent | null>(`/api/current-event?tree_id=${encodeURIComponent(String(treeId))}`);
  },

  async updateUserActivity() {
    return request('/api/user-activity', { method: 'POST' });
  },

  async getSpeciesParams(speciesId: number) {
    return request<Record<string, number | string>>(`/api/species/${speciesId}/params`);
  },

  async updateSpeciesParams(speciesId: number, payload: Record<string, number | string>) {
    return request<Record<string, number | string>>(`/api/species/${speciesId}/params`, { method: 'PUT', body: JSON.stringify(payload) });
  },

  async getRoundProgress(treeId?: number) {
    const q = treeId ? `?tree_id=${encodeURIComponent(String(treeId))}` : '';
    return request<{ tree_id: number; counts: any; targets: any; potential_points: number; last_evaluation: number|null }>(`/api/round-progress${q}`);
  },
};

export const session = {
  getToken,
  getUser: getCurrentUser,
};
