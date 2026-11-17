import { create } from 'zustand';
import { repositories, LocalStorageManager } from '../data';
import { UserProfile } from '../domain/user';
import { UserSettings } from '../domain/settings';
import { SEED_USER_PROFILE, SEED_USER_SETTINGS } from '../data/seed/seedData';

interface UserState {
  profile: UserProfile;
  settings: UserSettings;
  isLocked: boolean;
  isLoading: boolean;
  error: string | null;

  loadUser: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<UserSettings>;
  togglePrivacy: () => void;
  setAppLocked: (locked: boolean) => void;
  resetVaultToSeed: () => Promise<void>;
  clearAllVaultData: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: SEED_USER_PROFILE,
  settings: SEED_USER_SETTINGS,
  isLocked: false,
  isLoading: false,
  error: null,

  loadUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const [profile, settings] = await Promise.all([
        repositories.user.getProfile(),
        repositories.user.getSettings(),
      ]);
      set({
        profile,
        settings,
        isLocked: settings.biometricLockEnabled,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load user', isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const updated = await repositories.user.updateProfile(updates);
      set({ profile: updated });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update profile' });
      throw err;
    }
  },

  updateSettings: async (updates) => {
    try {
      const updated = await repositories.user.updateSettings(updates);
      set({ settings: updated });
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update settings' });
      throw err;
    }
  },

  togglePrivacy: () => {
    const current = get().settings.hideAmountsPrivacy;
    get().updateSettings({ hideAmountsPrivacy: !current });
  },

  setAppLocked: (locked: boolean) => {
    set({ isLocked: locked });
  },

  resetVaultToSeed: async () => {
    await LocalStorageManager.resetToSeedData();
    await get().loadUser();
  },

  clearAllVaultData: async () => {
    await LocalStorageManager.clearAll();
    await get().loadUser();
  },
}));

