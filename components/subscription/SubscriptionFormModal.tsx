import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import Badge from "@/components/ui/Badge";
import CategoryIcon from "@/components/ui/CategoryIcon";
import { theme } from "@/constants/theme";
import { useCurrency } from "@/context/CurrencyContext";
import {
  SupportedCurrency,
  CURRENCY_CONFIGS,
  calculateGST,
  formatIndianDate,
  formatIndianDateWithMonth,
  isValidGSTIN,
} from "@/lib/localization";
import {
  AppPlan,
  getActivePublicPlans,
} from "@/lib/plans";
import {
  BillingCycle,
  checkDuplicateName,
  Subscription,
  SubscriptionCategory,
  SubscriptionStatus,
} from "@/lib/subscriptions";

export const CATEGORY_OPTIONS: {
  id: SubscriptionCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: "streaming", label: "Streaming", icon: "tv-outline", color: "#EF4444" },
  { id: "music", label: "Music", icon: "musical-notes-outline", color: "#2563EB" },
  { id: "software", label: "Software", icon: "code-slash-outline", color: "#3B82F6" },
  { id: "cloud", label: "Cloud", icon: "cloud-outline", color: "#0284C7" },
  { id: "fitness", label: "Fitness", icon: "barbell-outline", color: "#0D9488" },
  { id: "gaming", label: "Gaming", icon: "game-controller-outline", color: "#7C3AED" },
  { id: "reading", label: "Reading", icon: "book-outline", color: "#D97706" },
  { id: "utilities", label: "Utilities", icon: "flash-outline", color: "#EC4899" },
  { id: "other", label: "Other", icon: "grid-outline", color: "#64748B" },
];

export const BILLING_CYCLES: { id: BillingCycle; label: string; period: string }[] = [
  { id: "monthly", label: "Monthly", period: "/mo" },
  { id: "quarterly", label: "Quarterly", period: "/qtr" },
  { id: "half-yearly", label: "Half-Yearly (6 Mo)", period: "/6mo" },
  { id: "yearly", label: "Yearly", period: "/yr" },
  { id: "weekly", label: "Weekly", period: "/wk" },
  { id: "custom", label: "Custom Days", period: "/custom" },
];

import { generateDemoUMN } from "@/lib/payments";

export const PAYMENT_METHODS = [
  { id: "UPI (Google Pay)", label: "Google Pay (UPI)", icon: "logo-google" },
  { id: "UPI (PhonePe)", label: "PhonePe (UPI)", icon: "phone-portrait-outline" },
  { id: "UPI (Paytm)", label: "Paytm (UPI)", icon: "wallet-outline" },
  { id: "BHIM UPI", label: "BHIM UPI", icon: "qr-code-outline" },
  { id: "Generic UPI", label: "Any UPI App / VPA", icon: "send-outline" },
  { id: "RuPay Debit Card", label: "RuPay Debit Card", icon: "card-outline" },
  { id: "RuPay Credit Card", label: "RuPay Credit Card", icon: "card-outline" },
  { id: "Visa Card", label: "Visa Card", icon: "card-outline" },
  { id: "Mastercard", label: "Mastercard", icon: "card-outline" },
  { id: "HDFC NetBanking", label: "HDFC Net Banking", icon: "business-outline" },
  { id: "ICICI NetBanking", label: "ICICI Net Banking", icon: "business-outline" },
  { id: "SBI NetBanking", label: "State Bank of India", icon: "business-outline" },
  { id: "Bank Transfer", label: "Bank Transfer (NEFT/IMPS)", icon: "swap-horizontal-outline" },
  { id: "Amazon Pay", label: "Amazon Pay Wallet", icon: "wallet-outline" },
  { id: "Cash / Other", label: "Cash / Other", icon: "ellipsis-horizontal-outline" },
];

export const GST_RATE_PRESETS = [
  { rate: 0, label: "0% Exempt" },
  { rate: 5, label: "5% Essential" },
  { rate: 12, label: "12% Standard" },
  { rate: 18, label: "18% Services" },
  { rate: 28, label: "28% Special" },
];

export const STATUS_OPTIONS: { id: SubscriptionStatus; label: string; dotColor: string }[] = [
  { id: "active", label: "Active", dotColor: theme.colors.success },
  { id: "paused", label: "Paused", dotColor: theme.colors.warning },
  { id: "cancelled", label: "Cancelled", dotColor: theme.colors.error },
];

export const REMINDER_OPTIONS = [
  { days: 0, label: "No reminder" },
  { days: 1, label: "1 day before" },
  { days: 3, label: "3 days before" },
  { days: 7, label: "7 days before" },
  { days: 14, label: "14 days before" },
];

interface SubscriptionFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: Omit<Subscription, "id">) => Promise<void>;
  initialData?: Partial<Subscription> | null;
  mode?: "create" | "edit";
}

