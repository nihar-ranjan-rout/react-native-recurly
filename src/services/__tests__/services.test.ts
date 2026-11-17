import {
  calculateNextRenewal,
  getDueStatus,
  normalizeToMonthlyPaise,
  advanceToNextActiveRenewal,
} from '../renewal';
import { calculateGSTInclusive, calculateGSTExclusive, isValidGSTIN } from '../gst';
import {
  formatPaise,
  formatIndianNumber,
  convertCurrencyPaise,
} from '../currency';
import { computeAnalytics } from '../analytics';
import { getSeedSubscriptions } from '../../data/seed/seedData';

describe('Recurly Financial Services Test Suite', () => {
  describe('GST Calculations', () => {
    test('calculateGSTInclusive correctly extracts 18% GST', () => {
      // For ₹1,999 (199,900 paise)
      const res = calculateGSTInclusive(199900, 18);
      // Base = (199900 * 100) / 118 = 169407
      expect(res.basePaise).toBe(169407);
      expect(res.gstPaise).toBe(30493);
      expect(res.cgstPaise + res.sgstPaise).toBe(res.gstPaise);
      expect(res.basePaise + res.gstPaise).toBe(199900);
    });

    test('calculateGSTExclusive adds 18% GST to base', () => {
      const res = calculateGSTExclusive(100000, 18);
      expect(res.gstPaise).toBe(18000);
      expect(res.totalPaise).toBe(118000);
    });

    test('isValidGSTIN validates Indian GSTIN format', () => {
      expect(isValidGSTIN('29ABCDE1234F1Z5')).toBe(true);
      expect(isValidGSTIN('07AAAAA0000A1Z5')).toBe(true);
      expect(isValidGSTIN('INVALID123')).toBe(false);
      expect(isValidGSTIN('')).toBe(false);
    });
  });

  describe('Currency & Indian Numbering Formatting', () => {
    test('formatIndianNumber formats lakhs and crores correctly', () => {
      expect(formatIndianNumber(1234.56)).toBe('1,234.56');
      expect(formatIndianNumber(123456.78)).toBe('1,23,456.78');
      expect(formatIndianNumber(10000000)).toBe('1,00,00,000.00');
    });

    test('formatPaise formats paise with ₹ symbol', () => {
      expect(formatPaise(199900, 'INR')).toBe('₹1,999.00');
      expect(formatPaise(481125, 'INR')).toBe('₹4,811.25');
      expect(formatPaise(199900, 'INR', true)).toBe('₹••••••');
    });

    test('convertCurrencyPaise converts between currencies accurately', () => {
      // 10000 paise INR ($100 INR) to USD
      const inrToUsd = convertCurrencyPaise(100000, 'INR', 'USD');
      expect(inrToUsd).toBeGreaterThan(0);
      // Roundtrip
      const backToInr = convertCurrencyPaise(inrToUsd, 'USD', 'INR');
      expect(Math.abs(backToInr - 100000)).toBeLessThan(100);
    });
  });

  describe('Renewal Engine & Month-End Clamps', () => {
    test('calculateNextRenewal clamps Jan 31 to Feb 28 on non-leap year', () => {
      const jan31 = new Date(2025, 0, 31);
      const nextMonth = calculateNextRenewal(jan31, 'monthly');
      expect(nextMonth.getMonth()).toBe(1); // February
      expect(nextMonth.getDate()).toBe(28);
    });

    test('calculateNextRenewal advances quarterly correctly', () => {
      const jan15 = new Date(2026, 0, 15);
      const nextQuarter = calculateNextRenewal(jan15, 'quarterly');
      expect(nextQuarter.getMonth()).toBe(3); // April
      expect(nextQuarter.getDate()).toBe(15);
    });

    test('getDueStatus flags today as due-today and past as overdue', () => {
      const base = new Date(2026, 10, 5); // Nov 5, 2026
      const todayDue = getDueStatus(base, base);
      expect(todayDue.status).toBe('due-today');

      const pastDue = getDueStatus(new Date(2026, 10, 3), base);
      expect(pastDue.status).toBe('overdue');
      expect(pastDue.daysDiff).toBe(-2);

      const futureDue = getDueStatus(new Date(2026, 10, 8), base);
      expect(futureDue.status).toBe('due-soon');
      expect(futureDue.daysDiff).toBe(3);
    });

    test('normalizeToMonthlyPaise normalizes yearly and quarterly amounts', () => {
      // Yearly ₹6,199 / 12 = 516.58
      const yearlyNorm = normalizeToMonthlyPaise(619900, 'yearly');
      expect(yearlyNorm).toBe(51658);

      // Quarterly ₹299 / 3 = 99.67
      const qtrNorm = normalizeToMonthlyPaise(29900, 'quarterly');
      expect(qtrNorm).toBe(9967);
    });

    test('advanceToNextActiveRenewal advances past date until future', () => {
      const base = new Date(2026, 10, 5);
      const pastDate = new Date(2026, 8, 1);
      const advanced = advanceToNextActiveRenewal(pastDate, 'monthly', base);
      expect(advanced.getTime()).toBeGreaterThanOrEqual(base.getTime());
    });
  });

  describe('Analytics & Exact Seed Data Verification', () => {
    test('computes exact ₹4,811.25 monthly, ₹57,735.00 yearly, 9 active, 10 total', () => {
      const baseDate = new Date(2026, 10, 5);
      const seedSubs = getSeedSubscriptions(baseDate);
      const analytics = computeAnalytics(seedSubs, 600000, baseDate);

      // 9 active plans + 1 paused (JioCinema)
      expect(analytics.totalCount).toBe(10);
      expect(analytics.activeCount).toBe(9);

      // Monthly Total should equal ~481,125 paise (₹4,811.25)
      // Difference tolerance <= 5 paise due to integer roundings on yearly/quarterly divisions
      expect(Math.abs(analytics.monthlyTotalPaise - 481125)).toBeLessThanOrEqual(5);

      // Yearly Total is exactly monthly * 12
      expect(analytics.yearlyTotalPaise).toBe(analytics.monthlyTotalPaise * 12);

      // GST Included: ₹733.91 (73,391 paise)
      expect(Math.abs(analytics.gstTotalPaise - 73391)).toBeLessThanOrEqual(5);

      // Due soon (next 14 days): exactly 5 plans
      // (Netflix, Spotify, GitHub Copilot, YouTube Premium, Amazon Prime)
      expect(analytics.dueIn14DaysCount).toBe(5);

      // Category breakdown contains streaming, software, etc.
      expect(analytics.categoryBreakdown.length).toBeGreaterThan(0);
      const streaming = analytics.categoryBreakdown.find((c) => c.category === 'streaming');
      expect(streaming).toBeDefined();

      // Top expensive exists
      expect(analytics.topExpensive.length).toBe(5);
    });
  });
});

