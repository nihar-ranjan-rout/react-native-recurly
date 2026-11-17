export type SupportedCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

// Base rates relative to 1 INR (e.g. 1 USD = 83.50 INR = 8350 paise)
export const EXCHANGE_RATES_PAISE_PER_UNIT: Record<SupportedCurrency, number> = {
  INR: 100, // 1 INR = 100 paise
  USD: 8350, // 1 USD = 83.50 INR
  EUR: 9020, // 1 EUR = 90.20 INR
  GBP: 10610, // 1 GBP = 106.10 INR
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Formats an integer number according to the Indian numbering system
 * (e.g. 12,34,567.89 instead of Western 1,234,567.89).
 */
export function formatIndianNumber(num: number): string {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const fixed = absNum.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  if (intPart.length <= 3) {
    return `${isNegative ? '-' : ''}${intPart}.${decPart}`;
  }

  // Last 3 digits
  const lastThree = intPart.substring(intPart.length - 3);
  // Other digits grouped in 2s
  const otherDigits = intPart.substring(0, intPart.length - 3);
  const formattedOther = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}${formattedOther},${lastThree}.${decPart}`;
}

/**
 * Formats integer paise into a formatted currency string.
 * Supports privacy mode (masks amounts).
 */
export function formatPaise(
  paise: number,
  currency: SupportedCurrency = 'INR',
  privacyMode: boolean = false
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';

  if (privacyMode) {
    return `${symbol}••••••`;
  }

  const rupeeValue = paise / 100;

  if (currency === 'INR') {
    return `${symbol}${formatIndianNumber(rupeeValue)}`;
  }

  // Western currencies (USD, EUR, GBP)
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupeeValue);

  return `${symbol}${formatted}`;
}

/**
 * Formats large amounts into compact Indian terms (e.g. ₹1.50 L, ₹2.40 Cr).
 */
export function formatCompactIndianPaise(paise: number, privacyMode = false): string {
  if (privacyMode) return '₹••••••';
  const rupees = paise / 100;

  if (rupees >= 10000000) {
    return `₹${(rupees / 10000000).toFixed(2)} Cr`;
  }
  if (rupees >= 100000) {
    return `₹${(rupees / 100000).toFixed(2)} L`;
  }
  return formatPaise(paise, 'INR');
}

/**
 * Converts paise between two currencies using the exchange rates table.
 */
export function convertCurrencyPaise(
  amountPaise: number,
  from: SupportedCurrency,
  to: SupportedCurrency
): number {
  if (from === to) return amountPaise;

  // Convert to INR paise first
  const inrPaise = from === 'INR' ? amountPaise : (amountPaise * EXCHANGE_RATES_PAISE_PER_UNIT[from]) / 100;

  // Convert from INR paise to target
  if (to === 'INR') return Math.round(inrPaise);

  const targetRate = EXCHANGE_RATES_PAISE_PER_UNIT[to];
  return Math.round((inrPaise * 100) / targetRate);
}

