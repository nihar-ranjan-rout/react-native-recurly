export interface GSTBreakdown {
  basePaise: number;
  gstPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  rate: number;
}

/**
 * Calculates GST components for a tax-inclusive total in paise.
 * Base = (Total * 100) / (100 + Rate)
 * GST = Total - Base
 */
export function calculateGSTInclusive(totalPaise: number, rate = 18): GSTBreakdown {
  if (rate <= 0 || totalPaise <= 0) {
    return {
      basePaise: totalPaise,
      gstPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      rate,
    };
  }

  const basePaise = Math.round((totalPaise * 100) / (100 + rate));
  const gstPaise = totalPaise - basePaise;
  const cgstPaise = Math.floor(gstPaise / 2);
  const sgstPaise = gstPaise - cgstPaise;

  return {
    basePaise,
    gstPaise,
    cgstPaise,
    sgstPaise,
    rate,
  };
}

/**
 * Calculates GST components for a tax-exclusive base amount in paise.
 */
export function calculateGSTExclusive(basePaise: number, rate = 18): {
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  rate: number;
} {
  const gstPaise = Math.round((basePaise * rate) / 100);
  const totalPaise = basePaise + gstPaise;
  const cgstPaise = Math.floor(gstPaise / 2);
  const sgstPaise = gstPaise - cgstPaise;

  return {
    basePaise,
    gstPaise,
    totalPaise,
    cgstPaise,
    sgstPaise,
    rate,
  };
}

/**
 * Validates standard 15-character Indian Goods & Services Tax Identification Number (GSTIN).
 * Format: 2-digit state code + 10-char PAN + 1 entity num + 'Z' + 1 checksum char.
 */
export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return false;
  const clean = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(clean);
}

