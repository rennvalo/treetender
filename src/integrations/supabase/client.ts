// Shim supabase client to map to local backend API for SQLite deployment.
// Provides minimal supabase-like API used by the frontend code.
const wrap = (p) => p.then(d=>({ data: d, error: null })).catch(e=>({ data: null, error: { message: e.message || String(e) }}));

function authToken() {
  return localStorage.getItem('tt_token');
}

export const supabase = {
  auth: {
    async signUp({ email, password, options }) {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: options && options.data && options.data.display_name })
      });
      const j = await res.json();
      if (j.access_token) localStorage.setItem('tt_token', j.access_token);
      return { data: { user: j.user, session: { access_token: j.access_token, user: j.user } }, error: null };
    },
    async signInWithPassword({ email, password }) {
      const res = await fetch('/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const j = await res.json();
      if (j.access_token) localStorage.setItem('tt_token', j.access_token);
      return { data: { user: j.user, session: { access_token: j.access_token, user: j.user } }, error: j.error ? j : null };
    },
    async signOut() {
      localStorage.removeItem('tt_token');
      return { error: null };
    },
    async getSession() {
      const token = authToken();
      if (!token) return { data: { session: null } };
      // decode simple payload (not verifying) to extract user info for UI; backend provides user info on login
      return { data: { session: { access_token: token, user: JSON.parse(localStorage.getItem('tt_user') || 'null') } } };
    },
    onAuthStateChange(cb) {
      // very simple: call callback immediately with stored session
      const token = authToken();
      const session = token ? { access_token: token, user: JSON.parse(localStorage.getItem('tt_user') || 'null') } : null;
      const sub = { subscription: true };
      setTimeout(()=> cb('SIGNED_IN', session), 0);
      return { data: { subscription: sub } };
    }
  },
  from(table) {
    return {
      select: async (q) => {
        const res = await fetch('/api/' + table);
        const j = await res.json();
        return { data: j, error: null };
      },
      insert: async (obj) => {
        const res = await fetch('/api/' + table, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': authToken() ? 'Bearer '+authToken() : ''}, body: JSON.stringify(obj) });
        const j = await res.json();
        return { data: j, error: j.error ? j : null };
      },
      // rudimentary rpc mapping
      rpc: async (fn, params) => {
        const res = await fetch('/api/' + fn, { method: 'POST', headers: {'Content-Type':'application/json', 'Authorization': authToken() ? 'Bearer '+authToken() : ''}, body: JSON.stringify(params || {}) });
        const j = await res.json();
        return { data: j, error: j.error ? j : null };
      }
    };
  }
};