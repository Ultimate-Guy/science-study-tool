// Minimal Supabase-compatible stub for offline homepage loading.
// This file exists to avoid blocked external CDN dependencies.
window.supabase = {
  createClient: function () {
    const errorResult = () => ({ data: null, error: new Error('Supabase unavailable offline') });
    const queryProxy = {
      select: async function () { return errorResult(); },
      insert: async function () { return errorResult(); },
      update: async function () { return errorResult(); },
      delete: async function () { return errorResult(); },
      eq: function () { return this; },
      single: async function () { return errorResult(); },
    };

    return {
      auth: {
        signUp: async function () { return errorResult(); },
        signInWithPassword: async function () { return errorResult(); },
        signOut: async function () { return errorResult(); },
        getUser: async function () { return { data: { user: null }, error: new Error('Supabase unavailable offline') }; },
        onAuthStateChange: function () { return { data: null, error: new Error('Supabase unavailable offline') }; },
      },
      from: function () {
        return queryProxy;
      },
    };
  },
};
