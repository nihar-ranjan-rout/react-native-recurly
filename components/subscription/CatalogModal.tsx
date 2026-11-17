import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Badge from "@/components/ui/Badge";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  INDIAN_CATALOG_CATEGORIES,
  INDIAN_SUBSCRIPTION_CATALOG,
  IndianCatalogService,
} from "@/lib/catalog";
import { Subscription, SubscriptionCategory } from "@/lib/subscriptions";

export interface CatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectService?: (service: IndianCatalogService) => void;
  onSelectPreset?: (service: IndianCatalogService) => void;
  onOpenCustomSubscription?: () => void;
}

export default function CatalogModal({
  visible,
  onClose,
  onSelectService,
  onSelectPreset,
  onOpenCustomSubscription,
}: CatalogModalProps) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  const { formatAmount } = useCurrency();

  const [selectedCategory, setSelectedCategory] = useState<
    SubscriptionCategory | "all"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = INDIAN_SUBSCRIPTION_CATALOG.filter((s) => {
    const matchesCategory =
      selectedCategory === "all" || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalBackdrop, isWeb && styles.webBackdrop]}>
          <View style={[styles.modalContainer, isWeb && styles.webModalContainer]}>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View style={styles.headerIcon}>
                  <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Indian Subscription Catalog</Text>
                  <Text style={styles.headerSubtitle}>
                    Verified OTT, Music, Telecom & Software presets with indicative INR pricing
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            {/* SEARCH & FILTERS */}
            <View style={styles.filterSection}>
              {/* Search Bar */}
              <View style={styles.searchBar}>
                <Ionicons name="search" size={16} color={theme.colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search Netflix, Hotstar, Jio, Spotify, ChatGPT..."
                  placeholderTextColor="#A0988A"
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.textSecondary} />
                  </Pressable>
                )}
              </View>

              {/* Category Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsRow}
              >
                {INDIAN_CATALOG_CATEGORIES.map((cat) => {
                  const isSel = selectedCategory === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryPill, isSel && styles.categoryPillActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={13}
                        color={isSel ? "#FFFFFF" : theme.colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.categoryPillText,
                          isSel && styles.categoryPillTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* CATALOG LIST */}
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {/* INDICATIVE PRICING NOTICE */}
              <View style={styles.indicativeNotice}>
                <Ionicons name="information-circle-outline" size={15} color="#856404" />
                <Text style={styles.indicativeText}>
                  Pricing Disclaimer: Displayed rates are verified Indian indicative reference
                  prices. You can modify the exact subscription amount, billing cycle, and tax
                  treatment when adding to your vault.
                </Text>
              </View>

              {filteredServices.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={44} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No Services Found</Text>
                  <Text style={styles.emptySub}>
                    Try searching with another keyword or create a custom subscription.
                  </Text>
                </View>
              ) : (
                filteredServices.map((item) => (
                  <View key={item.id} style={styles.serviceCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View
                          style={[
                            styles.serviceIconBox,
                            { backgroundColor: `${item.color}15` },
                          ]}
                        >
                          <Ionicons name={item.icon as any} size={22} color={item.color} />
                        </View>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={styles.serviceName}>{item.name}</Text>
                            {item.popularInIndia && (
                              <Badge label="Popular" variant="primary" />
                            )}
                          </View>
                          <Text style={styles.serviceProvider}>{item.provider}</Text>
                        </View>
                      </View>

                      <View style={styles.pricingBox}>
                        <Text style={styles.priceAmount}>
                          {formatAmount(item.indicativePrice, { originalCurrency: "INR" })}
                        </Text>
                        <Text style={styles.priceCycle}>
                          /{item.suggestedBillingCycle === "monthly" ? "mo" : item.suggestedBillingCycle === "quarterly" ? "qtr" : "yr"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.serviceDesc}>{item.description}</Text>

                    {/* Features Chips */}
                    <View style={styles.featuresRow}>
                      {item.features.map((feat, idx) => (
                        <View key={idx} style={styles.featureChip}>
                          <Ionicons name="checkmark" size={11} color="#2E7D32" />
                          <Text style={styles.featureChipText}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Action Row */}
                    <View style={styles.cardActionRow}>
                      <View style={styles.paymentHintRow}>
                        <Ionicons name="card-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={styles.paymentHintText}>{item.defaultPaymentMethod}</Text>
                      </View>

                      <Pressable
                        style={styles.addVaultBtn}
                        onPress={() => {
                          if (onSelectPreset) {
                            onSelectPreset(item);
                          } else if (onSelectService) {
                            onSelectService(item);
                          }
                          onClose();
                        }}
                      >
                        <Ionicons name="add" size={15} color="#FFFFFF" />
                        <Text style={styles.addVaultBtnText}>Add to Vault</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {/* FOOTER WITH CUSTOM SUBSCRIPTION OPTION */}
            <View style={styles.footer}>
              {onOpenCustomSubscription && (
                <Pressable
                  style={styles.customSubBtn}
                  onPress={() => {
                    onOpenCustomSubscription();
                    onClose();
                  }}
                >
                  <Ionicons name="create-outline" size={15} color="#171717" />
                  <Text style={styles.customSubBtnText}>Add Custom Subscription</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeFooterBtn} onPress={onClose}>
                <Text style={styles.closeFooterBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  webBackdrop: {
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "92%",
    backgroundColor: theme.colors.card, // #FFFDF5
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  webModalContainer: {
    maxWidth: 660,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFECCC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#171717",
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: "#FFFDF5",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#171717",
  },
  categoryPillsRow: {
    gap: 6,
    paddingBottom: 2,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  categoryPillActive: {
    backgroundColor: "#171717",
    borderColor: "#171717",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
  },
  body: {
    padding: 16,
  },
  indicativeNotice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFF9E6",
    borderWidth: 1,
    borderColor: "#FFEAA7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  indicativeText: {
    fontSize: 11,
    color: "#856404",
    lineHeight: 15,
    flex: 1,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#171717",
  },
  serviceProvider: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  pricingBox: {
    alignItems: "flex-end",
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#171717",
  },
  priceCycle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  serviceDesc: {
    fontSize: 12,
    color: "#4A4A4A",
    lineHeight: 17,
    marginTop: 8,
  },
  featuresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F7F5EC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureChipText: {
    fontSize: 11,
    color: "#2C3E50",
    fontWeight: "500",
  },
  cardActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0ECE1",
    paddingTop: 10,
    marginTop: 10,
  },
  paymentHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  paymentHintText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  addVaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#171717",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addVaultBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: "#F7F5EC",
  },
  customSubBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: "#FFFFFF",
  },
  customSubBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#171717",
  },
  closeFooterBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#171717",
  },
  closeFooterBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