export default function SubscriptionFormModal({
  visible,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}: SubscriptionFormModalProps) {
  const isEdit = mode === "edit";
  const { currency: globalCurrency, symbol: globalSymbol } = useCurrency();

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SubscriptionCategory>("streaming");
  const [price, setPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState<SupportedCurrency>("INR");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [customCycleDays, setCustomCycleDays] = useState("30");
  const [renewalDate, setRenewalDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI (Google Pay)");
  const [status, setStatus] = useState<SubscriptionStatus>("active");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState("");
  const [reminderDays, setReminderDays] = useState(3);

  // GST Tracking states (Phase 2)
  const [taxApplicable, setTaxApplicable] = useState(true);
  const [taxRate, setTaxRate] = useState(18);
  const [isCustomTaxRate, setIsCustomTaxRate] = useState(false);
  const [customTaxRateStr, setCustomTaxRateStr] = useState("18");
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [gstin, setGstin] = useState("");

  // UPI AutoPay Mandate states (Phase 3)
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [mandateMaxAmount, setMandateMaxAmount] = useState("");
  const [mandateRefId, setMandateRefId] = useState("");

  // Validation & feedback states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePickerDialog, setShowDatePickerDialog] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<AppPlan[]>([]);
  const [selectedCatalogPlanId, setSelectedCatalogPlanId] = useState<string | null>(null);

  // Initialize or reset form on visibility change
  useEffect(() => {
    if (visible) {
      if (mode === "create") {
        getActivePublicPlans().then((p) => setAvailablePlans(p));
        setSelectedCatalogPlanId(null);
      }
      if (initialData) {
        setName(initialData.name || "");
        setCategory(initialData.category || "streaming");
        setPrice(initialData.price !== undefined ? initialData.price.toString() : "");
        setCurrencyCode((initialData.currencyCode as SupportedCurrency) || (initialData.currency === "$" ? "USD" : "INR"));
        setBillingCycle(initialData.billingCycle || "monthly");
        setCustomCycleDays(initialData.customCycleDays ? initialData.customCycleDays.toString() : "30");
        setRenewalDate(
          initialData.nextPaymentDate || getDefaultRenewalDate("monthly")
        );
        setPaymentMethod(initialData.paymentMethod || "UPI (Google Pay)");
        setStatus(
          initialData.status || (initialData.active ? "active" : "paused")
        );
        setNotes(initialData.notes || "");
        setWebsite(initialData.website || "");
        setReminderDays(
          initialData.reminderDays !== undefined
            ? initialData.reminderDays
            : initialData.remindMe
            ? 3
            : 0
        );
        // GST fields
        setTaxApplicable(initialData.taxApplicable ?? false);
        setTaxRate(initialData.taxRate ?? 18);
        setTaxInclusive(initialData.taxInclusive ?? true);
        setGstin(initialData.gstin || "");
        // AutoPay Mandate fields
        setAutoPayEnabled(initialData.autoPayEnabled ?? false);
        setMandateMaxAmount(
          initialData.mandateMaxAmount ? initialData.mandateMaxAmount.toString() : ""
        );
        setMandateRefId(initialData.mandateRefId || generateDemoUMN());
      } else {
        // Defaults for new subscription
        setName("");
        setCategory("streaming");
        setPrice("");
        setCurrencyCode(globalCurrency || "INR");
        setBillingCycle("monthly");
        setCustomCycleDays("30");
        setRenewalDate(getDefaultRenewalDate("monthly"));
        setPaymentMethod("UPI (Google Pay)");
        setStatus("active");
        setNotes("");
        setWebsite("");
        setReminderDays(3);
        setTaxApplicable(true);
        setTaxRate(18);
        setTaxInclusive(true);
        setGstin("");
        setAutoPayEnabled(false);
        setMandateMaxAmount("");
        setMandateRefId(generateDemoUMN());
      }
      setErrors({});
      setIsDuplicate(false);
      setIsSubmitting(false);
    }
  }, [visible, initialData, mode, globalCurrency]);

  const handleSelectCatalogPlan = (plan: AppPlan) => {
    setSelectedCatalogPlanId(plan.id);
    setName(plan.name);
    setCategory(plan.category);
    setPrice(plan.price.toString());
    setBillingCycle(plan.billingCycle);
    setWebsite(plan.websiteUrl || "");
    const bulletFeatures =
      plan.features && plan.features.length > 0
        ? "\n\nPlan Features:\n• " + plan.features.join("\n• ")
        : "";
    setNotes((plan.description || "") + bulletFeatures);
    setErrors({});
  };

  // Check duplicate name
  useEffect(() => {
    let active = true;
    const checkDup = async () => {
      if (name.trim().length >= 2) {
        const dup = await checkDuplicateName(name, initialData?.id);
        if (active) setIsDuplicate(dup);
      } else {
        if (active) setIsDuplicate(false);
      }
    };
    checkDup();
    return () => {
      active = false;
    };
  }, [name, initialData?.id]);

  function getDefaultRenewalDate(cycle: BillingCycle): string {
    const d = new Date();
    if (cycle === "weekly") d.setDate(d.getDate() + 7);
    else if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
    else if (cycle === "quarterly") d.setMonth(d.getMonth() + 3);
    else if (cycle === "half-yearly") d.setMonth(d.getMonth() + 6);
    else if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  }

  const setDateByDaysOffset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setRenewalDate(d.toISOString().split("T")[0]);
    if (errors.renewalDate) {
      setErrors((prev) => ({ ...prev, renewalDate: "" }));
    }
  };

  const parsedPriceNum = parseFloat(price.replace(/[^0-9.]/g, "").trim()) || 0;
  const effectiveTaxRate = isCustomTaxRate
    ? parseFloat(customTaxRateStr) || 0
    : taxRate;

  // Live GST Calculation
  const gstBreakdown = calculateGST(parsedPriceNum, {
    taxApplicable,
    taxRate: effectiveTaxRate,
    taxInclusive,
    gstin,
  });

  const isGstinValid = gstin.trim().length > 0 ? isValidGSTIN(gstin) : true;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Service name is required.";
    }

    if (!category) {
      newErrors.category = "Please select a category.";
    }

    if (!price.trim()) {
      newErrors.price = "Price is required.";
    } else if (isNaN(parsedPriceNum) || parsedPriceNum <= 0) {
      newErrors.price = "Enter a valid positive price.";
    }

    if (!billingCycle) {
      newErrors.billingCycle = "Billing cycle is required.";
    }

    if (billingCycle === "custom") {
      const days = parseInt(customCycleDays, 10);
      if (isNaN(days) || days <= 0) {
        newErrors.customCycleDays = "Enter valid billing cycle days.";
      }
    }

    if (!renewalDate || !/^\d{4}-\d{2}-\d{2}$/.test(renewalDate)) {
      newErrors.renewalDate = "Valid renewal date is required (YYYY-MM-DD).";
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Payment method is required.";
    }

    if (gstin.trim().length > 0 && !isValidGSTIN(gstin)) {
      newErrors.gstin = "Invalid Indian GSTIN (e.g., 27AAPFU0939F1ZV).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const cleanPrice = parsedPriceNum;
      const symbol = CURRENCY_CONFIGS[currencyCode]?.symbol || "₹";

      const payload: Omit<Subscription, "id"> = {
        name: name.trim(),
        category,
        price: cleanPrice,
        currency: symbol,
        currencyCode,
        billingCycle,
        customCycleDays:
          billingCycle === "custom" ? parseInt(customCycleDays, 10) : undefined,
        nextPaymentDate: renewalDate,
        paymentMethod: paymentMethod.trim(),
        active: status === "active",
        status,
        notes: notes.trim() || undefined,
        website: website.trim() || undefined,
        remindMe: reminderDays > 0,
        reminderDays,
        taxApplicable,
        taxRate: effectiveTaxRate,
        taxInclusive,
        basePrice: gstBreakdown.basePrice,
        taxAmount: gstBreakdown.taxAmount,
        gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
        autoPayEnabled,
        mandateMaxAmount: autoPayEnabled
          ? parseFloat(mandateMaxAmount) || Math.round(cleanPrice * 1.5)
          : undefined,
        mandateRefId: autoPayEnabled ? mandateRefId || generateDemoUMN() : undefined,
        mandateStatus: autoPayEnabled ? "ACTIVE" : "NOT_CREATED",
      };

      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Submit subscription error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCurrencyConfig = CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.INR;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIconWrap}>
                  <Ionicons
                    name={isEdit ? "create-outline" : "add-circle-outline"}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={styles.modalTitle}>
                      {isEdit ? "Edit Subscription" : "Add Subscription"}
                    </Text>
                    <Badge
                      label={isEdit ? "EDIT" : "INDIA"}
                      variant={isEdit ? "warning" : "primary"}
                    />
                  </View>
                  <Text style={styles.modalSubtitle}>
                    {isEdit
                      ? "Update plan terms, tax rate, schedule, and details."
                      : "Catalog recurring service with Indian Rupee (₹) & GST."}
                  </Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={onClose}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </View>

            {/* FORM SCROLL CONTENT */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* CHOOSE FROM APP CATALOG */}
              {!isEdit && availablePlans.length > 0 && (
                <View style={styles.catalogSection}>
                  <View style={styles.catalogSectionHeader}>
                    <Ionicons
                      name="sparkles"
                      size={15}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.catalogSectionTitle}>
                      POPULAR INDIAN PLANS & CATALOG
                    </Text>
                  </View>
                  <Text style={styles.catalogSectionSubtitle}>
                    Auto-populate service name, pricing, and features:
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catalogScroll}
                  >
                    {availablePlans.map((plan) => {
                      const isPicked = selectedCatalogPlanId === plan.id;
                      return (
                        <Pressable
                          key={plan.id}
                          style={[
                            styles.catalogCard,
                            isPicked && styles.catalogCardActive,
                          ]}
                          onPress={() => handleSelectCatalogPlan(plan)}
                        >
                          <CategoryIcon category={plan.category} size={28} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.catalogCardName} numberOfLines={1}>
                              {plan.name}
                            </Text>
                            <Text style={styles.catalogCardMeta}>
                              ₹{plan.price.toFixed(2)}/{plan.billingCycle.slice(0, 2)}
                            </Text>
                          </View>
                          {isPicked && (
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color={theme.colors.primary}
                            />
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* 1. SERVICE NAME */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>SERVICE NAME *</Text>
                  {isDuplicate && (
                    <Text style={styles.duplicateWarning}>
                      Already in portfolio
                    </Text>
                  )}
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    errors.name ? styles.inputError : null,
                  ]}
                >
                  <Ionicons
                    name="sparkles-outline"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Netflix, Spotify, Amazon Prime, Hotstar"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errors.name) {
                        setErrors((prev) => ({ ...prev, name: "" }));
                      }
                    }}
                    autoCapitalize="words"
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </View>

              {/* 2. CATEGORY SELECTOR */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CATEGORY *</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORY_OPTIONS.map((item) => {
                    const isSelected = category === item.id;
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.categoryPill,
                          isSelected && styles.categoryPillActive,
                        ]}
                        onPress={() => {
                          setCategory(item.id);
                          if (errors.category) {
                            setErrors((prev) => ({ ...prev, category: "" }));
                          }
                        }}
                      >
                        <CategoryIcon category={item.id} size={18} />
                        <Text
                          style={[
                            styles.categoryPillText,
                            isSelected && styles.categoryPillTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.category ? (
                  <Text style={styles.errorText}>{errors.category}</Text>
                ) : null}
              </View>

              {/* 3. CURRENCY SELECTION */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>CURRENCY *</Text>
                <View style={styles.currencyRow}>
                  {(["INR", "USD", "EUR", "GBP"] as SupportedCurrency[]).map((c) => {
                    const isSelected = currencyCode === c;
                    const config = CURRENCY_CONFIGS[c];
                    return (
                      <Pressable
                        key={c}
                        style={[
                          styles.currencyPill,
                          isSelected && styles.currencyPillActive,
                        ]}
                        onPress={() => setCurrencyCode(c)}
                      >
                        <Text
                          style={[
                            styles.currencyPillSymbol,
                            isSelected && styles.currencyPillSymbolActive,
                          ]}
                        >
                          {config.symbol}
                        </Text>
                        <Text
                          style={[
                            styles.currencyPillCode,
                            isSelected && styles.currencyPillCodeActive,
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 4 & 5. PRICE AND BILLING CYCLE */}
              <View style={styles.twoColumnRow}>
                {/* Price */}
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>PRICE *</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.price ? styles.inputError : null,
                    ]}
                  >
                    <Text style={styles.currencyPrefix}>
                      {activeCurrencyConfig.symbol}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={currencyCode === "INR" ? "1,499.00" : "14.99"}
                      placeholderTextColor={theme.colors.inputPlaceholder}
                      value={price}
                      onChangeText={(val) => {
                        setPrice(val);
                        if (errors.price) {
                          setErrors((prev) => ({ ...prev, price: "" }));
                        }
                      }}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  {errors.price ? (
                    <Text style={styles.errorText}>{errors.price}</Text>
                  ) : null}
                </View>

                {/* Billing Cycle */}
                <View style={[styles.fieldGroup, { flex: 1.25 }]}>
                  <Text style={styles.fieldLabel}>BILLING CYCLE *</Text>
                  <View style={styles.cycleGrid}>
                    {BILLING_CYCLES.map((c) => {
                      const isSelected = billingCycle === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          style={[
                            styles.cyclePill,
                            isSelected && styles.cyclePillActive,
                          ]}
                          onPress={() => setBillingCycle(c.id)}
                        >
                          <Text
                            style={[
                              styles.cyclePillText,
                              isSelected && styles.cyclePillTextActive,
                            ]}
                          >
                            {c.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* CUSTOM CYCLE DAYS (If custom selected) */}
              {billingCycle === "custom" && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CUSTOM BILLING INTERVAL (DAYS) *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="repeat-outline" size={18} color={theme.colors.primary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 28, 45, 90"
                      value={customCycleDays}
                      onChangeText={setCustomCycleDays}
                      keyboardType="number-pad"
                    />
                  </View>
                  {errors.customCycleDays ? (
                    <Text style={styles.errorText}>{errors.customCycleDays}</Text>
                  ) : null}
                </View>
              )}

              {/* 6. GST TRACKING & TAX ENGINE (PHASE 2) */}
              <View style={styles.gstCard}>
                <View style={styles.gstHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View>
                      <Text style={styles.gstTitle}>GST & TAX TRACKING</Text>
                      <Text style={styles.gstSubtitle}>
                        Configure tax rates and business expense claims
                      </Text>
                    </View>
                  </View>

                  {/* Toggle Button */}
                  <Pressable
                    style={[
                      styles.gstToggleBtn,
                      taxApplicable && styles.gstToggleBtnActive,
                    ]}
                    onPress={() => setTaxApplicable(!taxApplicable)}
                  >
                    <Text
                      style={[
                        styles.gstToggleBtnText,
                        taxApplicable && styles.gstToggleBtnTextActive,
                      ]}
                    >
                      {taxApplicable ? "TRACKING ON" : "EXEMPT / OFF"}
                    </Text>
                  </Pressable>
                </View>

                {taxApplicable && (
                  <View style={styles.gstBody}>
                    {/* TAX RATE SELECTOR */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>APPLICABLE GST RATE</Text>
                      <View style={styles.gstPresetsRow}>
                        {GST_RATE_PRESETS.map((p) => {
                          const isPicked = !isCustomTaxRate && taxRate === p.rate;
                          return (
                            <Pressable
                              key={p.rate}
                              style={[
                                styles.gstRatePill,
                                isPicked && styles.gstRatePillActive,
                              ]}
                              onPress={() => {
                                setIsCustomTaxRate(false);
                                setTaxRate(p.rate);
                              }}
                            >
                              <Text
                                style={[
                                  styles.gstRatePillText,
                                  isPicked && styles.gstRatePillTextActive,
                                ]}
                              >
                                {p.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>

                    {/* TAX INCLUSIVE VS EXCLUSIVE TOGGLE */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>PRICE TAX TREATMENT</Text>
                      <View style={styles.treatmentRow}>
                        <Pressable
                          style={[
                            styles.treatmentPill,
                            taxInclusive && styles.treatmentPillActive,
                          ]}
                          onPress={() => setTaxInclusive(true)}
                        >
                          <Ionicons
                            name={taxInclusive ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={taxInclusive ? theme.colors.primary : theme.colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.treatmentText,
                              taxInclusive && styles.treatmentTextActive,
                            ]}
                          >
                            Tax-Inclusive (Price includes GST)
                          </Text>
                        </Pressable>

                        <Pressable
                          style={[
                            styles.treatmentPill,
                            !taxInclusive && styles.treatmentPillActive,
                          ]}
                          onPress={() => setTaxInclusive(false)}
                        >
                          <Ionicons
                            name={!taxInclusive ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={!taxInclusive ? theme.colors.primary : theme.colors.textMuted}
                          />
                          <Text
                            style={[
                              styles.treatmentText,
                              !taxInclusive && styles.treatmentTextActive,
                            ]}
                          >
                            Tax-Exclusive (+ GST added)
                          </Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* LIVE TAX CALCULATION BREAKDOWN */}
                    {parsedPriceNum > 0 && (
                      <View style={styles.breakdownBox}>
                        <View style={styles.breakdownHeader}>
                          <Text style={styles.breakdownTitle}>
                            TAX BREAKDOWN (RATE: {effectiveTaxRate}%)
                          </Text>
                          <Text style={styles.breakdownState}>
                            CGST ({effectiveTaxRate / 2}%) + SGST ({effectiveTaxRate / 2}%)
                          </Text>
                        </View>

                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>Base Price:</Text>
                          <Text style={styles.breakdownVal}>
                            {activeCurrencyConfig.symbol}
                            {gstBreakdown.basePrice.toFixed(2)}
                          </Text>
                        </View>

                        <View style={styles.breakdownRow}>
                          <Text style={styles.breakdownLabel}>
                            GST Amount ({effectiveTaxRate}%):
                          </Text>
                          <Text style={styles.breakdownVal}>
                            +{activeCurrencyConfig.symbol}
                            {gstBreakdown.taxAmount.toFixed(2)}
                          </Text>
                        </View>

                        <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                          <Text style={styles.breakdownTotalLabel}>Total Invoiced Amount:</Text>
                          <Text style={styles.breakdownTotalVal}>
                            {activeCurrencyConfig.symbol}
                            {gstBreakdown.totalPrice.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* OPTIONAL GSTIN INPUT */}
                    <View style={styles.fieldGroup}>
                      <View style={styles.fieldLabelRow}>
                        <Text style={styles.fieldLabel}>BUSINESS GSTIN (OPTIONAL)</Text>
                        {gstin.trim().length > 0 && (
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: isGstinValid ? theme.colors.success : theme.colors.error,
                            }}
                          >
                            {isGstinValid ? "VALID FORMAT" : "INVALID GSTIN"}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.inputContainer,
                          gstin.trim().length > 0 && !isGstinValid ? styles.inputError : null,
                        ]}
                      >
                        <Ionicons
                          name="business-outline"
                          size={18}
                          color={isGstinValid && gstin.trim().length > 0 ? theme.colors.success : theme.colors.textMuted}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 27AAPFU0939F1ZV (15 characters)"
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          value={gstin}
                          onChangeText={(val) => setGstin(val.toUpperCase().trim())}
                          autoCapitalize="characters"
                          maxLength={15}
                        />
                      </View>
                      {errors.gstin ? (
                        <Text style={styles.errorText}>{errors.gstin}</Text>
                      ) : (
                        <Text style={styles.fieldHint}>
                          Required only if claiming Input Tax Credit (ITC) for business expenses.
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* 7. NEXT RENEWAL DATE PICKER */}
              <View style={styles.fieldGroup}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>NEXT RENEWAL DATE (DD/MM/YYYY) *</Text>
                  <Text style={styles.fieldHint}>
                    IST (Asia/Kolkata)
                  </Text>
                </View>

                {/* Date Display Card with Preset Shortcuts */}
                <View style={styles.datePickerCard}>
                  <View style={styles.dateDisplayRow}>
                    <View style={styles.dateInfoLeft}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.dateDisplayText}>
                        {formatIndianDate(renewalDate)
                          ? `${formatIndianDate(renewalDate)} (${formatIndianDateWithMonth(renewalDate)})`
                          : "Select renewal date"}
                      </Text>
                    </View>

                    {/* On Web: Native Date Input Trigger */}
                    {Platform.OS === "web" ? (
                      <View style={styles.webDatePickerWrap}>
                        <Pressable style={styles.datePickerBtn}>
                          <Ionicons
                            name="pencil-outline"
                            size={14}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.datePickerBtnText}>Pick Date</Text>
                        </Pressable>
                        <input
                          type="date"
                          value={renewalDate}
                          onChange={(e: any) => {
                            if (e.target.value) {
                              setRenewalDate(e.target.value);
                              if (errors.renewalDate) {
                                setErrors((prev) => ({
                                  ...prev,
                                  renewalDate: "",
                                }));
                              }
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: 0,
                            cursor: "pointer",
                            width: "100%",
                            height: "100%",
                          }}
                        />
                      </View>
                    ) : (
                      <Pressable
                        style={styles.datePickerBtn}
                        onPress={() => setShowDatePickerDialog(true)}
                      >
                        <Ionicons
                          name="pencil-outline"
                          size={14}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.datePickerBtnText}>Change</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* QUICK PRESETS ROW */}
                  <View style={styles.presetsRow}>
                    <Text style={styles.presetsLabel}>Quick:</Text>
                    <Pressable
                      style={styles.presetChip}
                      onPress={() => setDateByDaysOffset(7)}
                    >
                      <Text style={styles.presetChipText}>+7 Days</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetChip}
                      onPress={() => setDateByDaysOffset(14)}
                    >
                      <Text style={styles.presetChipText}>+14 Days</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetChip}
                      onPress={() => setDateByDaysOffset(30)}
                    >
                      <Text style={styles.presetChipText}>+1 Month</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetChip}
                      onPress={() => setDateByDaysOffset(90)}
                    >
                      <Text style={styles.presetChipText}>+3 Months</Text>
                    </Pressable>
                    <Pressable
                      style={styles.presetChip}
                      onPress={() => setDateByDaysOffset(365)}
                    >
                      <Text style={styles.presetChipText}>+1 Year</Text>
                    </Pressable>
                  </View>
                </View>
                {errors.renewalDate ? (
                  <Text style={styles.errorText}>{errors.renewalDate}</Text>
                ) : null}
              </View>

              {/* 8. PAYMENT METHOD SELECTOR */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>PAYMENT METHOD *</Text>
                <View style={styles.paymentMethodsWrap}>
                  {PAYMENT_METHODS.map((pm) => {
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <Pressable
                        key={pm.id}
                        style={[
                          styles.paymentChip,
                          isSelected && styles.paymentChipActive,
                        ]}
                        onPress={() => setPaymentMethod(pm.id)}
                      >
                        <Ionicons
                          name={pm.icon as any}
                          size={15}
                          color={
                            isSelected
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.paymentChipText,
                            isSelected && styles.paymentChipTextActive,
                          ]}
                        >
                          {pm.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 8.5. UPI AUTOPAY MANDATE TRACKING SECTION (PHASE 3) */}
              <View style={styles.gstCard}>
                <View style={styles.gstHeaderRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <Ionicons
                      name="repeat"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gstTitle}>UPI AUTOPAY & RECURRING MANDATE</Text>
                      <Text style={styles.gstSubtitle}>
                        Track NPCI e-Mandate standing debit instruction
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.gstToggleBtn,
                      autoPayEnabled && styles.gstToggleBtnActive,
                    ]}
                    onPress={() => setAutoPayEnabled(!autoPayEnabled)}
                  >
                    <Text
                      style={[
                        styles.gstToggleBtnText,
                        autoPayEnabled && styles.gstToggleBtnTextActive,
                      ]}
                    >
                      {autoPayEnabled ? "AUTOPAY ON" : "MANUAL PAY"}
                    </Text>
                  </Pressable>
                </View>

                {autoPayEnabled && (
                  <View style={styles.gstBody}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>MAXIMUM MANDATE AMOUNT CAP (₹)</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="shield-outline" size={18} color={theme.colors.primary} />
                        <TextInput
                          style={styles.textInput}
                          placeholder={
                            parsedPriceNum > 0
                              ? `e.g. ${(parsedPriceNum * 1.5).toFixed(0)}`
                              : "e.g. 1000"
                          }
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          value={mandateMaxAmount}
                          onChangeText={setMandateMaxAmount}
                          keyboardType="numeric"
                        />
                      </View>
                      <Text style={styles.fieldHint}>
                        Mandate safety cap under RBI / NPCI recurring payment guidelines.
                      </Text>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>UNIQUE MANDATE NUMBER (UMN)</Text>
                      <View style={styles.inputContainer}>
                        <Ionicons name="key-outline" size={18} color={theme.colors.textMuted} />
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. UMN-2026-98124"
                          placeholderTextColor={theme.colors.inputPlaceholder}
                          value={mandateRefId}
                          onChangeText={setMandateRefId}
                          autoCapitalize="characters"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* 9. STATUS OPTIONS */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>SUBSCRIPTION STATUS</Text>
                <View style={styles.statusOptionsRow}>
                  {STATUS_OPTIONS.map((st) => {
                    const isSelected = status === st.id;
                    return (
                      <Pressable
                        key={st.id}
                        style={[
                          styles.statusOptionChip,
                          isSelected && styles.statusOptionChipActive,
                        ]}
                        onPress={() => setStatus(st.id)}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: st.dotColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusOptionText,
                            isSelected && styles.statusOptionTextActive,
                          ]}
                        >
                          {st.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 10. REMINDER SELECTOR */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>RENEWAL REMINDER</Text>
                <View style={styles.remindersWrap}>
                  {REMINDER_OPTIONS.map((rem) => {
                    const isSelected = reminderDays === rem.days;
                    return (
                      <Pressable
                        key={rem.days}
                        style={[
                          styles.reminderChip,
                          isSelected && styles.reminderChipActive,
                        ]}
                        onPress={() => setReminderDays(rem.days)}
                      >
                        <Ionicons
                          name={
                            isSelected
                              ? "notifications"
                              : "notifications-outline"
                          }
                          size={14}
                          color={
                            isSelected
                              ? theme.colors.primary
                              : theme.colors.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.reminderChipText,
                            isSelected && styles.reminderChipTextActive,
                          ]}
                        >
                          {rem.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* 11. OPTIONAL WEBSITE / URL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>WEBSITE / SERVICE URL (OPTIONAL)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="globe-outline"
                    size={17}
                    color={theme.colors.textMuted}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. spotify.com, netflix.com, primevideo.com"
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={website}
                    onChangeText={setWebsite}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              </View>

              {/* 12. OPTIONAL NOTES */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>DESCRIPTION / NOTES (OPTIONAL)</Text>
                <View style={[styles.inputContainer, styles.textAreaContainer]}>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
                    placeholder="e.g. Family plan with 4 screens, billed to corporate credit card..."
                    placeholderTextColor={theme.colors.inputPlaceholder}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>

            {/* MODAL FOOTER BUTTONS */}
            <View style={styles.footerRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={isEdit ? "checkmark-circle" : "add"}
                    size={18}
                    color="#FFFFFF"
                  />
                )}
                <Text style={styles.submitButtonText}>
                  {isSubmitting
                    ? isEdit
                      ? "Saving..."
                      : "Adding..."
                    : isEdit
                    ? "Save Changes"
                    : "Add Subscription"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* MOBILE DATE PICKER DIALOG */}
        {showDatePickerDialog && (
          <Modal
            transparent
            animationType="fade"
            visible={showDatePickerDialog}
            onRequestClose={() => setShowDatePickerDialog(false)}
          >
            <View style={styles.nestedDialogOverlay}>
              <View style={styles.nestedDialogCard}>
                <Text style={styles.nestedDialogTitle}>Select Renewal Date</Text>
                <Text style={styles.nestedDialogSubtitle}>
                  Choose a preset or enter date (YYYY-MM-DD):
                </Text>

                <View style={styles.nestedInputRow}>
                  <TextInput
                    style={styles.nestedTextInput}
                    placeholder="YYYY-MM-DD"
                    value={renewalDate}
                    onChangeText={setRenewalDate}
                  />
                </View>

                <View style={styles.nestedPresetsWrap}>
                  <Pressable
                    style={styles.presetChip}
                    onPress={() => {
                      setDateByDaysOffset(7);
                      setShowDatePickerDialog(false);
                    }}
                  >
                    <Text style={styles.presetChipText}>+7 Days</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetChip}
                    onPress={() => {
                      setDateByDaysOffset(30);
                      setShowDatePickerDialog(false);
                    }}
                  >
                    <Text style={styles.presetChipText}>+1 Month</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetChip}
                    onPress={() => {
                      setDateByDaysOffset(90);
                      setShowDatePickerDialog(false);
                    }}
                  >
                    <Text style={styles.presetChipText}>+3 Months</Text>
                  </Pressable>
                  <Pressable
                    style={styles.presetChip}
                    onPress={() => {
                      setDateByDaysOffset(365);
                      setShowDatePickerDialog(false);
                    }}
                  >
                    <Text style={styles.presetChipText}>+1 Year</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.nestedDoneButton}
                  onPress={() => setShowDatePickerDialog(false)}
                >
                  <Text style={styles.nestedDoneButtonText}>Confirm Date</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
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
  modalCard: {
    width: "100%",
    maxWidth: 620,
    maxHeight: "94%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.modal,
    overflow: "hidden",
  },

  // HEADER
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.card,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  buttonPressed: {
    opacity: 0.8,
  },

  // FORM SCROLL
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 18,
  },

  // CATALOG SECTION
  catalogSection: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 8,
  },
  catalogSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catalogSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 0.6,
  },
  catalogSectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  catalogScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  catalogCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  catalogCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  catalogCardName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.text,
  },
  catalogCardMeta: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // FIELDS
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  fieldHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  duplicateWarning: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.warning,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 12,
    gap: 10,
    ...theme.shadows.subtle,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: "#FEF2F2",
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    color: theme.colors.text,
    outlineWidth: 0,
  } as any,
  errorText: {
    fontSize: 11.5,
    color: theme.colors.error,
    fontWeight: "600",
    marginTop: 2,
  },

  // CATEGORY GRID
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  categoryPillTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },

  // CURRENCY ROW
  currencyRow: {
    flexDirection: "row",
    gap: 8,
  },
  currencyPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  currencyPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  currencyPillSymbol: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textSecondary,
  },
  currencyPillSymbolActive: {
    color: theme.colors.primary,
  },
  currencyPillCode: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  currencyPillCodeActive: {
    color: theme.colors.primary,
  },

  // TWO COLUMN
  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  cycleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  cyclePill: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cyclePillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  cyclePillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  cyclePillTextActive: {
    color: theme.colors.primary,
    fontWeight: "800",
  },

  // GST CARD
  gstCard: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 16,
    gap: 14,
  },
  gstHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gstTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  gstSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  gstToggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  gstToggleBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  gstToggleBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  gstToggleBtnTextActive: {
    color: "#FFFFFF",
  },
  gstBody: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 12,
  },
  gstPresetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  gstRatePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  gstRatePillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  gstRatePillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  gstRatePillTextActive: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
  treatmentRow: {
    gap: 8,
  },
  treatmentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  treatmentPillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: "#F3FAF7",
  },
  treatmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  treatmentTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  breakdownBox: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  breakdownState: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.text,
  },
  breakdownTotalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 6,
    marginTop: 2,
  },
  breakdownTotalLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    color: theme.colors.text,
  },
  breakdownTotalVal: {
    fontSize: 13.5,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  // DATE PICKER CARD
  datePickerCard: {
    backgroundColor: theme.colors.backgroundAlt,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    padding: 12,
    gap: 10,
  },
  dateDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateDisplayText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  webDatePickerWrap: {
    position: "relative",
  },
  datePickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.card,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  datePickerBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
    paddingTop: 8,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    marginRight: 2,
  },
  presetChip: {
    backgroundColor: theme.colors.card,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.text,
  },

  // PAYMENT METHODS
  paymentMethodsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  paymentChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  paymentChipTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },

  // STATUS OPTIONS
  statusOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusOptionChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  statusOptionChipActive: {
    backgroundColor: "#FFFFFF",
    borderColor: theme.colors.primary,
    ...theme.shadows.subtle,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOptionText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  statusOptionTextActive: {
    color: theme.colors.text,
    fontWeight: "700",
  },

  // REMINDERS
  remindersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  reminderChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  reminderChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  reminderChipTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },

  // TEXT AREA
  textAreaContainer: {
    height: 78,
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  textAreaInput: {
    textAlignVertical: "top",
    height: "100%",
  },

  // FOOTER
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.backgroundAlt,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.subtle,
    ...(Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}),
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // NESTED DIALOG (NATIVE DATE)
  nestedDialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  nestedDialogCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    gap: 12,
    ...theme.shadows.modal,
  },
  nestedDialogTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.text,
  },
  nestedDialogSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  nestedInputRow: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  nestedTextInput: {
    fontSize: 14,
    color: theme.colors.text,
  },
  nestedPresetsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nestedDoneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: 6,
  },
  nestedDoneButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
