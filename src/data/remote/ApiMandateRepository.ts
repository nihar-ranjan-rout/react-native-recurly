import { IMandateRepository } from '../repositories/IMandateRepository';
import { Mandate, MandateStatus } from '../../domain/mandate';

export class ApiMandateRepository implements IMandateRepository {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.EXPO_PUBLIC_API_URL || 'https://api.recurly.app/v1') {
    this.baseUrl = baseUrl;
  }

  async getAll(): Promise<Mandate[]> {
    throw new Error('ApiMandateRepository not configured.');
  }

  async getBySubscriptionId(subscriptionId: string): Promise<Mandate | null> {
    throw new Error(`ApiMandateRepository.getBySubscriptionId(${subscriptionId}) not implemented.`);
  }

  async create(mandate: Omit<Mandate, 'id'>): Promise<Mandate> {
    throw new Error('ApiMandateRepository.create not implemented.');
  }

  async updateStatus(id: string, status: MandateStatus): Promise<Mandate> {
    throw new Error(`ApiMandateRepository.updateStatus(${id}) not implemented.`);
  }
}

