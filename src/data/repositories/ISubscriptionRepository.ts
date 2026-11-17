import { Subscription, SubscriptionStatus } from '../../domain/subscription';

export interface ISubscriptionRepository {
  getAll(): Promise<Subscription[]>;
  getById(id: string): Promise<Subscription | null>;
  create(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription>;
  update(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  delete(id: string): Promise<boolean>;
  setStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
}

