import { IUserRepository } from '../repositories/IUserRepository';
import { UserProfile } from '../../domain/user';
import { UserSettings } from '../../domain/settings';

export class ApiUserRepository implements IUserRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.recurly.app/v1') {
    this.baseUrl = baseUrl;
  }

  async getProfile(): Promise<UserProfile> {
    throw new Error('ApiUserRepository not configured.');
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    throw new Error('ApiUserRepository.updateProfile not implemented.');
  }

  async getSettings(): Promise<UserSettings> {
    throw new Error('ApiUserRepository not configured.');
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
    throw new Error('ApiUserRepository.updateSettings not implemented.');
  }
}

