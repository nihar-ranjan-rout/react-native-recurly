import { Subscription } from '../domain/subscription';
import { getDueStatus } from './renewal';
import { formatPaise } from './currency';
import { computeAnalytics } from './analytics';

export interface WidgetUpcomingItem {
  id: string;
  name: string;
  category: string;
  formattedAmount: string;
  amountPaise: number;
  renewalDateISO: string;
  dueLabel: string;
  isOverdue: boolean;
  isDueToday: boolean;
  hasAutoPay: boolean;
}

export interface RecurlyWidgetPayload {
  lastUpdated: string;
  monthlyTotalFormatted: string;
  yearlyTotalFormatted: string;
  activeCount: number;
  dueIn14DaysCount: number;
  upcomingItems: WidgetUpcomingItem[];
  topCategories: Array<{ name: string; percentage: number; color: string }>;
}

/**
 * Headless selector for iOS WidgetKit / Android AppWidgets
 * Exports a compact, serialized payload ready for native widget timelines.
 */
export function selectWidgetData(subscriptions: Subscription[], currency = 'INR'): RecurlyWidgetPayload {
  const analytics = computeAnalytics(subscriptions);
  const activeSubs = subscriptions.filter((s) => s.status === 'active');

  const upcomingItems: WidgetUpcomingItem[] = activeSubs
    .map((s) => {
      const due = getDueStatus(s.nextRenewalDate);
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        formattedAmount: formatPaise(s.amountPaise, currency as any),
        amountPaise: s.amountPaise,
        renewalDateISO: s.nextRenewalDate,
        dueLabel: due.label,
        isOverdue: due.status === 'overdue',
        isDueToday: due.status === 'due-today',
        hasAutoPay: s.hasAutoPay,
      };
    })
    .sort((a, b) => new Date(a.renewalDateISO).getTime() - new Date(b.renewalDateISO).getTime())
    .slice(0, 4);

  return {
    lastUpdated: new Date().toISOString(),
    monthlyTotalFormatted: formatPaise(analytics.monthlyTotalPaise, currency as any),
    yearlyTotalFormatted: formatPaise(analytics.yearlyTotalPaise, currency as any),
    activeCount: analytics.activeCount,
    dueIn14DaysCount: analytics.dueIn14DaysCount,
    upcomingItems,
    topCategories: analytics.categoryBreakdown.slice(0, 3).map((c) => ({
      name: c.label,
      percentage: c.percentage,
      color: c.color,
    })),
  };
}

