/**
 * INDIAN CURRENCY, NUMBER FORMATTING & LOCALIZATION ENGINE
 * Target: India (en-IN) / Asia/Kolkata (IST, UTC+05:30)
 * Compliant with Phase 2 specifications
 */

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP";

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  label: string;
  locale: string;
}

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  INR: {
    code: "INR",
    symbol: "₹",
    label: "Indian Rupee (₹)",
    locale: "en-IN",
  },
  USD: {
    code: "USD",
    symbol: "$",
    label: "US Dollar ($)",
    locale: "en-US",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    label: "Euro (€)",
    locale: "de-DE",
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    label: "British Pound (£)",
    locale: "en-GB",
  },
};

export const SYMBOL_TO_CURRENCY_CODE: Record<string, SupportedCurrency> = {
  "₹": "INR",
  INR: "INR",
  $: "USD",
  USD: "USD",
  "€": "EUR",
  EUR: "EUR",
  "£": "GBP",
  GBP: "GBP",
};

/**
 * Standard reference exchange rates against INR for visual estimates.
 * Clearly demarcates converted estimates from primary recorded amounts.
 */
export const REFERENCE_RATES_TO_INR: Record<SupportedCurrency, number> = {
  INR: 1,
  USD: 87.5, // 1 USD ~ 87.50 INR
  EUR: 92.0, // 1 EUR ~ 92.00 INR
  GBP: 110.0, // 1 GBP ~ 110.00 INR
};

/**
 * Formats a number according to the Indian number system (Lakhs and Crores).
 * Example:
 *   formatIndianNumber(1499) -> "1,499.00"
 *   formatIndianNumber(125000) -> "1,25,000.00"
 *   formatIndianNumber(10000000) -> "1,00,00,000.00"
 */
export const formatIndianNumber = (
  amount: number,
  decimalPlaces: number = 2
): string => {
  if (isNaN(amount) || !isFinite(amount)) return "0.00";

  // Prevent floating point precision artifacts
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);

  const [intPart, decPart] = absAmount.toFixed(decimalPlaces).split(".");

  if (intPart.length <= 3) {
    const formatted = `${intPart}${decPart !== undefined ? "." + decPart : ""}`;
    return isNegative ? `-${formatted}` : formatted;
  }

  // Last 3 digits
  const lastThree = intPart.substring(intPart.length - 3);
  const remaining = intPart.substring(0, intPart.length - 3);

  // Group by 2 digits for Indian numbering
  const indianGrouped = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const result = `${indianGrouped},${lastThree}${decPart !== undefined ? "." + decPart : ""}`;

  return isNegative ? `-${result}` : result;
};

/**
 * Universal Currency Formatter for the Application.
 * Automatically applies Indian number formatting when currency is INR.
 *
 * Example:
 *   formatCurrency(1499, "INR") -> "₹1,499.00"
 *   formatCurrency(22.99, "USD") -> "$22.99"
 */
