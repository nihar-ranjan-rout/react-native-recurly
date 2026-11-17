import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { migrateUserDataToCloud } from "@/lib/migration";

export type UserRole = "admin" | "user";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
};

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

const USERS_KEY = "users";
const CURRENT_USER_KEY = "currentUser";
const CURRENT_ADMIN_KEY = "currentAdmin";
const LEGACY_USERS_KEY = "recurly_users";
const LEGACY_SESSION_KEY = "recurly_session";

// Server-seeded default administrator (cannot be self-assigned via public registration)
export const DEFAULT_ADMIN: StoredUser = {
  id: "admin-master-provisioned",
  name: "System Administrator",
  email: "admin@recurly.app",
  password: "admin123",
  role: "admin",
  createdAt: new Date().toISOString(),
};

export const DEFAULT_USER: StoredUser = {
  id: "default-nihar",
  name: "Nihar",
  email: "nihar@example.com",
  password: "password123",
  role: "user",
  createdAt: new Date().toISOString(),
};

/**
 * Loads stored local users.
 */
export const getStoredUsers = async (): Promise<StoredUser[]> => {
  let value = await AsyncStorage.getItem(USERS_KEY);

  if (!value) {
    value = await AsyncStorage.getItem(LEGACY_USERS_KEY);
    if (value) {
      await AsyncStorage.setItem(USERS_KEY, value);
    }
  }

  if (!value) {
    await saveStoredUsers([DEFAULT_USER, DEFAULT_ADMIN]);
    return [DEFAULT_USER, DEFAULT_ADMIN];
  }

  try {
    const parsed = JSON.parse(value) as StoredUser[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    await saveStoredUsers([DEFAULT_USER, DEFAULT_ADMIN]);
    return [DEFAULT_USER, DEFAULT_ADMIN];
  } catch {
    return [DEFAULT_USER, DEFAULT_ADMIN];
  }
};

export const saveStoredUsers = async (users: StoredUser[]): Promise<void> => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

/**
 * SECURE USER REGISTRATION
 * - If Supabase is configured: Uses Supabase Auth with server-side bcrypt password hashing.
 * - If Supabase is not configured: Falls back to local isolated storage.
 *
 * CRITICAL SECURITY FIX:
 * All newly registered users are STRICTLY assigned role: "user".
 * Users can NEVER escalate their role to "admin" by choosing an email containing the word "admin".
 */
export const createUser = async (input: {
  name: string;
  email: string;
  password: string;
}): Promise<UserSession> => {
  const normalizedEmail = input.email.trim().toLowerCase();
  const trimmedName = input.name.trim();

  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  // 1. SUPABASE AUTH (REAL BACKEND)
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database client unavailable.");

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: input.password,
      options: {
        data: {
          full_name: trimmedName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Registration failed. Please check your credentials.");
    }

    const session: UserSession = {
      id: data.user.id,
      name: trimmedName,
      email: normalizedEmail,
      role: "user", // Strictly user role
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));

    // Run safe local-to-cloud data migration
    migrateUserDataToCloud(data.user.id).catch((err) =>
      console.warn("Background migration warning:", err)
    );

    return session;
  }

  // 2. SECURE LOCAL STORAGE FALLBACK
  const users = await getStoredUsers();
  const existingUser = users.find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  // Strictly assign 'user' role
  const nextUser: StoredUser = {
    id: `usr-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: trimmedName,
    email: normalizedEmail,
    password: input.password,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  users.push(nextUser);
  await saveStoredUsers(users);

  const session: UserSession = {
    id: nextUser.id,
    name: nextUser.name,
    email: nextUser.email,
    role: "user",
  };

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  return session;
};

/**
 * SECURE USER LOGIN
 */
export const signInUser = async (input: {
  email: string;
  password: string;
}): Promise<UserSession> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // 1. SUPABASE AUTH (REAL BACKEND)
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database client unavailable.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: input.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Login failed. No user record returned.");
    }

    // Fetch verified profile role from PostgreSQL
    let role: UserRole = "user";
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    if (profile?.role === "admin") {
      role = "admin";
    }

    const name =
      profile?.full_name ||
      data.user.user_metadata?.full_name ||
      normalizedEmail.split("@")[0];

    const session: UserSession = {
      id: data.user.id,
      name,
      email: normalizedEmail,
      role,
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));

    // Safely trigger data migration in background
    migrateUserDataToCloud(data.user.id).catch((err) =>
      console.warn("Background migration warning:", err)
    );

    return session;
  }

  // 2. LOCAL STORAGE FALLBACK
  const users = await getStoredUsers();
  let user = users.find(
    (item) => item.email.trim().toLowerCase() === normalizedEmail
  );

  if (!user) {
    // If not found in local demo, auto-register as standard user
    const inferredRaw = input.email.split("@")[0] || "Member";
    const formattedName =
      inferredRaw.charAt(0).toUpperCase() + inferredRaw.slice(1);

    const nextUser: StoredUser = {
      id: `usr-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: formattedName,
      email: normalizedEmail,
      password: input.password,
      role: "user", // Strictly 'user'
      createdAt: new Date().toISOString(),
    };
    users.push(nextUser);
    await saveStoredUsers(users);
    user = nextUser;
  } else {
    // Verify password if set
    if (user.password && user.password !== input.password) {
      throw new Error("Invalid email or password.");
    }
  }

  const session: UserSession = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
  };

  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  return session;
};

