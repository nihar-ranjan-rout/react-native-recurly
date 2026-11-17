export const colors = {
  // Brand backgrounds
  bgGradientStart: '#E3EFEA',
  bgGradientEnd: '#DCEAE4',
  bgDotGrid: 'rgba(15, 157, 138, 0.08)',
  
  // Surfaces
  cardCream: '#FFFDF7',
  cardCreamHover: '#FAF6ED',
  cardBorder: '#E5ECE7',
  cardBorderWarm: '#E8EDE8',
  
  // Core text and buttons
  nearBlack: '#161616',
  textPrimary: '#161616',
  textSecondary: '#63736D',
  textMuted: '#8E9E97',
  textLight: '#F5F8F6',
  
  // Accents
  accentOrange: '#F28C45',
  accentOrangeLight: '#FFF1E8',
  accentOrangeBorder: '#FCD9C2',
  
  // Status Colors
  successGreen: '#2E7D32',
  successGreenLight: '#E8F5E9',
  successGreenBorder: '#C8E6C9',
  
  dangerRed: '#D32F2F',
  dangerRedLight: '#FFEBEE',
  dangerRedBorder: '#FFCDD2',
  
  warningOrange: '#EF6C00',
  warningOrangeLight: '#FFF3E0',
  
  infoBlue: '#1976D2',
  infoBlueLight: '#E3F2FD',
  
  // Interactive Toggles & Highlights
  teal: '#0F9D8A',
  tealLight: '#E0F2F1',
  tealBorder: '#B2DFDB',

  // Dark mode overrides
  dark: {
    bgGradientStart: '#111916',
    bgGradientEnd: '#0D1412',
    bgDotGrid: 'rgba(255, 255, 255, 0.04)',
    cardCream: '#18221E',
    cardCreamHover: '#1F2C27',
    cardBorder: '#263630',
    cardBorderWarm: '#2C3E37',
    textPrimary: '#F2F7F4',
    textSecondary: '#A3B4AC',
    textMuted: '#687A72',
    nearBlack: '#F2F7F4',
  }
};

export const typography = {
  fontFamily: 'System',
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  tabularNums: {
    fontVariant: ['tabular-nums'] as any,
  }
};

export const radii = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  card: 26,
  full: 9999,
};

export const shadows = {
  softCard: {
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  floatingTab: {
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
  },
  button: {
    shadowColor: '#161616',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  }
};

