import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, usePaymentStore, useUserStore } from '../../store';
import {
  AppBackground,
  Card,
  Button,
  Badge,
  Stat,
  ListRow,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { formatPaise } from '../../services/currency';
import { getDueStatus } from '../../services/renewal';
import { computeAnalytics } from '../../services/analytics';
import AddEditSubscriptionModal from '../subscriptions/AddEditSubscriptionModal';
import GlobalSearchModal from '../common/GlobalSearchModal';

export default function HomeScreen() {
  const router = useRouter();
  const { subscriptions, isLoading, loadSubscriptions } = useSubscriptionStore();
  const { payments, loadAll } = usePaymentStore();
  const { profile, settings, loadUser } = useUserStore();

  const [refreshing, setRefreshing] = useState(false);
  const [trendCycle, setTrendCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    loadSubscriptions();
    loadAll();
    loadUser();
  }, []);

  // Global search shortcut (Cmd+K / Ctrl+K on web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (e: any) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadSubscriptions(), loadAll(), loadUser()]);
    setRefreshing(false);
  };

  const analytics = useMemo(() => {
    return computeAnalytics(subscriptions, settings.monthlyBudgetPaise);
  }, [subscriptions, settings.monthlyBudgetPaise]);

  // Filter top 5 active subscriptions
  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => s.status === 'active');
  }, [subscriptions]);

  const top5Subs = useMemo(() => {
    return activeSubs.slice(0, 5);
  }, [activeSubs]);

  // Upcoming renewals due soon (next 14 days)
  const upcomingSoon = useMemo(() => {
    return activeSubs
      .map((s) => ({
        sub: s,
        due: getDueStatus(s.nextRenewalDate),
      }))
      .filter((item) => item.due.status === 'due-today' || item.due.status === 'due-soon')
      .sort((a, b) => a.due.daysDiff - b.due.daysDiff);
  }, [activeSubs]);

  // Last 4 payments
  const recentPayments = useMemo(() => {
    return payments.slice(0, 4);
  }, [payments]);

  const privacy = settings.hideAmountsPrivacy;

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.eyebrow}>FINANCIAL OVERVIEW</Text>
            <Text style={styles.greeting}>
              Hello, <Text style={styles.highlightName}>{profile.firstName || 'Rohan'}</Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setIsSearchOpen(true)}
              style={styles.headerIconButton}
              accessibilityLabel="Global Search"
            >
              <Icon name="search" size={20} color={colors.nearBlack} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/(auth)/(tabs)/profile')}
              style={styles.headerIconButton}
              accessibilityLabel="Notifications"
            >
              <Icon name="bell" size={20} color={colors.nearBlack} />
            </Pressable>

            <Pressable
              onPress={() => setIsAddModalOpen(true)}
              style={styles.addPlanButton}
              accessibilityLabel="Add Subscription Plan"
            >
              <Icon name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.addPlanText}>Add Plan</Text>
            </Pressable>
          </View>
        </View>

        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          <Stat
            eyebrow="MONTHLY COST"
            value={formatPaise(analytics.monthlyTotalPaise, profile.currency, privacy)}
            subtitle={`Incl. ${formatPaise(analytics.gstTotalPaise, profile.currency, privacy)} GST`}
            trendText={analytics.monthOverMonthChangePercentage >= 0 ? `+${analytics.monthOverMonthChangePercentage}%` : `${analytics.monthOverMonthChangePercentage}%`}
            trendDirection={analytics.monthOverMonthChangePercentage > 0 ? 'up' : 'down'}
            icon="card"
            style={styles.statCard}
          />

          <Stat
            eyebrow="YEARLY OUTFLOW"
            value={formatPaise(analytics.yearlyTotalPaise, profile.currency, privacy)}
            subtitle="Annual Projected"
            icon="calendar"
            style={styles.statCard}
          />
        </View>

        <View style={[styles.statsGrid, { marginTop: 12 }]}>
          <Stat
            eyebrow="ACTIVE PLANS"
            value={`${analytics.activeCount} Plans`}
            subtitle={`${analytics.totalCount} total in vault`}
            icon="subscription"
            style={styles.statCard}
          />

          <Stat
            eyebrow="UPCOMING RENEWALS"
            value={`${analytics.dueIn14DaysCount} Due`}
            subtitle="Next 14 days"
            highlightValue={analytics.dueIn14DaysCount > 0}
            icon="clock"
            style={styles.statCard}
          />
        </View>

        {/* Spending Trends Section */}
        <Card style={styles.sectionCard} padding={20}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.eyebrow}>SPENDING TRENDS</Text>
              <Text style={styles.chartMainAmount}>
                {trendCycle === 'monthly'
                  ? formatPaise(analytics.monthlyTotalPaise, profile.currency, privacy)
                  : formatPaise(analytics.yearlyTotalPaise, profile.currency, privacy)}
                <Text style={styles.chartAmountSuffix}>
                  {trendCycle === 'monthly' ? ' /month' : ' /year'}
                </Text>
              </Text>
            </View>

            {/* Monthly / Yearly Toggle */}
            <View style={styles.cycleToggleContainer}>
              <Pressable
                onPress={() => setTrendCycle('monthly')}
                style={[
                  styles.cycleToggleButton,
                  trendCycle === 'monthly' && styles.cycleToggleActive,
                ]}
              >
                <Text
                  style={[
                    styles.cycleToggleText,
                    trendCycle === 'monthly' && styles.cycleToggleTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setTrendCycle('yearly')}
                style={[
                  styles.cycleToggleButton,
                  trendCycle === 'yearly' && styles.cycleToggleActive,
                ]}
              >
                <Text
                  style={[
                    styles.cycleToggleText,
                    trendCycle === 'yearly' && styles.cycleToggleTextActive,
                  ]}
                >
                  Yearly
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 6-Month Bar Chart */}
          <View style={styles.barChartContainer}>
            {analytics.spendingTrend6Months.map((m, idx) => {
              const maxPaise = Math.max(
                ...analytics.spendingTrend6Months.map((item) => item.amountPaise),
                1
              );
              const heightPercent = Math.max(15, Math.round((m.amountPaise / maxPaise) * 90));

              return (
                <View key={idx} style={styles.barColumn}>
                  <Text style={styles.barAmountText}>
                    ₹{Math.round(m.amountPaise / 100000)}k
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        m.isCurrent && styles.barFillCurrent,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      m.isCurrent && styles.barLabelCurrent,
                    ]}
                  >
                    {m.month}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Category Allocation Stacked Bar */}
          <View style={styles.categoryAllocationHeader}>
            <Text style={styles.eyebrow}>CATEGORY ALLOCATION</Text>
          </View>

          <View style={styles.stackedBar}>
            {analytics.categoryBreakdown.map((cat, idx) => (
              <View
                key={idx}
                style={{
                  flex: Math.max(cat.percentage, 2),
                  backgroundColor: cat.color,
                  height: 12,
                  borderTopLeftRadius: idx === 0 ? 6 : 0,
                  borderBottomLeftRadius: idx === 0 ? 6 : 0,
                  borderTopRightRadius: idx === analytics.categoryBreakdown.length - 1 ? 6 : 0,
                  borderBottomRightRadius: idx === analytics.categoryBreakdown.length - 1 ? 6 : 0,
                }}
              />
            ))}
          </View>

          {/* Category Legend */}
          <View style={styles.categoryLegend}>
            {analytics.categoryBreakdown.map((cat, idx) => (
              <View key={idx} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>
                  {cat.label} <Text style={styles.legendPercent}>({cat.percentage}%)</Text>
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Upcoming Payments (Horizontal Cards) */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Upcoming Payments</Text>
            {upcomingSoon.length > 0 && (
              <Badge
                label={`${upcomingSoon.length} Due Soon`}
                variant="due-today"
                size="sm"
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.upcomingScroll}
        >
          {upcomingSoon.map(({ sub, due }) => (
            <Card
              key={sub.id}
              style={styles.upcomingCard}
              padding={16}
              onPress={() => router.push(`/(auth)/(tabs)/subscription/${sub.id}` as any)}
            >
              <View style={styles.upcomingCardTop}>
                <View style={[styles.upcomingIconCircle, { backgroundColor: sub.color || '#E8F5E9' }]}>
                  <Icon name={(sub.icon as any) || 'subscription'} size={18} color="#FFFFFF" />
                </View>
                <Badge
                  label={due.label}
                  variant={due.status === 'due-today' ? 'due-today' : 'autopay'}
                  size="sm"
                />
              </View>

              <Text style={styles.upcomingSubName} numberOfLines={1}>
                {sub.name}
              </Text>
              <Text style={styles.upcomingNextDate}>
                Renews {new Date(sub.nextRenewalDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </Text>

              <View style={styles.upcomingPriceRow}>
                <Text style={styles.upcomingPrice}>
                  {formatPaise(sub.amountPaise, profile.currency, privacy)}
                </Text>
                {sub.hasAutoPay && (
                  <Badge label="AutoPay" variant="autopay" size="sm" icon="check" />
                )}
              </View>
            </Card>
          ))}
        </ScrollView>

        {/* Active Subscriptions (Top 5 rows + View All) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Subscriptions</Text>
          <Pressable onPress={() => router.push('/(auth)/(tabs)/subscription')}>
            <Text style={styles.viewAllText}>View All ({analytics.totalCount})</Text>
          </Pressable>
        </View>

        <View style={styles.subscriptionsList}>
          {top5Subs.map((sub) => {
            const due = getDueStatus(sub.nextRenewalDate);
            return (
              <ListRow
                key={sub.id}
                title={sub.name}
                category={sub.category}
                dueLabel={due.label}
                dueVariant={due.status === 'overdue' ? 'overdue' : due.status === 'due-today' ? 'due-today' : 'neutral'}
                price={formatPaise(sub.amountPaise, profile.currency, privacy)}
                cycleSuffix={`/${sub.billingCycle === 'yearly' ? 'yr' : sub.billingCycle === 'quarterly' ? 'qtr' : 'mo'}`}
                hasAutoPay={sub.hasAutoPay}
                hasGST={sub.hasGST}
                iconName={(sub.icon as any) || 'subscription'}
                onPress={() => router.push(`/(auth)/(tabs)/subscription/${sub.id}` as any)}
              />
            );
          })}
        </View>

        {/* Recent Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Pressable onPress={() => router.push('/(auth)/(tabs)/profile')}>
            <Text style={styles.viewAllText}>View Ledger</Text>
          </Pressable>
        </View>

        <View style={styles.transactionsList}>
          {recentPayments.map((p) => (
            <Card key={p.id} style={styles.transactionCard} padding={14}>
              <View style={styles.transactionRow}>
                <View style={styles.txIcon}>
                  <Icon name="receipt" size={18} color={colors.teal} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txTitle}>{p.subscriptionName}</Text>
                  <Text style={styles.txMethod}>{p.paymentMethodName}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.txAmount}>
                    {formatPaise(p.amountPaise, profile.currency, privacy)}
                  </Text>
                  <Badge label="PAID" variant="paid" size="sm" style={{ marginTop: 4 }} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Add Subscription Modal */}
      {isAddModalOpen && (
        <AddEditSubscriptionModal
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Global Search Modal */}
      {isSearchOpen && (
        <GlobalSearchModal
          visible={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 110,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.nearBlack,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  highlightName: {
    color: colors.accentOrange,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardCream,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.nearBlack,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: radii.full,
    gap: 6,
  },
  addPlanText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  sectionCard: {
    marginTop: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  chartMainAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.nearBlack,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  chartAmountSuffix: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cycleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EBEFEA',
    borderRadius: radii.full,
    padding: 3,
  },
  cycleToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  cycleToggleActive: {
    backgroundColor: colors.nearBlack,
  },
  cycleToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cycleToggleTextActive: {
    color: '#FFFFFF',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorderWarm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barAmountText: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
  barTrack: {
    width: 22,
    height: 90,
    backgroundColor: '#EEF3F0',
    borderRadius: 11,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#BDD4CA',
    borderRadius: 11,
  },
  barFillCurrent: {
    backgroundColor: colors.accentOrange, // Current month in orange!
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  barLabelCurrent: {
    color: colors.accentOrange,
    fontWeight: '700',
  },
  categoryAllocationHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  categoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  legendPercent: {
    fontWeight: '700',
    color: colors.nearBlack,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
  },
  upcomingScroll: {
    gap: 12,
    paddingRight: 20,
  },
  upcomingCard: {
    width: 210,
    marginRight: 10,
  },
  upcomingCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  upcomingIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingSubName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
    marginBottom: 2,
  },
  upcomingNextDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  upcomingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upcomingPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  subscriptionsList: {
    marginTop: 4,
  },
  transactionsList: {
    gap: 8,
  },
  transactionCard: {
    backgroundColor: colors.cardCream,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  txMethod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
});

