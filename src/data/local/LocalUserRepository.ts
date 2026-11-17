import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUserRepository } from '../repositories/IUserRepository';
import { UserProfile } from '../../domain/user';
import { UserSettings } from '../../domain/settings';
import { LocalStorageManager, STORAGE_KEYS } from './LocalStorage';
import { SEED_USER_PROFILE, SEED_USER_SETTINGS } from '../seed/seedData';

export class LocalUserRepository implements IUserRepository {
  private async ensureInit(): Promise<void> {
    await LocalStorageManager.initialize();
  }

  async getProfile(): Promise<UserProfile> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!data) return SEED_USER_PROFILE;
    try {
      return JSON.parse(data);
    } catch {
      return SEED_USER_PROFILE;
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
    return updated;
  }

  async getSettings(): Promise<UserSettings> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!data) return SEED_USER_SETTINGS;
    try {
      return JSON.parse(data);
    } catch {
      return SEED_USER_SETTINGS;
    }
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(updated));
    return updated;
  }
}

