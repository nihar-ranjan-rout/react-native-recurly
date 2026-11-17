import { Mandate, MandateStatus } from '../../domain/mandate';

export interface IMandateRepository {
  getAll(): Promise<Mandate[]>;
  getBySubscriptionId(subscriptionId: string): Promise<Mandate | null>;
  create(mandate: Omit<Mandate, 'id'>): Promise<Mandate>;
  updateStatus(id: string, status: MandateStatus): Promise<Mandate>;
}

