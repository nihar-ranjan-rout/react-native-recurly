import AsyncStorage from '@react-native-async-storage/async-storage';
import { IMandateRepository } from '../repositories/IMandateRepository';
import { Mandate, MandateStatus } from '../../domain/mandate';
import { LocalStorageManager, STORAGE_KEYS } from './LocalStorage';

export class LocalMandateRepository implements IMandateRepository {
  private async ensureInit(): Promise<void> {
    await LocalStorageManager.initialize();
  }

  async getAll(): Promise<Mandate[]> {
    await this.ensureInit();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MANDATES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async getBySubscriptionId(subscriptionId: string): Promise<Mandate | null> {
    const all = await this.getAll();
    return all.find((m) => m.subscriptionId === subscriptionId) || null;
  }

  async create(mandate: Omit<Mandate, 'id'>): Promise<Mandate> {
    const all = await this.getAll();
    const newMandate: Mandate = {
      ...mandate,
      id: `man_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    all.push(newMandate);
    await AsyncStorage.setItem(STORAGE_KEYS.MANDATES, JSON.stringify(all));
    return newMandate;
  }

  async updateStatus(id: string, status: MandateStatus): Promise<Mandate> {
    const all = await this.getAll();
    const index = all.findIndex((m) => m.id === id);
    if (index === -1) throw new Error(`Mandate with id ${id} not found`);

    all[index].status = status;
    await AsyncStorage.setItem(STORAGE_KEYS.MANDATES, JSON.stringify(all));
    return all[index];
  }
}

