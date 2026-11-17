/**
 * Indian Payment Gateway Provider Contracts
 * Supports Razorpay, Cashfree Payments, PayU, and Local Manual Tracking.
 */

export type ProviderId = "razorpay" | "cashfree" | "payu" | "manual";

export interface ProviderConfig {
  providerId: ProviderId;
  displayName: string;
  isConfigured: boolean;
  isSandbox: boolean;
  currency: "INR";
  features: {
    upiAutoPay: boolean;
    cardMandates: boolean;
    webhooks: boolean;
    instantRefunds: boolean;
  };
}

export interface CreateOrderParams {
  amount: number; // in INR
  currency: string;
  subscriptionId: string;
  subscriptionName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: ProviderId;
  providerOrderId?: string;
  paymentSessionId?: string;
  status: "created" | "failed" | "not_configured";
  errorMessage?: string;
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature?: string;
  provider: ProviderId;
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  status: "SUCCESS" | "FAILED" | "PENDING";
  paymentReference?: string;
  failureReason?: string;
}

export interface CreateMandateParams {
  subscriptionId: string;
  subscriptionName: string;
  maxAmount: number;
  frequency: string;
  vpa?: string;
  customerEmail: string;
}

export interface MandateResult {
  mandateId: string;
  mandateRefId: string; // UMN
  status: "ACTIVE" | "PENDING" | "FAILED" | "NOT_CONFIGURED";
  authUrl?: string;
  errorMessage?: string;
}

export interface WebhookPayload {
  event: string;
  payload: any;
  signature: string;
  timestamp: string;
}

export interface PaymentProvider {
  readonly id: ProviderId;
  readonly name: string;
  getConfig(): ProviderConfig;
  createOrder(params: CreateOrderParams): Promise<PaymentOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  createMandate(params: CreateMandateParams): Promise<MandateResult>;
  validateWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
}
