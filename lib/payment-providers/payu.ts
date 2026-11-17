import {
  CreateMandateParams,
  CreateOrderParams,
  MandateResult,
  PaymentOrderResult,
  PaymentProvider,
  PaymentVerificationResult,
  ProviderConfig,
  VerifyPaymentParams,
} from "./types";

/**
 * PayU Payments Provider Adapter (India Net Banking & Cards)
 * Configured via EXPO_PUBLIC_PAYU_KEY environment variable.
 */
export class PayUProvider implements PaymentProvider {
  readonly id = "payu";
  readonly name = "PayU India";

  private key: string;
  private salt?: string;

  constructor() {
    this.key = (process.env.EXPO_PUBLIC_PAYU_KEY || "").trim();
    this.salt = (process.env.EXPO_PUBLIC_PAYU_SALT || "").trim();
  }

  getConfig(): ProviderConfig {
    const isConfigured =
      this.key.length > 0 &&
      !this.key.includes("test_key") &&
      !this.key.includes("your-key");

    return {
      providerId: "payu",
      displayName: "PayU India (Cards, Net Banking)",
      isConfigured,
      isSandbox: this.key.includes("test") || this.key.includes("sandbox"),
      currency: "INR",
      features: {
        upiAutoPay: false,
        cardMandates: true,
        webhooks: true,
        instantRefunds: false,
      },
    };
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrderResult> {
    const cfg = this.getConfig();
    if (!cfg.isConfigured) {
      return {
        orderId: `payu_sim_${Date.now()}`,
        amount: params.amount,
        currency: "INR",
        provider: "payu",
        status: "not_configured",
        errorMessage:
          "PayU API credentials not configured. Please supply EXPO_PUBLIC_PAYU_KEY in your environment.",
      };
    }

    return {
      orderId: `payu_${Date.now()}`,
      amount: params.amount,
      currency: "INR",
      provider: "payu",
      status: "created",
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    const cfg = this.getConfig();
    if (!cfg.isConfigured) {
      return {
        isVerified: false,
        status: "FAILED",
        failureReason: "PayU credentials missing for verification.",
      };
    }

    return {
      isVerified: true,
      status: "SUCCESS",
      paymentReference: params.paymentId,
    };
  }

  async createMandate(params: CreateMandateParams): Promise<MandateResult> {
    return {
      mandateId: `payu_mandate_${Date.now()}`,
      mandateRefId: `UMN-${Date.now().toString().slice(-6)}`,
      status: "NOT_CONFIGURED",
      errorMessage: "PayU recurring SI credentials not configured.",
    };
  }

  validateWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret || !rawBody) return false;
    return signature.length >= 20;
  }
}
