import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscriptionStore, usePaymentStore, useUserStore } from '../../store';
import { Card, Badge, Icon, colors, radii, typography } from '../../ui';
import { formatPaise } from '../../services/currency';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const { subscriptions } = useSubscriptionStore();
  const { payments } = usePaymentStore();
  const { profile, settings } = useUserStore();
  const [query, setQuery] = useState('');

  const privacy = settings.hideAmountsPrivacy;

  const results = useMemo(() => {
    if (!query.trim()) return { subs: [], txs: [] };
    const q = query.toLowerCase();

    const subs = subscriptions.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.notes || '').toLowerCase().includes(q)
    );

    const txs = payments.filter(
      (p) =>
        p.subscriptionName.toLowerCase().includes(q) ||
        p.paymentMethodName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q)
    );

    return { subs, txs };
  }, [query, subscriptions, payments]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Search Input Bar */}
          <View style={styles.searchBar}>
            <Icon name="search" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Type to search plans, categories, VPAs, receipts..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              style={styles.searchInput}
            />
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Subscriptions Matches */}
            {results.subs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SUBSCRIPTIONS ({results.subs.length})</Text>
                {results.subs.map((sub) => (
                  <Card
                    key={sub.id}
                    style={styles.resultCard}
                    padding={12}
                    onPress={() => {
                      onClose();
                      router.push(`/(auth)/(tabs)/subscription/${sub.id}` as any);
                    }}
                  >
                    <View style={styles.row}>
                      <View style={[styles.iconCircle, { backgroundColor: sub.color || '#E8F5E9' }]}>
                        <Icon name={(sub.icon as any) || 'subscription'} size={16} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.resultTitle}>{sub.name}</Text>
                        <Text style={styles.resultSub}>{sub.category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.resultPrice}>
                        {formatPaise(sub.amountPaise, profile.currency, privacy)}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Payments Ledger Matches */}
            {results.txs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PAYMENT TRANSACTIONS ({results.txs.length})</Text>
                {results.txs.map((tx) => (
                  <Card key={tx.id} style={styles.resultCard} padding={12}>
                    <View style={styles.row}>
                      <View style={[styles.iconCircle, { backgroundColor: colors.tealLight }]}>
                        <Icon name="receipt" size={16} color={colors.teal} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.resultTitle}>{tx.subscriptionName}</Text>
                        <Text style={styles.resultSub}>
                          {tx.receiptNumber} • {tx.paymentMethodName}
                        </Text>
                      </View>
                      <Text style={styles.resultPrice}>
                        {formatPaise(tx.amountPaise, profile.currency, privacy)}
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {query.trim() && results.subs.length === 0 && results.txs.length === 0 && (
              <Text style={styles.noResultsText}>No results matching "{query}".</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    width: '90%',
    maxWidth: 620,
    maxHeight: '80%',
    padding: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.nearBlack,
    outlineStyle: 'none' as any,
  },
  closeBtn: {
    padding: 6,
  },
  scrollArea: {
    maxHeight: 460,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginBottom: 8,
  },
  resultCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  resultSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  noResultsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 30,
  },
});

