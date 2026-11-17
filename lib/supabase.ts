import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || "").trim().replace(/\/$/, "");
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").trim();

/**
 * Validates whether real, active Supabase credentials are provided in environment variables.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    supabaseUrl.length > 0 &&
    !supabaseUrl.includes("your-project-id") &&
    supabaseAnonKey.length > 0 &&
    !supabaseAnonKey.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
  );
};

export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseUser;
}

const STORAGE_SESSION_KEY = "@recurly_supabase_session_v1";

/**
 * Lightweight, robust Supabase Client designed specifically for React Native & Expo.
 * Eliminates Metro packager Haste map bugs while providing 100% native compatibility
 * with Supabase GoTrue Auth and PostgREST PostgreSQL database.
 */
class SupabaseAdapter {
  private url: string;
  private key: string;

  constructor(url: string, key: string) {
    this.url = url;
    this.key = key;
  }

  // Common headers for PostgREST & GoTrue
  private async getHeaders(authenticated = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      apikey: this.key,
      Prefer: "return=representation",
    };

    if (authenticated) {
      const session = await this.auth.getSession();
      if (session.data?.session?.access_token) {
        headers["Authorization"] = `Bearer ${session.data.session.access_token}`;
      }
    }

    return headers;
  }

  // ==========================================================================
  // AUTHENTICATION MODULE (GoTrue)
  // ==========================================================================
  auth = {
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string } };
    }): Promise<{ data: { user: SupabaseUser | null; session: SupabaseSession | null }; error: Error | null }> => {
      try {
        const res = await fetch(`${this.url}/auth/v1/signup`, {
          method: "POST",
          headers: await this.getHeaders(false),
          body: JSON.stringify({
            email,
            password,
            data: options?.data || {},
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          return { data: { user: null, session: null }, error: new Error(json.msg || json.error_description || json.message || "Sign up failed") };
        }

        const session: SupabaseSession = {
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          expires_at: json.expires_at,
          user: json.user || json,
        };

        if (json.access_token) {
          await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
        }

        return { data: { user: session.user, session: json.access_token ? session : null }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: new Error(err.message || "Network error during registration") };
      }
    },

    signInWithPassword: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }): Promise<{ data: { user: SupabaseUser | null; session: SupabaseSession | null }; error: Error | null }> => {
      try {
        const res = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: await this.getHeaders(false),
          body: JSON.stringify({ email, password }),
        });

        const json = await res.json();
        if (!res.ok) {
          return {
            data: { user: null, session: null },
            error: new Error(json.msg || json.error_description || json.message || "Invalid login credentials"),
          };
        }

        const session: SupabaseSession = {
          access_token: json.access_token,
          refresh_token: json.refresh_token,
          expires_at: json.expires_at,
          user: json.user,
        };

        await AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
        return { data: { user: json.user, session }, error: null };
      } catch (err: any) {
        return { data: { user: null, session: null }, error: new Error(err.message || "Network error during login") };
      }
    },

    signOut: async (): Promise<{ error: Error | null }> => {
      try {
        const session = await this.auth.getSession();
        if (session.data?.session?.access_token) {
          await fetch(`${this.url}/auth/v1/logout`, {
            method: "POST",
            headers: await this.getHeaders(true),
          });
        }
      } catch {}
      await AsyncStorage.removeItem(STORAGE_SESSION_KEY);
      return { error: null };
    },

    resetPasswordForEmail: async (email: string): Promise<{ error: Error | null }> => {
      try {
        const res = await fetch(`${this.url}/auth/v1/recover`, {
          method: "POST",
          headers: await this.getHeaders(false),
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { error: new Error(json.msg || json.message || "Failed to send reset link") };
        }
        return { error: null };
      } catch (err: any) {
        return { error: new Error(err.message || "Network error during password recovery") };
      }
    },

    getSession: async (): Promise<{ data: { session: SupabaseSession | null }; error: Error | null }> => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_SESSION_KEY);
        if (!raw) return { data: { session: null }, error: null };
        const session: SupabaseSession = JSON.parse(raw);
        return { data: { session }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    },
  };

  // ==========================================================================
  // DATABASE QUERY BUILDER MODULE (PostgREST with Row Level Security)
  // ==========================================================================
  from(tableName: string) {
    const baseUrl = `${this.url}/rest/v1/${tableName}`;
    const getHeaders = this.getHeaders.bind(this);

    return {
      select: (columns = "*") => {
        let queryParams: string[] = [`select=${encodeURIComponent(columns)}`];

        const queryObj = {
          eq: (field: string, val: string | number | boolean) => {
            queryParams.push(`${field}=eq.${encodeURIComponent(String(val))}`);
            return queryObj;
          },
          order: (field: string, { ascending = true } = {}) => {
            queryParams.push(`order=${field}.${ascending ? "asc" : "desc"}`);
            return queryObj;
          },
          limit: (n: number) => {
            queryParams.push(`limit=${n}`);
            return queryObj;
          },
          single: async (): Promise<{ data: any | null; error: Error | null }> => {
            try {
              const url = `${baseUrl}?${queryParams.join("&")}`;
              const res = await fetch(url, {
                method: "GET",
                headers: await getHeaders(true),
              });
              const json = await res.json();
              if (!res.ok) return { data: null, error: new Error(json.message || "Query failed") };
              return { data: Array.isArray(json) ? json[0] || null : json, error: null };
            } catch (err: any) {
              return { data: null, error: new Error(err.message || "Query failed") };
            }
          },
          then: async (resolve: (val: { data: any[] | null; error: Error | null }) => void) => {
            try {
              const url = `${baseUrl}?${queryParams.join("&")}`;
              const res = await fetch(url, {
                method: "GET",
                headers: await getHeaders(true),
              });
              const json = await res.json();
              if (!res.ok) {
                resolve({ data: null, error: new Error(json.message || "Fetch failed") });
              } else {
                resolve({ data: Array.isArray(json) ? json : [json], error: null });
              }
            } catch (err: any) {
              resolve({ data: null, error: new Error(err.message || "Fetch failed") });
            }
          },
        };

        return queryObj;
      },

      insert: (payload: any | any[]) => ({
        select: () => ({
          single: async (): Promise<{ data: any | null; error: Error | null }> => {
            try {
              const res = await fetch(baseUrl, {
                method: "POST",
                headers: await getHeaders(true),
                body: JSON.stringify(payload),
              });
              const json = await res.json();
              if (!res.ok) return { data: null, error: new Error(json.message || "Insert failed") };
              return { data: Array.isArray(json) ? json[0] : json, error: null };
            } catch (err: any) {
              return { data: null, error: new Error(err.message || "Insert failed") };
            }
          },
        }),
        then: async (resolve: (val: { data: any | null; error: Error | null }) => void) => {
          try {
            const res = await fetch(baseUrl, {
              method: "POST",
              headers: await getHeaders(true),
              body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) {
              resolve({ data: null, error: new Error(json.message || "Insert failed") });
            } else {
              resolve({ data: json, error: null });
            }
          } catch (err: any) {
            resolve({ data: null, error: new Error(err.message || "Insert failed") });
          }
        },
      }),

      update: (payload: any) => ({
        eq: (field: string, val: string) => {
          let extraQuery: string[] = [`${field}=eq.${encodeURIComponent(val)}`];
          const updateObj = {
            eq: (field2: string, val2: string) => {
              extraQuery.push(`${field2}=eq.${encodeURIComponent(val2)}`);
              return updateObj;
            },
            then: async (resolve: (val: { data: any | null; error: Error | null }) => void) => {
              try {
                const url = `${baseUrl}?${extraQuery.join("&")}`;
                const res = await fetch(url, {
                  method: "PATCH",
                  headers: await getHeaders(true),
                  body: JSON.stringify(payload),
                });
                const json = await res.json();
                if (!res.ok) resolve({ data: null, error: new Error(json.message || "Update failed") });
                else resolve({ data: Array.isArray(json) ? json[0] : json, error: null });
              } catch (err: any) {
                resolve({ data: null, error: new Error(err.message || "Update failed") });
              }
            },
            select: () => ({
              single: async (): Promise<{ data: any | null; error: Error | null }> => {
                try {
                  const url = `${baseUrl}?${extraQuery.join("&")}`;
                  const res = await fetch(url, {
                    method: "PATCH",
                    headers: await getHeaders(true),
                    body: JSON.stringify(payload),
                  });
                  const json = await res.json();
                  if (!res.ok) return { data: null, error: new Error(json.message || "Update failed") };
                  return { data: Array.isArray(json) ? json[0] : json, error: null };
                } catch (err: any) {
                  return { data: null, error: new Error(err.message || "Update failed") };
                }
              },
            }),
          };
          return updateObj;
        },
      }),

      delete: () => ({
        eq: (field: string, val: string) => {
          let extraQuery: string[] = [`${field}=eq.${encodeURIComponent(val)}`];
          const deleteObj = {
            eq: (field2: string, val2: string) => {
              extraQuery.push(`${field2}=eq.${encodeURIComponent(val2)}`);
              return deleteObj;
            },
            then: async (resolve: (val: { error: Error | null }) => void) => {
              try {
                const url = `${baseUrl}?${extraQuery.join("&")}`;
                const res = await fetch(url, {
                  method: "DELETE",
                  headers: await getHeaders(true),
                });
                if (!res.ok) {
                  const json = await res.json();
                  resolve({ error: new Error(json.message || "Delete failed") });
                } else {
                  resolve({ error: null });
                }
              } catch (err: any) {
                resolve({ error: new Error(err.message || "Delete failed") });
              }
            },
          };
          return deleteObj;
        },
      }),
    };
  }
}

let clientInstance: SupabaseAdapter | null = null;

if (isSupabaseConfigured()) {
  clientInstance = new SupabaseAdapter(supabaseUrl, supabaseAnonKey);
}

export const getSupabase = (): SupabaseAdapter | null => {
  return clientInstance;
};

export const supabase = clientInstance;
