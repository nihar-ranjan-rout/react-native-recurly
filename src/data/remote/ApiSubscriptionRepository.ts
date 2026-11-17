import { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import { Subscription, SubscriptionStatus } from '../../domain/subscription';

export class ApiSubscriptionRepository implements ISubscriptionRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.recurly.app/v1') {
    this.baseUrl = baseUrl;
  }

  async getAll(): Promise<Subscription[]> {
    throw new Error('ApiSubscriptionRepository not configured. Connect remote backend API endpoint.');
  }

  async getById(id: string): Promise<Subscription | null> {
    throw new Error(`ApiSubscriptionRepository.getById(${id}) not implemented.`);
  }

  async create(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    throw new Error('ApiSubscriptionRepository.create not implemented.');
  }

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    throw new Error(`ApiSubscriptionRepository.update(${id}) not implemented.`);
  }

  async delete(id: string): Promise<boolean> {
    throw new Error(`ApiSubscriptionRepository.delete(${id}) not implemented.`);
  }

  async setStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    throw new Error(`ApiSubscriptionRepository.setStatus(${id}) not implemented.`);
  }
}

