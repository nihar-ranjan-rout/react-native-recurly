import { UserProfile } from '../../domain/user';
import { UserSettings } from '../../domain/settings';

export interface IUserRepository {
  getProfile(): Promise<UserProfile>;
  updateProfile(updates: Partial<UserProfile>): Promise<UserProfile>;
  getSettings(): Promise<UserSettings>;
  updateSettings(updates: Partial<UserSettings>): Promise<UserSettings>;
}

