import { ISubscriptionRepository } from './repositories/ISubscriptionRepository';
import { IPaymentRepository } from './repositories/IPaymentRepository';
import { IPaymentMethodRepository } from './repositories/IPaymentMethodRepository';
import { IMandateRepository } from './repositories/IMandateRepository';
import { IUserRepository } from './repositories/IUserRepository';

import { LocalSubscriptionRepository } from './local/LocalSubscriptionRepository';
import { LocalPaymentRepository } from './local/LocalPaymentRepository';
import { LocalPaymentMethodRepository } from './local/LocalPaymentMethodRepository';
import { LocalMandateRepository } from './local/LocalMandateRepository';
import { LocalUserRepository } from './local/LocalUserRepository';

import { ApiSubscriptionRepository } from './remote/ApiSubscriptionRepository';
import { ApiPaymentRepository } from './remote/ApiPaymentRepository';
import { ApiPaymentMethodRepository } from './remote/ApiPaymentMethodRepository';
import { ApiMandateRepository } from './remote/ApiMandateRepository';
import { ApiUserRepository } from './remote/ApiUserRepository';

export type DataSourceType = 'local' | 'api';

// Configurable via env var (defaults to local)
const DATA_SOURCE: DataSourceType =
  (process.env.EXPO_PUBLIC_DATA_SOURCE as DataSourceType) || 'local';

export interface Repositories {
  subscriptions: ISubscriptionRepository;
  payments: IPaymentRepository;
  paymentMethods: IPaymentMethodRepository;
  mandates: IMandateRepository;
  user: IUserRepository;
}

export function createRepositories(source: DataSourceType = DATA_SOURCE): Repositories {
  if (source === 'api') {
    return {
      subscriptions: new ApiSubscriptionRepository(),
      payments: new ApiPaymentRepository(),
      paymentMethods: new ApiPaymentMethodRepository(),
      mandates: new ApiMandateRepository(),
      user: new ApiUserRepository(),
    };
  }

  return {
    subscriptions: new LocalSubscriptionRepository(),
    payments: new LocalPaymentRepository(),
    paymentMethods: new LocalPaymentMethodRepository(),
    mandates: new LocalMandateRepository(),
    user: new LocalUserRepository(),
  };
}

export const repositories = createRepositories();

export * from './local/LocalStorage';
export * from './seed/seedData';

