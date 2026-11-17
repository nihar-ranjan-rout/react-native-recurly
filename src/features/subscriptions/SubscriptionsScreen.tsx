import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, useUserStore } from '../../store';
import {
  AppBackground,
  Card,
  Button,
  Chip,
  ListRow,
  EmptyState,
  Icon,
  colors,
  radii,
  typography,
} from '../../ui';
import { formatPaise } from '../../services/currency';
import { getDueStatus } from '../../services/renewal';
import { computeAnalytics } from '../../services/analytics';
import { Subscription, SubscriptionCategory, SubscriptionStatus } from '../../domain/subscription';
import AddEditSubscriptionModal from './AddEditSubscriptionModal';
import CatalogModal from './CatalogModal';
import SubscriptionDetailModal from './SubscriptionDetailModal';
import RenewalCalendarModal from './RenewalCalendarModal';

type SortOption = 'renewal' | 'price-desc' | 'price-asc' | 'name';

const CATEGORIES: { label: string; value: 'all' | SubscriptionCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'Streaming', value: 'streaming' },
  { label: 'Music', value: 'music' },
  { label: 'Software', value: 'software' },
  { label: 'Cloud', value: 'cloud' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'Reading', value: 'reading' },
  { label: 'Other', value: 'other' },
];

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { subscriptions, undoBuffer, undoLastAction, clearUndo } = useSubscriptionStore();
  const { profile, settings } = useUserStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | SubscriptionStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SubscriptionCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('renewal');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSubForDetail, setSelectedSubForDetail] = useState<Subscription | null>(null);
  const [selectedSubForEdit, setSelectedSubForEdit] = useState<Subscription | null>(null);

  const analytics = useMemo(() => {
    return computeAnalytics(subscriptions, settings.monthlyBudgetPaise);
  }, [subscriptions, settings.monthlyBudgetPaise]);
  const privacy = settings.hideAmountsPrivacy;

  // Filter & sort subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchCat = s.category.toLowerCase().includes(q);
          const matchNotes = (s.notes || '').toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchNotes) return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && s.status !== selectedStatus) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && s.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'renewal') {
          return new Date(a.nextRenewalDate).getTime() - new Date(b.nextRenewalDate).getTime();
        }
        if (sortOption === 'price-desc') {
          return b.amountPaise - a.amountPaise;
        }
        if (sortOption === 'price-asc') {
          return a.amountPaise - b.amountPaise;
        }
        if (sortOption === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subscriptions, searchQuery, selectedStatus, selectedCategory, sortOption]);

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>PORTFOLIO VAULT</Text>
            <Text style={styles.title}>Subscriptions</Text>
            <Text style={styles.subtitle}>
              {analytics.totalCount} total plans • {formatPaise(analytics.monthlyTotalPaise, profile.currency, privacy)}/mo
            </Text>
          </View>

          <View style={styles.headerButtons}>
            <Button
              label="Calendar"
              variant="secondary"
              size="sm"
              icon="calendar"
              onPress={() => setIsCalendarOpen(true)}
            />
            <Button
              label="Catalog"
              variant="secondary"
              size="sm"
              icon="sparkles"
              onPress={() => setIsCatalogOpen(true)}
            />
            <Button
              label="Add"
              variant="primary"
              size="sm"
              icon="plus"
              onPress={() => {
                setSelectedSubForEdit(null);
                setIsAddOpen(true);
              }}
            />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Search subscriptions, categories, notes..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Icon name="close" size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Status Chips */}
        <View style={styles.statusChipsRow}>
          {(['all', 'active', 'paused', 'cancelled'] as const).map((st) => (
            <Chip
              key={st}
              label={st.charAt(0).toUpperCase() + st.slice(1)}
              selected={selectedStatus === st}
              onPress={() => setSelectedStatus(st)}
              count={
                st === 'all'
                  ? subscriptions.length
                  : subscriptions.filter((s) => s.status === st).length
              }
            />
          ))}
        </View>

        {/* Category Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              selected={selectedCategory === cat.value}
              onPress={() => setSelectedCategory(cat.value)}
            />
          ))}
        </ScrollView>

        {/* Sort & Count Row */}
        <View style={styles.sortRow}>
          <Text style={styles.countText}>
            Showing {filteredSubscriptions.length} of {subscriptions.length}
          </Text>

          <View style={styles.sortButtons}>
            <Pressable
              onPress={() => setSortOption('renewal')}
              style={[
                styles.sortButton,
                sortOption === 'renewal' && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOption === 'renewal' && styles.sortButtonTextActive,
                ]}
              >
                Renewal
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortOption('price-desc')}
              style={[
                styles.sortButton,
                sortOption === 'price-desc' && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOption === 'price-desc' && styles.sortButtonTextActive,
                ]}
              >
                Price ↓
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSortOption('name')}
              style={[
                styles.sortButton,
                sortOption === 'name' && styles.sortButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortOption === 'name' && styles.sortButtonTextActive,
                ]}
              >
                Name
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            icon="subscription"
            title="No Subscriptions Found"
            description={
              searchQuery
                ? `No plans match "${searchQuery}". Try a different search or filter.`
                : 'Your portfolio vault is empty. Browse the Indian service catalog to add your first subscription.'
            }
            actionLabel="Browse Catalog"
            onAction={() => setIsCatalogOpen(true)}
          />
        ) : (
          <View style={styles.listContainer}>
            {filteredSubscriptions.map((sub) => {
              const due = getDueStatus(sub.nextRenewalDate);
              return (
                <ListRow
                  key={sub.id}
                  title={sub.name}
                  category={sub.category}
                  dueLabel={due.label}
                  dueVariant={
                    due.status === 'overdue'
                      ? 'overdue'
                      : due.status === 'due-today'
                      ? 'due-today'
                      : 'neutral'
                  }
                  price={formatPaise(sub.amountPaise, profile.currency, privacy)}
                  cycleSuffix={`/${
                    sub.billingCycle === 'yearly'
                      ? 'yr'
                      : sub.billingCycle === 'quarterly'
                      ? 'qtr'
                      : 'mo'
                  }`}
                  status={sub.status}
                  hasAutoPay={sub.hasAutoPay}
                  hasGST={sub.hasGST}
                  iconName={(sub.icon as any) || 'subscription'}
                  onPress={() => setSelectedSubForDetail(sub)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Undo Action Snackbar */}
      {undoBuffer && (
        <View style={styles.undoSnackbar}>
          <Text style={styles.undoText}>
            {undoBuffer.type === 'delete'
              ? `Deleted ${undoBuffer.subscription.name}`
              : `Changed ${undoBuffer.subscription.name} status`}
          </Text>
          <Pressable onPress={undoLastAction} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>UNDO</Text>
          </Pressable>
          <Pressable onPress={clearUndo} style={{ marginLeft: 10 }}>
            <Icon name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Subscription Detail Modal */}
      {selectedSubForDetail && (
        <SubscriptionDetailModal
          visible={!!selectedSubForDetail}
          subscription={selectedSubForDetail}
          onClose={() => setSelectedSubForDetail(null)}
          onEdit={() => {
            setSelectedSubForEdit(selectedSubForDetail);
            setSelectedSubForDetail(null);
            setIsAddOpen(true);
          }}
        />
      )}

      {/* Renewal Calendar Modal */}
      {isCalendarOpen && (
        <RenewalCalendarModal
          visible={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onSelectSubscription={(sub) => {
            setIsCalendarOpen(false);
            setSelectedSubForDetail(sub);
          }}
        />
      )}

      {/* Add / Edit Subscription Modal */}
      {isAddOpen && (
        <AddEditSubscriptionModal
          visible={isAddOpen}
          initialData={selectedSubForEdit}
          onClose={() => {
            setIsAddOpen(false);
            setSelectedSubForEdit(null);
          }}
        />
      )}

      {/* Indian Service Catalog Preset Modal */}
      {isCatalogOpen && (
        <CatalogModal
          visible={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          onSelectPreset={(preset) => {
            setIsCatalogOpen(false);
            setSelectedSubForEdit({
              id: '',
              userId: 'user_default',
              name: preset.name,
              category: preset.category,
              amountPaise: preset.defaultAmountPaise,
              currency: 'INR',
              billingCycle: preset.billingCycle,
              startDate: new Date().toISOString(),
              nextRenewalDate: new Date().toISOString(),
              hasAutoPay: preset.hasAutoPaySupport,
              hasGST: preset.defaultGST,
              gstRate: 18,
              status: 'active',
              notes: preset.description,
              reminderDays: 3,
              color: preset.color,
              icon: preset.icon,
              sharedWith: 1,
              mySharePercentage: 100,
              priceHistory: [],
              createdAt: '',
              updatedAt: '',
            });
            setIsAddOpen(true);
          }}
        />
      )}
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 120,
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
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.nearBlack,
    outlineStyle: 'none' as any,
  },
  clearSearch: {
    padding: 4,
  },
  statusChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryChipsScroll: {
    paddingBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: '#EEF3F0',
  },
  sortButtonActive: {
    backgroundColor: colors.nearBlack,
  },
  sortButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    marginTop: 4,
  },
  undoSnackbar: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: colors.nearBlack,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  undoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  undoButton: {
    backgroundColor: colors.accentOrange,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  undoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