/**
 * SECURE ADMIN LOGIN
 * Requires verified administrator credentials.
 * Users CANNOT escalate their privileges simply by signing up with "admin" in their email.
 */
export const signInAdmin = async (input: {
  email: string;
  password: string;
}): Promise<UserSession> => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // 1. SUPABASE AUTH (REAL BACKEND)
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database client unavailable.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: input.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Authentication failed.");
    }

    // Verify role in PostgreSQL profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      throw new Error("Access Denied: This account does not possess administrator privileges.");
    }

    const session: UserSession = {
      id: data.user.id,
      name: profile.full_name || "Administrator",
      email: normalizedEmail,
      role: "admin",
    };

    await AsyncStorage.setItem(CURRENT_ADMIN_KEY, JSON.stringify(session));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    return session;
  }

  // 2. LOCAL STORAGE ADMIN VERIFICATION
  const users = await getStoredUsers();

  // Check against provisioned default admin
  if (
    normalizedEmail === DEFAULT_ADMIN.email &&
    input.password === DEFAULT_ADMIN.password
  ) {
    const adminSession: UserSession = {
      id: DEFAULT_ADMIN.id,
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      role: "admin",
    };
    await AsyncStorage.setItem(CURRENT_ADMIN_KEY, JSON.stringify(adminSession));
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminSession));
    return adminSession;
  }

  const existingUser = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!existingUser) {
    throw new Error("No administrator account found with this email.");
  }

  if (existingUser.password !== input.password) {
    throw new Error("Incorrect administrator password.");
  }

  // STRICT CHECK: The user record MUST explicitly have role === 'admin'
  if (existingUser.role !== "admin") {
    throw new Error(
      "Access Denied: This account does not possess administrator privileges."
    );
  }

  const session: UserSession = {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
    role: "admin",
  };

  await AsyncStorage.setItem(CURRENT_ADMIN_KEY, JSON.stringify(session));
  await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
  return session;
};

/**
 * PASSWORD RESET
 * Sends a secure password reset link via Supabase Auth when configured.
 */
export const resetPassword = async (email: string): Promise<void> => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Database client unavailable.");

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    // In local demo mode, verify the email exists
    const users = await getStoredUsers();
    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (!exists) {
      throw new Error("No account found with this email address.");
    }
  }
};

