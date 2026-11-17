import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useSubscriptionStore, useUserStore } from '../../store';
import {
  AppBackground,
  Card,
  Stat,
  Badge,
  Chip,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { formatPaise } from '../../services/currency';
import { computeAnalytics } from '../../services/analytics';

type RangeOption = '1M' | '3M' | '6M' | '1Y';

export default function AnalyticsScreen() {
  const { subscriptions } = useSubscriptionStore();
  const { profile, settings } = useUserStore();
  const [selectedRange, setSelectedRange] = useState<RangeOption>('6M');

  const analytics = useMemo(() => {
    return computeAnalytics(subscriptions, settings.monthlyBudgetPaise);
  }, [subscriptions, settings.monthlyBudgetPaise]);
  const privacy = settings.hideAmountsPrivacy;

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>FINANCIAL INTELLIGENCE</Text>
            <Text style={styles.title}>Analytics</Text>
          </View>

          {/* Date range chips */}
          <View style={styles.rangeRow}>
            {(['1M', '3M', '6M', '1Y'] as const).map((rng) => (
              <Pressable
                key={rng}
                onPress={() => setSelectedRange(rng)}
                style={[
                  styles.rangeButton,
                  selectedRange === rng && styles.rangeButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.rangeText,
                    selectedRange === rng && styles.rangeTextActive,
                  ]}
                >
                  {rng}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Monthly Budget Progress Ring / Bar */}
        <Card style={styles.budgetCard} padding={18}>
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.eyebrow}>MONTHLY BUDGET LIMIT</Text>
              <Text style={styles.budgetAmount}>
                {formatPaise(analytics.monthlyTotalPaise, profile.currency, privacy)}
                <Text style={styles.budgetLimitText}>
                  {' '}
                  / {formatPaise(analytics.budgetProgress.budgetPaise, profile.currency, privacy)}
                </Text>
              </Text>
            </View>

            <Badge
              label={`${analytics.budgetProgress.percentUsed}% USED`}
              variant={analytics.budgetProgress.isOverBudget ? 'overdue' : 'autopay'}
              size="md"
            />
          </View>

          <View style={styles.budgetTrack}>
            <View
              style={[
                styles.budgetBarFill,
                { width: `${Math.min(analytics.budgetProgress.percentUsed, 100)}%` },
                analytics.budgetProgress.isOverBudget && styles.budgetBarOver,
              ]}
            />
          </View>

          {analytics.budgetProgress.isOverBudget ? (
            <Text style={styles.overBudgetWarning}>
              Over budget by{' '}
              {formatPaise(
                analytics.monthlyTotalPaise - analytics.budgetProgress.budgetPaise,
                profile.currency,
                privacy
              )}
              . Review unused plans below.
            </Text>
          ) : (
            <Text style={styles.budgetSafeNote}>
              You have{' '}
              {formatPaise(
                analytics.budgetProgress.budgetPaise - analytics.monthlyTotalPaise,
                profile.currency,
                privacy
              )}{' '}
              remaining under your monthly threshold.
            </Text>
          )}
        </Card>

        {/* 2 Key Stats: Cost per Day & Total GST Paid */}
        <View style={styles.statsGrid}>
          <Stat
            eyebrow="COST PER DAY"
            value={formatPaise(analytics.costPerDayPaise, profile.currency, privacy)}
            subtitle="Daily Run-Rate"
            icon="clock"
            style={{ flex: 1 }}
          />

          <Stat
            eyebrow="TOTAL GST PAID"
            value={formatPaise(analytics.gstTotalPaise, profile.currency, privacy)}
            subtitle="18% Included GST"
            icon="receipt"
            style={{ flex: 1 }}
          />
        </View>

        {/* Smart Insights Cards */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Smart Insights & Optimizations</Text>
          {analytics.insights.map((insight) => (
            <Card key={insight.id} style={styles.insightCard} padding={16}>
              <View style={styles.insightRow}>
                <View
                  style={[
                    styles.insightIconCircle,
                    insight.type === 'savings' && styles.insightIconSavings,
                    insight.type === 'duplicate' && styles.insightIconDuplicate,
                    insight.type === 'budget' && styles.insightIconBudget,
                    insight.type === 'unused' && styles.insightIconUnused,
                  ]}
                >
                  <Icon
                    name={
                      insight.type === 'savings'
                        ? 'sparkles'
                        : insight.type === 'duplicate'
                        ? 'alert'
                        : insight.type === 'budget'
                        ? 'alert-triangle'
                        : 'pause'
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDesc}>{insight.description}</Text>
                  {insight.savingsPaise && (
                    <Badge
                      label={`Save ₹${Math.round(insight.savingsPaise / 100)}/yr`}
                      variant="active"
                      size="sm"
                      style={{ marginTop: 6 }}
                    />
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Category Allocation Distribution */}
        <Card style={styles.categoryCard} padding={20}>
          <Text style={styles.eyebrow}>CATEGORY SPEND DISTRIBUTION</Text>
          <Text style={styles.categoryTitle}>Allocation by Sector</Text>

          <View style={styles.categoryList}>
            {analytics.categoryBreakdown.map((cat, idx) => (
              <View key={idx} style={styles.categoryRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.categoryLabelRow}>
                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.catName}>{cat.label}</Text>
                    <Text style={styles.catCount}>({cat.count} plans)</Text>
                  </View>
                  <View style={styles.catProgressBar}>
                    <View
                      style={[
                        styles.catProgressFill,
                        { width: `${cat.percentage}%`, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', marginLeft: 16 }}>
                  <Text style={styles.catAmount}>
                    {formatPaise(cat.amountPaise, profile.currency, privacy)}
                  </Text>
                  <Text style={styles.catPercent}>{cat.percentage}% of total</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Billing Cycle Split (Monthly vs Yearly vs Quarterly) */}
        <Card style={styles.cycleCard} padding={20}>
          <Text style={styles.eyebrow}>BILLING CYCLE COMMITMENT</Text>
          <View style={styles.cycleGrid}>
            <View style={styles.cycleItem}>
              <Text style={styles.cycleVal}>
                {formatPaise(analytics.cycleBreakdown.monthlyPaise, profile.currency, privacy)}
              </Text>
              <Text style={styles.cycleKey}>Monthly Plans</Text>
            </View>
            <View style={styles.cycleItem}>
              <Text style={styles.cycleVal}>
                {formatPaise(analytics.cycleBreakdown.quarterlyPaise, profile.currency, privacy)}
              </Text>
              <Text style={styles.cycleKey}>Quarterly Plans</Text>
            </View>
            <View style={styles.cycleItem}>
              <Text style={styles.cycleVal}>
                {formatPaise(analytics.cycleBreakdown.yearlyPaise, profile.currency, privacy)}
              </Text>
              <Text style={styles.cycleKey}>Annual Plans</Text>
            </View>
          </View>
        </Card>

        {/* Top 5 Most Expensive Plans */}
        <View style={styles.topExpensiveSection}>
          <Text style={styles.sectionTitle}>Top 5 Most Expensive Plans</Text>
          {analytics.topExpensive.map((sub, idx) => (
            <Card key={sub.id} style={styles.expensiveCard} padding={14}>
              <View style={styles.expensiveRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <View style={[styles.subIconCircle, { backgroundColor: sub.color || '#E8F5E9' }]}>
                  <Icon name={(sub.icon as any) || 'subscription'} size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.expensiveName}>{sub.name}</Text>
                  <Text style={styles.expensiveCategory}>{sub.category.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.expensiveAmount}>
                    {formatPaise(sub.amountPaise, profile.currency, privacy)}
                  </Text>
                  <Text style={styles.expensiveCycle}>/{sub.billingCycle}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  title: {
    ...typography.pageTitle,
    color: colors.nearBlack,
    marginTop: 2,
  },
  rangeRow: {
    flexDirection: 'row',
    backgroundColor: '#EBEFEA',
    borderRadius: radii.full,
    padding: 3,
  },
  rangeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  rangeButtonActive: {
    backgroundColor: colors.nearBlack,
  },
  rangeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  budgetCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 14,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  budgetAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.nearBlack,
    marginTop: 4,
  },
  budgetLimitText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  budgetTrack: {
    height: 10,
    backgroundColor: '#E6EEE9',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
  },
  budgetBarFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 5,
  },
  budgetBarOver: {
    backgroundColor: colors.dangerRed,
  },
  budgetSafeNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  overBudgetWarning: {
    fontSize: 12,
    color: colors.dangerRed,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  insightsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightIconSavings: {
    backgroundColor: colors.accentOrange,
  },
  insightIconDuplicate: {
    backgroundColor: '#E65100',
  },
  insightIconBudget: {
    backgroundColor: colors.dangerRed,
  },
  insightIconUnused: {
    backgroundColor: colors.teal,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  insightDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  categoryCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.nearBlack,
    marginTop: 2,
    marginBottom: 14,
  },
  categoryList: {
    gap: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  catDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  catCount: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
  },
  catProgressBar: {
    height: 6,
    backgroundColor: '#EEF3F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  catPercent: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  cycleCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 20,
  },
  cycleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  cycleItem: {
    alignItems: 'center',
    flex: 1,
  },
  cycleVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  cycleKey: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  topExpensiveSection: {
    marginBottom: 20,
  },
  expensiveCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 8,
  },
  expensiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EEF4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  subIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expensiveName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  expensiveCategory: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  expensiveAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  expensiveCycle: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

