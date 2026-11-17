import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  getDay,
} from 'date-fns';
import { useSubscriptionStore, useUserStore } from '../../store';
import { Card, Badge, Icon, colors, radii, typography } from '../../ui';
import { formatPaise } from '../../services/currency';
import { getDueStatus } from '../../services/renewal';
import { Subscription } from '../../domain/subscription';

interface RenewalCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectSubscription?: (sub: Subscription) => void;
}

export default function RenewalCalendarModal({
  visible,
  onClose,
  onSelectSubscription,
}: RenewalCalendarModalProps) {
  const { subscriptions } = useSubscriptionStore();
  const { profile, settings } = useUserStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const privacy = settings.hideAmountsPrivacy;

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startDayOffset = useMemo(() => {
    return getDay(startOfMonth(currentMonth));
  }, [currentMonth]);

  // Map subscriptions to dates
  const renewalsByDate = useMemo(() => {
    const map = new Map<string, Subscription[]>();
    subscriptions
      .filter((s) => s.status === 'active')
      .forEach((sub) => {
        const d = new Date(sub.nextRenewalDate);
        const key = format(d, 'yyyy-MM-dd');
        const existing = map.get(key) || [];
        existing.push(sub);
        map.set(key, existing);
      });
    return map;
  }, [subscriptions]);

  const selectedDateKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedDaySubs = renewalsByDate.get(selectedDateKey) || [];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>CALENDAR OVERVIEW</Text>
              <Text style={styles.title}>Renewal Schedule</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Month Switcher */}
          <View style={styles.monthSwitcher}>
            <Pressable
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={styles.monthNavBtn}
            >
              <Icon name="chevron-down" size={18} color={colors.nearBlack} style={{ transform: [{ rotate: '90deg' }] }} />
            </Pressable>
            <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <Pressable
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={styles.monthNavBtn}
            >
              <Icon name="chevron-down" size={18} color={colors.nearBlack} style={{ transform: [{ rotate: '-90deg' }] }} />
            </Pressable>
          </View>

          {/* Days of Week Header */}
          <View style={styles.weekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
              <Text key={w} style={styles.weekHeaderText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Month Days Grid */}
          <View style={styles.calendarGrid}>
            {Array.from({ length: startDayOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.calendarCell} />
            ))}

            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const hasRenewals = renewalsByDate.has(dateKey);
              const isSelected = isSameDay(day, selectedDay);
              const subsForDay = renewalsByDate.get(dateKey) || [];

              return (
                <Pressable
                  key={dateKey}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.cellSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellDayText,
                      isSelected && styles.cellDayTextSelected,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                  {hasRenewals && (
                    <View style={styles.dotContainer}>
                      {subsForDay.slice(0, 3).map((s, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.dot,
                            { backgroundColor: s.color || colors.accentOrange },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Selected Day Renewals */}
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {format(selectedDay, 'EEEE, d MMMM')}
            </Text>
            <Text style={styles.selectedDaySubtitle}>
              {selectedDaySubs.length} renewal{selectedDaySubs.length === 1 ? '' : 's'} on this day
            </Text>
          </View>

          <ScrollView style={styles.subsScrollView} showsVerticalScrollIndicator={false}>
            {selectedDaySubs.length === 0 ? (
              <Text style={styles.noRenewalsText}>No renewals scheduled on this date.</Text>
            ) : (
              selectedDaySubs.map((sub) => {
                const due = getDueStatus(sub.nextRenewalDate);
                return (
                  <Card
                    key={sub.id}
                    style={styles.subItemCard}
                    padding={12}
                    onPress={() => onSelectSubscription && onSelectSubscription(sub)}
                  >
                    <View style={styles.subItemRow}>
                      <View style={[styles.subItemIconCircle, { backgroundColor: sub.color || '#E8F5E9' }]}>
                        <Icon name={(sub.icon as any) || 'subscription'} size={18} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.subItemName}>{sub.name}</Text>
                        <Text style={styles.subItemCycle}>
                          {sub.category} • {sub.billingCycle}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.subItemPrice}>
                          {formatPaise(sub.amountPaise, profile.currency, privacy)}
                        </Text>
                        <Badge
                          label={due.label}
                          variant={due.status === 'overdue' ? 'overdue' : due.status === 'due-today' ? 'due-today' : 'neutral'}
                          size="sm"
                          style={{ marginTop: 2 }}
                        />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.cardCream,
    padding: 8,
    borderRadius: radii.md,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#EEF4F1',
  },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarCell: {
    width: '14.28%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  cellSelected: {
    backgroundColor: colors.nearBlack,
  },
  cellDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.nearBlack,
  },
  cellDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  selectedDayHeader: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderWarm,
    paddingTop: 12,
    marginBottom: 10,
  },
  selectedDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  selectedDaySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  subsScrollView: {
    maxHeight: 180,
  },
  noRenewalsText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 14,
  },
  subItemCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 8,
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  subItemCycle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  subItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.nearBlack,
  },
});

