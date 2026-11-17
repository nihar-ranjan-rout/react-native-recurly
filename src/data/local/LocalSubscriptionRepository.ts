import AsyncStorage from '@react-native-async-storage/async-storage';
import { ISubscriptionRepository } from '../repositories/ISubscriptionRepository';
import { Subscription, SubscriptionStatus } from '../../domain/subscription';
import { LocalStorageManager, STORAGE_KEYS } from './LocalStorage';

export class LocalSubscriptionRepository implements ISubscriptionRepository {
  private async ensureInit(): Promise<void> {
    await LocalStorageManager.initialize();
  }

  async getAll(): Promise<Subscription[]> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<Subscription | null> {
    const all = await this.getAll();
    return all.find((sub) => sub.id === id) || null;
  }

  async create(subscription: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const all = await this.getAll();
    const now = new Date().toISOString();
    const newSub: Subscription = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      priceHistory: subscription.priceHistory || [
        { date: now, amountPaise: subscription.amountPaise },
      ],
    };
    all.unshift(newSub);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(all));
    return newSub;
  }

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const all = await this.getAll();
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Subscription with id ${id} not found`);

    const now = new Date().toISOString();
    const existing = all[index];
    const priceChanged =
      updates.amountPaise !== undefined && updates.amountPaise !== existing.amountPaise;

    const newPriceHistory = priceChanged
      ? [
          ...(existing.priceHistory || []),
          { date: now, amountPaise: updates.amountPaise! },
        ]
      : existing.priceHistory;

    const updated: Subscription = {
      ...existing,
      ...updates,
      priceHistory: newPriceHistory,
      updatedAt: now,
    };

    all[index] = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(all));
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.getAll();
    const filtered = all.filter((s) => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(filtered));
    return true;
  }

  async setStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    return this.update(id, { status });
  }
}

