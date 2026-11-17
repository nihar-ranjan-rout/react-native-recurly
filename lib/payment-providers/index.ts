import { CashfreeProvider } from "./cashfree";
import { PayUProvider } from "./payu";
import { RazorpayProvider } from "./razorpay";
import {
  CreateMandateParams,
  CreateOrderParams,
  MandateResult,
  PaymentOrderResult,
  PaymentProvider,
  PaymentVerificationResult,
  ProviderConfig,
  ProviderId,
  VerifyPaymentParams,
} from "./types";

/**
 * Local Manual Tracking Provider
 * Default fallback provider when no live third-party gateway API keys are supplied.
 * Transparently informs users that Recurly operates in local tracking mode without
 * pretending to execute real bank charges.
 */
class ManualTrackingProvider implements PaymentProvider {
  readonly id = "manual";
  readonly name = "Recurly Local Financial Tracker";

  getConfig(): ProviderConfig {
    return {
      providerId: "manual",
      displayName: "Local Financial Tracking (No Gateway Active)",
      isConfigured: true,
      isSandbox: true,
      currency: "INR",
      features: {
        upiAutoPay: true,
        cardMandates: true,
        webhooks: false,
        instantRefunds: false,
      },
    };
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    return {
      orderId: `ord_local_${Date.now()}`,
      amount: params.amount,
      currency: "INR",
      provider: "manual",
      status: "created",
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    // In manual mode, payments are confirmed by user manual entry
    return {
      isVerified: true,
      status: "SUCCESS",
      paymentReference: params.paymentId || `REF-${Date.now()}`,
    };
  }

  async createMandate(params: CreateMandateParams): Promise<MandateResult> {
    const timestamp = Date.now().toString().slice(-6);
    return {
      mandateId: `mnd_local_${Date.now()}`,
      mandateRefId: `UMN-${new Date().getFullYear()}-${timestamp}`,
      status: "ACTIVE",
    };
  }

  validateWebhookSignature(): boolean {
    return true;
  }
}

// Provider Singleton Registry
const razorpay = new RazorpayProvider();
const cashfree = new CashfreeProvider();
const payu = new PayUProvider();
const manual = new ManualTrackingProvider();

export const PROVIDERS: Record<ProviderId, PaymentProvider> = {
  razorpay,
  cashfree,
  payu,
  manual,
};

/**
 * Resolves the primary active payment provider based on configuration.
 * If live credentials exist for Razorpay, Cashfree, or PayU, selects it.
 * Otherwise, falls back to the fully safe Manual Financial Tracker.
 */
export const getActivePaymentProvider = (preferred?: ProviderId): PaymentProvider => {
  if (preferred && PROVIDERS[preferred]) {
    const p = PROVIDERS[preferred];
    if (p.getConfig().isConfigured) return p;
  }

  if (razorpay.getConfig().isConfigured) return razorpay;
  if (cashfree.getConfig().isConfigured) return cashfree;
  if (payu.getConfig().isConfigured) return payu;

  return manual;
};

/**
 * Webhook signature verification router
 */
export const verifyProviderWebhook = (
  providerId: ProviderId,
  rawBody: string,
  signature: string,
  secret: string
): boolean => {
  const provider = PROVIDERS[providerId] || manual;
  return provider.validateWebhookSignature(rawBody, signature, secret);
};

// Memory cache for recent idempotency keys to prevent duplicate transaction creation
const processedIdempotencyKeys = new Set<string>();

export const registerIdempotencyKey = (key: string): boolean => {
  if (!key) return true;
  if (processedIdempotencyKeys.has(key)) {
    return false; // Duplicate found!
  }
  processedIdempotencyKeys.add(key);
  // Auto-prune cache over 500 keys
  if (processedIdempotencyKeys.size > 500) {
    const oldest = Array.from(processedIdempotencyKeys).slice(0, 100);
    oldest.forEach((k) => processedIdempotencyKeys.delete(k));
  }
  return true;
};

export * from "./types";
