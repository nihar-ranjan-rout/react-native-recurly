import { Platform } from "react-native";

export const theme = {
  colors: {
    // Primary Design Spec Palette
    background: "#DDEBE5", // Soft mint-green background
    backgroundAlt: "#D2E3DC",
    backgroundMintLight: "#E6F0EB",
    card: "#FFFDF5", // Cream and off-white surfaces
    cardHover: "#F7F3E7",
    cardBorder: "#E9E6DC", // Subtle border
    divider: "#E9E6DC",

    // Typography
    text: "#171717", // Black and dark charcoal typography
    textSecondary: "#777777", // Secondary text
    textMuted: "#999999",
    textInverse: "#FFFFFF",

    // Accents & Actions
    primary: "#171717", // Bold dark action button / active tab
    primaryHover: "#2A2A2A",
    primaryLight: "#ECE7DA",
    primaryBorder: "#DCD5C4",

    accent: "#F28C45", // Orange/coral accent color
    accentHover: "#E07B34",
    accentLight: "#FDEEE3",
    accentBorder: "#F9CCA8",
    accentText: "#C45E1E",

    // Semantic Status Indicators
    success: "#2E7D32",
    successBg: "#EAF4E7",
    successBorder: "#B7D9A8", // Success Green from spec
    successText: "#1B5E20",

    warning: "#F28C45", // Accent Orange
    warningBg: "#FFF3E8",
    warningBorder: "#FCD5B5",
    warningText: "#C45E1E",

    error: "#DC2626",
    errorBg: "#FEF2F2",
    errorBorder: "#FCA5A5",
    errorText: "#991B1B",

    // Form inputs
    inputBg: "#FFFDF5",
    inputBorder: "#E9E6DC",
    inputBorderFocused: "#171717",
    inputPlaceholder: "#999999",

    // Surface dark accent (for contrast pill/card)
    darkNavy: "#171717",
    darkNavyCard: "#242424",
    darkNavyBorder: "#383838",
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  borderRadius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 26,
    full: 9999,
  },

  shadows: {
    none: {
      shadowColor: "transparent",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    subtle: {
      shadowColor: "#171717",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
      ...(Platform.OS === "web"
        ? ({ boxShadow: "0 2px 6px 0 rgba(23, 23, 23, 0.03)" } as any)
        : {}),
    },
    card: {
      shadowColor: "#171717",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
      ...(Platform.OS === "web"
        ? ({
            boxShadow:
              "0 4px 12px 0 rgba(23, 23, 23, 0.04), 0 1px 3px 0 rgba(23, 23, 23, 0.02)",
          } as any)
        : {}),
    },
    hover: {
      shadowColor: "#171717",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
      elevation: 4,
      ...(Platform.OS === "web"
        ? ({
            boxShadow:
              "0 8px 20px 0 rgba(23, 23, 23, 0.06), 0 2px 6px 0 rgba(23, 23, 23, 0.03)",
          } as any)
        : {}),
    },
    modal: {
      shadowColor: "#171717",
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.12,
      shadowRadius: 32,
      elevation: 10,
      ...(Platform.OS === "web"
        ? ({
            boxShadow:
              "0 20px 40px -10px rgba(23, 23, 23, 0.14), 0 4px 12px 0 rgba(23, 23, 23, 0.05)",
          } as any)
        : {}),
    },
  },

  typography: {
    display: {
      fontSize: 32,
      fontWeight: "800" as const,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: "#171717",
    },
    h1: {
      fontSize: 24,
      fontWeight: "800" as const,
      lineHeight: 30,
      letterSpacing: -0.4,
      color: "#171717",
    },
    h2: {
      fontSize: 20,
      fontWeight: "700" as const,
      lineHeight: 26,
      letterSpacing: -0.3,
      color: "#171717",
    },
    h3: {
      fontSize: 16,
      fontWeight: "700" as const,
      lineHeight: 22,
      letterSpacing: -0.2,
      color: "#171717",
    },
    body: {
      fontSize: 14,
      fontWeight: "400" as const,
      lineHeight: 20,
      color: "#171717",
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: "500" as const,
      lineHeight: 20,
      color: "#171717",
    },
    bodySemibold: {
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
      color: "#171717",
    },
    small: {
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 16,
      color: "#777777",
    },
    caption: {
      fontSize: 11,
      fontWeight: "700" as const,
      lineHeight: 14,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
      color: "#777777",
    },
    button: {
      fontSize: 14,
      fontWeight: "700" as const,
      lineHeight: 18,
      letterSpacing: -0.1,
    },
  },
};
