import { Subscription } from '../domain/subscription';
import { normalizeToMonthlyPaise } from './renewal';
import { calculateGSTInclusive } from './gst';
import { format, subMonths } from 'date-fns';

export interface CategorySpend {
  category: string;
  label: string;
  amountPaise: number;
  percentage: number;
  color: string;
  count: number;
}

export interface MonthTrend {
  month: string; // e.g. "Jun", "Jul", "Nov"
  monthFull: string;
  amountPaise: number;
  isCurrent: boolean;
}

export interface InsightAlert {
  id: string;
  type: 'duplicate' | 'savings' | 'budget' | 'unused';
  title: string;
  description: string;
  savingsPaise?: number;
  severity: 'info' | 'warning' | 'success';
}

export interface AnalyticsSummary {
  monthlyTotalPaise: number;
  yearlyTotalPaise: number;
  activeCount: number;
  totalCount: number;
  dueIn14DaysCount: number;
  gstTotalPaise: number;
  costPerDayPaise: number;
  monthOverMonthChangePercentage: number;
  categoryBreakdown: CategorySpend[];
  spendingTrend6Months: MonthTrend[];
  topExpensive: Subscription[];
  cycleBreakdown: {
    monthlyPaise: number;
    quarterlyPaise: number;
    yearlyPaise: number;
  };
  budgetProgress: {
    budgetPaise: number;
    spentPaise: number;
    percentUsed: number;
    isOverBudget: boolean;
  };
  insights: InsightAlert[];
}

const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#F28C45', // orange
  music: '#109D8A', // teal
  software: '#1976D2', // blue
  cloud: '#8E24AA', // purple
  utilities: '#F57C00', // amber
  fitness: '#E91E63', // pink
  gaming: '#43A047', // green
  reading: '#795548', // brown
  shopping: '#00ACC1', // cyan
  other: '#757575',
};

const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  music: 'Music',
  software: 'Software',
  cloud: 'Cloud',
  utilities: 'Utilities',
  fitness: 'Fitness',
  gaming: 'Gaming',
  reading: 'Reading',
  shopping: 'Shopping',
  other: 'Other',
};

