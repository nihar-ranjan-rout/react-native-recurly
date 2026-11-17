import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  differenceInCalendarDays,
  isBefore,
  isToday,
  startOfDay,
  setMonth,
  setDate,
  getDaysInMonth,
} from 'date-fns';
import { BillingCycle } from '../domain/subscription';

export interface DueStatus {
  status: 'overdue' | 'due-today' | 'due-soon' | 'future';
  daysDiff: number;
  label: string;
}

/**
 * Normalizes subscription amount to monthly equivalent paise.
 * Quarterly / 3, Yearly / 12, Weekly * 52 / 12, Half-Yearly / 6.
 */
export function normalizeToMonthlyPaise(amountPaise: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly':
      return Math.round((amountPaise * 52) / 12);
    case 'monthly':
      return amountPaise;
    case 'quarterly':
      return Math.round(amountPaise / 3);
    case 'half-yearly':
      return Math.round(amountPaise / 6);
    case 'yearly':
      return Math.round(amountPaise / 12);
    case 'custom':
    default:
      return amountPaise;
  }
}

/**
 * Calculates the next renewal date with month-end clamp edge cases
 * (e.g. Jan 31 + 1 month -> Feb 28 or 29, not March 3).
 */
export function calculateNextRenewal(currentDate: Date, cycle: BillingCycle): Date {
  const day = currentDate.getDate();

  switch (cycle) {
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'monthly': {
      const targetMonthDate = addMonths(currentDate, 1);
      const maxDaysInTargetMonth = getDaysInMonth(targetMonthDate);
      const safeDay = Math.min(day, maxDaysInTargetMonth);
      return setDate(targetMonthDate, safeDay);
    }
    case 'quarterly': {
      const targetMonthDate = addMonths(currentDate, 3);
      const maxDays = getDaysInMonth(targetMonthDate);
      return setDate(targetMonthDate, Math.min(day, maxDays));
    }
    case 'half-yearly': {
      const targetMonthDate = addMonths(currentDate, 6);
      const maxDays = getDaysInMonth(targetMonthDate);
      return setDate(targetMonthDate, Math.min(day, maxDays));
    }
    case 'yearly': {
      return addYears(currentDate, 1);
    }
    case 'custom':
    default:
      return addMonths(currentDate, 1);
  }
}

/**
 * Determines whether a subscription is overdue, due today, or upcoming in Nd.
 */
export function getDueStatus(renewalDate: Date | string, baseDate: Date = new Date()): DueStatus {
  const target = startOfDay(typeof renewalDate === 'string' ? new Date(renewalDate) : renewalDate);
  const now = startOfDay(baseDate);

  const daysDiff = differenceInCalendarDays(target, now);

  if (daysDiff === 0) {
    return {
      status: 'due-today',
      daysDiff: 0,
      label: 'Due today',
    };
  }

  if (daysDiff < 0) {
    const overdueDays = Math.abs(daysDiff);
    return {
      status: 'overdue',
      daysDiff,
      label: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
    };
  }

  if (daysDiff <= 14) {
    return {
      status: 'due-soon',
      daysDiff,
      label: daysDiff === 1 ? 'Due tomorrow' : `Due in ${daysDiff} days`,
    };
  }

  return {
    status: 'future',
    daysDiff,
    label: `Due in ${daysDiff} days`,
  };
}

/**
 * Checks if renewal date is in the past and automatically computes next future renewal date.
 */
export function advanceToNextActiveRenewal(renewalDate: Date, cycle: BillingCycle, now: Date = new Date()): Date {
  let nextDate = new Date(renewalDate);
  const today = startOfDay(now);

  while (isBefore(startOfDay(nextDate), today)) {
    nextDate = calculateNextRenewal(nextDate, cycle);
  }
  return nextDate;
}