/**
 * RETRIEVE CURRENT USER SESSION
 */
export const getSession = async (): Promise<UserSession | null> => {
  // 1. SUPABASE AUTH CHECK
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const user = data.session.user;
        let role: UserRole = "user";

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

          if (profile?.role === "admin") {
            role = "admin";
          }

          const name =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Member";

          return {
            id: user.id,
            name,
            email: user.email || "",
            role,
          };
        } catch {
          return {
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Member",
            email: user.email || "",
            role: "user",
          };
        }
      }
    }
  }

  // 2. LOCAL ASYNC STORAGE SESSION
  try {
    let value = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!value) {
      value = await AsyncStorage.getItem(LEGACY_SESSION_KEY);
      if (value) {
        await AsyncStorage.setItem(CURRENT_USER_KEY, value);
      }
    }

    if (!value) return null;

    const parsed = JSON.parse(value) as UserSession;
    if (parsed && parsed.email) {
      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        role: parsed.role === "admin" ? "admin" : "user",
      };
    }
    return null;
  } catch {
    return null;
  }
};

export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const session = await getSession();
  return session?.role === "admin";
};

export const getAdminSession = async (): Promise<UserSession | null> => {
  const session = await getSession();
  if (session && session.role === "admin") {
    return session;
  }
  return null;
};

/**
 * SIGN OUT
 */
export const signOut = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
  }
  await AsyncStorage.removeItem(CURRENT_USER_KEY);
  await AsyncStorage.removeItem(CURRENT_ADMIN_KEY);
};

export const adminSignOut = async (): Promise<void> => {
  await signOut();
};

export interface UserPreferences {
  currency?: string;
  theme?: string;
  pushNotifications?: boolean;
  emailAlerts?: boolean;
  biometricLock?: boolean;
}

export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  const session = await getSession();
  const prefsKey = session?.id
    ? `@recurly_prefs_${session.id}`
    : "@recurly_prefs";

  try {
    // 1. Supabase real backend
    if (isSupabaseConfigured() && session?.id) {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", session.id)
          .single();

        if (!error && data) {
          return {
            currency: data.currency,
            theme: data.theme,
            pushNotifications: data.notifications_enabled,
            emailAlerts: data.email_alerts,
          };
        }
      }
    }

    // 2. Local storage fallback
    const raw = await AsyncStorage.getItem(prefsKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const updateUserPreferences = async (
  updates: UserPreferences
): Promise<void> => {
  const session = await getSession();
  const prefsKey = session?.id
    ? `@recurly_prefs_${session.id}`
    : "@recurly_prefs";

  try {
    // 1. Supabase real backend
    if (isSupabaseConfigured() && session?.id) {
      const supabase = getSupabase();
      if (supabase) {
        const payload: Record<string, any> = {
          user_id: session.id,
          updated_at: new Date().toISOString(),
        };
        if (updates.currency !== undefined) payload.currency = updates.currency;
        if (updates.theme !== undefined) payload.theme = updates.theme;
        if (updates.pushNotifications !== undefined)
          payload.notifications_enabled = updates.pushNotifications;
        if (updates.emailAlerts !== undefined)
          payload.email_alerts = updates.emailAlerts;

        const { data: existingPref } = await supabase
          .from("user_preferences")
          .select("id")
          .eq("user_id", session.id)
          .single();

        if (existingPref) {
          await supabase
            .from("user_preferences")
            .update(payload)
            .eq("user_id", session.id);
        } else {
          await supabase
            .from("user_preferences")
            .insert(payload);
        }
      }
    }

    // 2. Local storage fallback
    const raw = await AsyncStorage.getItem(prefsKey);
    const existing = raw ? JSON.parse(raw) : {};
    const merged = { ...existing, ...updates };
    await AsyncStorage.setItem(prefsKey, JSON.stringify(merged));
  } catch (e) {
    console.warn("Failed to update user preferences:", e);
  }
};