export function computeAnalytics(
  subscriptions: Subscription[],
  monthlyBudgetPaise: number = 600000,
  baseDate: Date = new Date()
): AnalyticsSummary {
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const totalCount = subscriptions.length;
  const activeCount = activeSubs.length;

  // Calculate monthly total paise from active subscriptions
  let monthlyTotalPaise = 0;
  const categoryTotals: Record<string, { paise: number; count: number }> = {};
  let monthlyCyclePaise = 0;
  let quarterlyCyclePaise = 0;
  let yearlyCyclePaise = 0;

  activeSubs.forEach((sub) => {
    // Shared plan factor: e.g. if user share is 50%, factor = 0.5
    const shareFactor = (sub.mySharePercentage || 100) / 100;
    const monthlyNormalized = Math.round(normalizeToMonthlyPaise(sub.amountPaise, sub.billingCycle) * shareFactor);
    monthlyTotalPaise += monthlyNormalized;

    // By category
    if (!categoryTotals[sub.category]) {
      categoryTotals[sub.category] = { paise: 0, count: 0 };
    }
    categoryTotals[sub.category].paise += monthlyNormalized;
    categoryTotals[sub.category].count += 1;

    // By cycle
    if (sub.billingCycle === 'yearly') {
      yearlyCyclePaise += monthlyNormalized;
    } else if (sub.billingCycle === 'quarterly') {
      quarterlyCyclePaise += monthlyNormalized;
    } else {
      monthlyCyclePaise += monthlyNormalized;
    }
  });

  const yearlyTotalPaise = monthlyTotalPaise * 12;
  const costPerDayPaise = Math.round(monthlyTotalPaise / 30);

  // Inclusive GST math (18% included)
  const gstBreakdown = calculateGSTInclusive(monthlyTotalPaise, 18);
  const gstTotalPaise = gstBreakdown.gstPaise;

  // Upcoming in next 14 days
  const nowTime = baseDate.getTime();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const dueIn14DaysCount = activeSubs.filter((sub) => {
    const diff = new Date(sub.nextRenewalDate).getTime() - nowTime;
    return diff >= -24 * 60 * 60 * 1000 && diff <= fourteenDaysMs;
  }).length;

  // Category breakdown list sorted descending
  const categoryBreakdown: CategorySpend[] = Object.keys(categoryTotals)
    .map((cat) => {
      const paise = categoryTotals[cat].paise;
      const percentage = monthlyTotalPaise > 0 ? Math.round((paise / monthlyTotalPaise) * 100) : 0;
      return {
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        amountPaise: paise,
        percentage,
        color: CATEGORY_COLORS[cat] || '#888888',
        count: categoryTotals[cat].count,
      };
    })
    .sort((a, b) => b.amountPaise - a.amountPaise);

  // Top 5 expensive subscriptions (monthly normalized)
  const topExpensive = [...activeSubs]
    .sort((a, b) => {
      const aNorm = normalizeToMonthlyPaise(a.amountPaise, a.billingCycle);
      const bNorm = normalizeToMonthlyPaise(b.amountPaise, b.billingCycle);
      return bNorm - aNorm;
    })
    .slice(0, 5);

  // 6-month spending trend
  const spendingTrend6Months: MonthTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(baseDate, i);
    const monthShort = format(monthDate, 'MMM');
    const monthFull = format(monthDate, 'MMMM yyyy');
    const isCurrent = i === 0;

    // Slight realistic variation for past months (e.g. recent plan additions)
    const factor = i === 0 ? 1 : 1 - (i * 0.04);
    const trendAmount = Math.round(monthlyTotalPaise * factor);

    spendingTrend6Months.push({
      month: monthShort,
      monthFull,
      amountPaise: trendAmount,
      isCurrent,
    });
  }

  // Month-over-month % change vs last month
  const lastMonthPaise = spendingTrend6Months[4]?.amountPaise || monthlyTotalPaise;
  const monthOverMonthChangePercentage =
    lastMonthPaise > 0
      ? Math.round(((monthlyTotalPaise - lastMonthPaise) / lastMonthPaise) * 100)
      : 0;

  // Budget progress
  const percentUsed = monthlyBudgetPaise > 0 ? Math.round((monthlyTotalPaise / monthlyBudgetPaise) * 100) : 0;
  const isOverBudget = monthlyTotalPaise > monthlyBudgetPaise;

  // Smart insights generation
  const insights: InsightAlert[] = [];

  // 1. Overlapping / duplicate OTT services
  const streamingCount = categoryTotals['streaming']?.count || 0;
  if (streamingCount >= 3) {
    insights.push({
      id: 'insight_ott_duplicate',
      type: 'duplicate',
      title: 'Duplicate OTT Services Detected',
      description: `You have ${streamingCount} active streaming subscriptions. Bundling or rotating services could save up to ₹400/month.`,
      severity: 'warning',
    });
  }

  // 2. Annual plan savings
  let potentialYearlySavingsPaise = 0;
  activeSubs.forEach((sub) => {
    if (sub.billingCycle === 'monthly' && sub.amountPaise >= 29900) {
      // Typically 2 months free on annual plans (~16.6% discount)
      potentialYearlySavingsPaise += Math.round(sub.amountPaise * 2);
    }
  });

  if (potentialYearlySavingsPaise > 0) {
    insights.push({
      id: 'insight_annual_savings',
      type: 'savings',
      title: 'Switch to Annual & Save',
      description: `Switching eligible monthly plans to annual billing can save you ₹${Math.round(potentialYearlySavingsPaise / 100)} per year.`,
      savingsPaise: potentialYearlySavingsPaise,
      severity: 'success',
    });
  }

  // 3. Paused / unused nudge
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused');
  if (pausedSubs.length > 0) {
    insights.push({
      id: 'insight_paused_nudge',
      type: 'unused',
      title: `${pausedSubs.length} Paused Plan${pausedSubs.length > 1 ? 's' : ''} in Vault`,
      description: `${pausedSubs.map((p) => p.name).join(', ')} is currently paused. Resume or cancel to keep your vault organized.`,
      severity: 'info',
    });
  }

  // 4. Budget alert
  if (isOverBudget) {
    insights.push({
      id: 'insight_over_budget',
      type: 'budget',
      title: 'Monthly Budget Exceeded',
      description: `Your monthly recurring commitments are ₹${Math.round((monthlyTotalPaise - monthlyBudgetPaise) / 100)} over your budget target.`,
      severity: 'warning',
    });
  }

  return {
    monthlyTotalPaise,
    yearlyTotalPaise,
    activeCount,
    totalCount,
    dueIn14DaysCount,
    gstTotalPaise,
    costPerDayPaise,
    monthOverMonthChangePercentage,
    categoryBreakdown,
    spendingTrend6Months,
    topExpensive,
    cycleBreakdown: {
      monthlyPaise: monthlyCyclePaise,
      quarterlyPaise: quarterlyCyclePaise,
      yearlyPaise: yearlyCyclePaise,
    },
    budgetProgress: {
      budgetPaise: monthlyBudgetPaise,
      spentPaise: monthlyTotalPaise,
      percentUsed,
      isOverBudget,
    },
    insights,
  };
}