export const formatCurrency = (
  amount: number,
  currencyCodeOrSymbol: string = "INR",
  options?: {
    compact?: boolean;
    includeSymbol?: boolean;
    decimalPlaces?: number;
  }
): string => {
  const { compact = false, includeSymbol = true, decimalPlaces = 2 } = options || {};

  const code: SupportedCurrency =
    SYMBOL_TO_CURRENCY_CODE[currencyCodeOrSymbol] || "INR";
  const config = CURRENCY_CONFIGS[code];
  const symbol = includeSymbol ? config.symbol : "";

  // Compact Indian notation (e.g. 1.2 Lakh, 2.5 Cr) for high metrics
  if (compact && code === "INR") {
    const abs = Math.abs(amount);
    if (abs >= 10000000) {
      return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `${symbol}${(amount / 100000).toFixed(2)} L`;
    }
    if (abs >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}k`;
    }
  }

  if (code === "INR") {
    return `${symbol}${formatIndianNumber(amount, decimalPlaces)}`;
  }

  // Western formatting for USD/EUR/GBP
  try {
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(amount);
    return `${symbol}${formatted}`;
  } catch {
    return `${symbol}${amount.toFixed(decimalPlaces)}`;
  }
};

/**
 * Converts an amount from source currency to target currency for visual budgeting estimate.
 * Preserves original recorded currency and highlights converted status.
 */
export const convertCurrencyEstimate = (
  amount: number,
  from: string,
  to: string
): { amount: number; isEstimate: boolean } => {
  const fromCode = SYMBOL_TO_CURRENCY_CODE[from] || "INR";
  const toCode = SYMBOL_TO_CURRENCY_CODE[to] || "INR";

  if (fromCode === toCode) {
    return { amount, isEstimate: false };
  }

  // Convert to INR first, then to target
  const inINR = amount * (REFERENCE_RATES_TO_INR[fromCode] || 1);
  const targetRate = REFERENCE_RATES_TO_INR[toCode] || 1;
  const converted = Math.round(((inINR / targetRate) + Number.EPSILON) * 100) / 100;

  return { amount: converted, isEstimate: true };
};

// ==============================================================================
// INDIAN DATE & TIME FORMATTING (DD/MM/YYYY, Asia/Kolkata)
// ==============================================================================

/**
 * Formats a Date or ISO string into standard Indian Date format: DD/MM/YYYY.
 * Prevents timezone shifting by parsing components directly.
 *
 * Example:
 *   formatIndianDate("2026-11-05") -> "05/11/2026"
 */
export const formatIndianDate = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";

  try {
    if (typeof dateInput === "string") {
      // YYYY-MM-DD string
      const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    // Format in Asia/Kolkata timezone
    const formatter = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return formatter.format(d);
  } catch {
    return String(dateInput);
  }
};

/**
 * Formats an Indian date with short month for prominent card headers.
 * Example: "05 Nov 2026"
 */
export const formatIndianDateWithMonth = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return "";

  try {
    if (typeof dateInput === "string") {
      const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * Formats time in Indian 12-hour format with AM/PM (Asia/Kolkata).
 * Example: "02:30 PM"
 */
export const formatIndianTime = (dateInput: string | Date = new Date()): string => {
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

// ==============================================================================
// GST (GOODS & SERVICES TAX) ENGINE
// ==============================================================================

export interface GstBreakdown {
  taxApplicable: boolean;
  taxRate: number; // e.g. 18 for 18%
  taxInclusive: boolean;
  basePrice: number;
  taxAmount: number;
  totalPrice: number;
  gstin?: string;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
}

/**
 * Computes exact GST breakdown without floating point errors.
 *
 * Tax-Inclusive:
 *   Base Price = Total Price / (1 + Rate / 100)
 *   GST Amount = Total Price - Base Price
 *
 * Tax-Exclusive:
 *   Base Price = Price entered
 *   GST Amount = Base Price * (Rate / 100)
 *   Total Price = Base Price + GST Amount
 */
export const calculateGST = (
  price: number,
  options: {
    taxApplicable?: boolean;
    taxRate?: number;
    taxInclusive?: boolean;
    gstin?: string;
  } = {}
): GstBreakdown => {
  const {
    taxApplicable = false,
    taxRate = 18.0,
    taxInclusive = true,
    gstin,
  } = options;

  if (!taxApplicable || taxRate <= 0 || price <= 0) {
    const safePrice = Math.round((price + Number.EPSILON) * 100) / 100;
    return {
      taxApplicable: false,
      taxRate: 0,
      taxInclusive: true,
      basePrice: safePrice,
      taxAmount: 0,
      totalPrice: safePrice,
      gstin,
    };
  }

  let basePrice = 0;
  let taxAmount = 0;
  let totalPrice = 0;

  if (taxInclusive) {
    // Total price is already the entered price
    totalPrice = Math.round((price + Number.EPSILON) * 100) / 100;
    basePrice = Math.round(((totalPrice / (1 + taxRate / 100)) + Number.EPSILON) * 100) / 100;
    taxAmount = Math.round(((totalPrice - basePrice) + Number.EPSILON) * 100) / 100;
  } else {
    // Entered price is base price, GST is extra
    basePrice = Math.round((price + Number.EPSILON) * 100) / 100;
    taxAmount = Math.round(((basePrice * (taxRate / 100)) + Number.EPSILON) * 100) / 100;
    totalPrice = Math.round(((basePrice + taxAmount) + Number.EPSILON) * 100) / 100;
  }

  // Intra-state split (CGST 50% + SGST 50%) for standard Indian invoices
  const halfRate = taxRate / 2;
  const halfAmount = Math.round(((taxAmount / 2) + Number.EPSILON) * 100) / 100;

  return {
    taxApplicable: true,
    taxRate,
    taxInclusive,
    basePrice,
    taxAmount,
    totalPrice,
    gstin: gstin ? gstin.trim().toUpperCase() : undefined,
    cgstRate: halfRate,
    cgstAmount: halfAmount,
    sgstRate: halfRate,
    sgstAmount: Math.round(((taxAmount - halfAmount) + Number.EPSILON) * 100) / 100,
  };
};

/**
 * Validates Indian GSTIN format (15 characters: 2-digit state code + 10-digit PAN + 1 entity + Z + 1 check digit).
 * Example: "27AAPFU0939F1ZV"
 */
export const isValidGSTIN = (gstin: string): boolean => {
  if (!gstin) return false;
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return regex.test(gstin.trim().toUpperCase());
};
