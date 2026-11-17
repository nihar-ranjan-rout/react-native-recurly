import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SupportedCurrency,
  CURRENCY_CONFIGS,
  SYMBOL_TO_CURRENCY_CODE,
  formatCurrency,
  convertCurrencyEstimate,
} from "@/lib/localization";
import { getUserPreferences, updateUserPreferences } from "@/lib/auth";

export const GLOBAL_CURRENCY_STORAGE_KEY = "@recurly_global_currency";

interface CurrencyContextType {
  currency: SupportedCurrency;
  symbol: string;
  setCurrency: (currency: SupportedCurrency) => Promise<void>;
  /**
   * Formats an amount using the globally selected currency.
   * If originalCurrency is provided and differs from selected currency,
   * it provides a clearly demarcated converted estimate or formats in original.
   */
  formatAmount: (
    amount: number,
    options?: {
      compact?: boolean;
      includeSymbol?: boolean;
      decimalPlaces?: number;
      originalCurrency?: string;
      convertIfDifferent?: boolean;
    }
  ) => string;
  /**
   * Converts an amount from its original currency to the active display currency.
   */
  convertAmount: (
    amount: number,
    originalCurrency?: string
  ) => { amount: number; isEstimate: boolean };
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  symbol: "₹",
  setCurrency: async () => {},
  formatAmount: () => "",
  convertAmount: () => ({ amount: 0, isEstimate: false }),
  isLoading: true,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState<SupportedCurrency>("INR");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize currency from persistent storage on app startup
  useEffect(() => {
    let isMounted = true;

    const loadCurrency = async () => {
      try {
        // 1. Check local device storage
        const saved = await AsyncStorage.getItem(GLOBAL_CURRENCY_STORAGE_KEY);
        if (saved && (saved === "INR" || saved === "USD" || saved === "EUR" || saved === "GBP")) {
          if (isMounted) setCurrencyState(saved as SupportedCurrency);
          setIsLoading(false);
          return;
        }

        // 2. Check user preferences from backend/auth
        const prefs = await getUserPreferences();
        if (prefs?.currency) {
          const mapped = SYMBOL_TO_CURRENCY_CODE[prefs.currency] || "INR";
          if (isMounted) setCurrencyState(mapped);
          await AsyncStorage.setItem(GLOBAL_CURRENCY_STORAGE_KEY, mapped);
        } else {
          // Default to INR
          if (isMounted) setCurrencyState("INR");
          await AsyncStorage.setItem(GLOBAL_CURRENCY_STORAGE_KEY, "INR");
        }
      } catch (e) {
        console.warn("Failed to load global currency preference, defaulting to INR:", e);
        if (isMounted) setCurrencyState("INR");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadCurrency();

    return () => {
      isMounted = false;
    };
  }, []);

  const setCurrency = useCallback(async (newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    try {
      await AsyncStorage.setItem(GLOBAL_CURRENCY_STORAGE_KEY, newCurrency);
      await updateUserPreferences({ currency: newCurrency });
    } catch (e) {
      console.error("Failed to save currency preference:", e);
    }
  }, []);

  const convertAmount = useCallback(
    (amount: number, originalCurrency: string = "INR") => {
      const origCode = SYMBOL_TO_CURRENCY_CODE[originalCurrency] || "INR";
      return convertCurrencyEstimate(amount, origCode, currency);
    },
    [currency]
  );

  const formatAmount = useCallback(
    (
      amount: number,
      options?: {
        compact?: boolean;
        includeSymbol?: boolean;
        decimalPlaces?: number;
        originalCurrency?: string;
        convertIfDifferent?: boolean;
      }
    ) => {
      const {
        compact = false,
        includeSymbol = true,
        decimalPlaces = 2,
        originalCurrency,
        convertIfDifferent = true,
      } = options || {};

      const origCode = originalCurrency
        ? SYMBOL_TO_CURRENCY_CODE[originalCurrency] || "INR"
        : currency;

      if (!convertIfDifferent || origCode === currency) {
        // Format in target currency directly
        return formatCurrency(amount, origCode, {
          compact,
          includeSymbol,
          decimalPlaces,
        });
      }

      // Converted estimate using explicit reference rates
      const { amount: convertedVal, isEstimate } = convertCurrencyEstimate(
        amount,
        origCode,
        currency
      );

      const formatted = formatCurrency(convertedVal, currency, {
        compact,
        includeSymbol,
        decimalPlaces,
      });

      return isEstimate ? `${formatted}*` : formatted;
    },
    [currency]
  );

  const symbol = useMemo(() => CURRENCY_CONFIGS[currency]?.symbol || "₹", [currency]);

  const value = useMemo(
    () => ({
      currency,
      symbol,
      setCurrency,
      formatAmount,
      convertAmount,
      isLoading,
    }),
    [currency, symbol, setCurrency, formatAmount, convertAmount, isLoading]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
