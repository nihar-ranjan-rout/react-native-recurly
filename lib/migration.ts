import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_SUBSCRIPTIONS,
  DEFAULT_TRANSACTIONS,
  Subscription,
} from "@/lib/subscriptions";

const LOCAL_SUBS_KEY = "@recurly_subscriptions_v2";

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Safely creates a local backup of current AsyncStorage data before any migration.
 * Preserves all records with a timestamped key.
 */
export const backupLocalData = async (): Promise<string | null> => {
  try {
    const rawSubs = await AsyncStorage.getItem(LOCAL_SUBS_KEY);
    const backupKey = `@recurly_backup_${Date.now()}`;
    if (rawSubs) {
      await AsyncStorage.setItem(backupKey, rawSubs);
      return backupKey;
    }
    return null;
  } catch (error) {
    console.error("Failed to create local backup:", error);
    return null;
  }
};

/**
 * Migrates existing AsyncStorage subscription records to the authenticated user's
 * cloud account in Supabase PostgreSQL while strictly preserving all fields and preventing duplicates.
 *
 * NOTE: As per security requirements, the local AsyncStorage data is NEVER automatically deleted.
 */
export const migrateUserDataToCloud = async (
  userId: string
): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  if (!userId || !isSupabaseConfigured()) {
    return {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: ["Supabase is not configured or user ID is missing."],
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      migratedCount: 0,
      skippedCount: 0,
      errors: ["Supabase client unavailable."],
    };
  }

  const migrationKey = `@recurly_migrated_${userId}`;

  try {
    // 1. Check if already migrated
    const alreadyMigrated = await AsyncStorage.getItem(migrationKey);
    if (alreadyMigrated === "completed") {
      return result;
    }

    // 2. Safely backup before migration
    await backupLocalData();

    // 3. Read local subscriptions
    const rawSubs = await AsyncStorage.getItem(LOCAL_SUBS_KEY);
    let localSubs: Subscription[] = [];
    if (rawSubs) {
      try {
        localSubs = JSON.parse(rawSubs);
      } catch {
        localSubs = DEFAULT_SUBSCRIPTIONS;
      }
    } else {
      localSubs = DEFAULT_SUBSCRIPTIONS;
    }

    // 4. Fetch existing cloud subscriptions to avoid duplicates
    const { data: existingCloud, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("name")
      .eq("user_id", userId);

    if (fetchErr) {
      result.errors.push(`Could not check existing subscriptions: ${fetchErr.message}`);
      result.success = false;
      return result;
    }

    const existingNames = new Set(
      (existingCloud || []).map((s: { name: string }) => s.name.trim().toLowerCase())
    );

    // 5. Migrate each non-duplicate subscription
    for (const sub of localSubs) {
      const normalizedName = sub.name.trim().toLowerCase();
      if (existingNames.has(normalizedName)) {
        result.skippedCount += 1;
        continue;
      }

      const currencyCode =
        sub.currencyCode || (sub.currency === "₹" ? "INR" : sub.currency === "$" ? "USD" : "INR");

      const { error: insertErr } = await supabase.from("subscriptions").insert({
        user_id: userId,
        name: sub.name.trim(),
        category_id: sub.category,
        price: sub.price,
        currency: currencyCode,
        currency_code: currencyCode,
        billing_cycle: sub.billingCycle,
        first_bill_date: sub.firstBillDate || null,
        next_payment_date: sub.nextPaymentDate,
        payment_method: sub.paymentMethod,
        status: sub.status || (sub.active ? "active" : "paused"),
        active: sub.active,
        remind_me: sub.remindMe,
        reminder_days: sub.reminderDays ?? 3,
        notes: sub.notes || null,
        website: sub.website || null,
        tax_applicable: sub.taxApplicable ?? false,
        tax_rate: sub.taxRate ?? 18,
        tax_inclusive: sub.taxInclusive ?? true,
        base_price: sub.basePrice ?? null,
        tax_amount: sub.taxAmount ?? 0,
        gstin: sub.gstin || null,
      });

      if (insertErr) {
        result.errors.push(`Failed to migrate "${sub.name}": ${insertErr.message}`);
      } else {
        result.migratedCount += 1;
        existingNames.add(normalizedName);
      }
    }

    // 6. Migrate default sample transactions if table is empty
    const { data: existingTxs } = await supabase
      .from("payment_transactions")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!existingTxs || existingTxs.length === 0) {
      for (const tx of DEFAULT_TRANSACTIONS) {
        await supabase.from("payment_transactions").insert({
          user_id: userId,
          subscription_name: tx.subscriptionName,
          category_id: tx.category,
          amount: tx.amount,
          currency: tx.currency === "$" ? "USD" : "INR",
          payment_date: new Date().toISOString().split("T")[0],
          payment_method: tx.paymentMethod,
          status: tx.status,
        });
      }
    }

    // 7. Mark migration completed for this user
    await AsyncStorage.setItem(migrationKey, "completed");
  } catch (err: any) {
    result.success = false;
    result.errors.push(err?.message || "Unexpected migration error.");
  }

  return result;
};
