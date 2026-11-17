import { BillingCycle, SubscriptionCategory } from './subscription';

export interface CatalogPreset {
  id: string;
  name: string;
  category: SubscriptionCategory;
  defaultAmountPaise: number;
  billingCycle: BillingCycle;
  defaultGST: boolean;
  color: string;
  icon: string;
  description: string;
  hasAutoPaySupport: boolean;
  yearlySavingsPaise?: number; // Potential discount if switched to annual
}

export const CATALOG_PRESETS: CatalogPreset[] = [
  // OTT / Streaming
  {
    id: 'netflix',
    name: 'Netflix',
    category: 'streaming',
    defaultAmountPaise: 64900, // ₹649
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#E50914',
    icon: 'streaming',
    description: 'Standard HD plan with multi-device access',
    hasAutoPaySupport: true,
  },
  {
    id: 'disney-hotstar',
    name: 'Disney+ Hotstar',
    category: 'streaming',
    defaultAmountPaise: 29900, // ₹299/qtr
    billingCycle: 'quarterly',
    defaultGST: true,
    color: '#113CCF',
    icon: 'streaming',
    description: 'Live sports, Hotstar specials, and movies',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 29800, // saves ₹298 on annual
  },
  {
    id: 'amazon-prime',
    name: 'Amazon Prime',
    category: 'streaming', // Categorize as Streaming/Shopping, NOT Utilities!
    defaultAmountPaise: 29900, // ₹299/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#00A8E1',
    icon: 'streaming',
    description: 'Fast delivery, Prime Video, and Amazon Music',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 208900, // Annual is ₹1,499 vs ₹3,588 (saves ₹2,089!)
  },
  {
    id: 'jiocinema-premium',
    name: 'JioCinema Premium',
    category: 'streaming',
    defaultAmountPaise: 8900, // ₹89/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#D82375',
    icon: 'streaming',
    description: 'Ad-free Hollywood, HBO, and Peacock content',
    hasAutoPaySupport: true,
  },
  {
    id: 'sonyliv',
    name: 'Sony LIV',
    category: 'streaming',
    defaultAmountPaise: 29900, // ₹299/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#002B49',
    icon: 'streaming',
    description: 'LIV Originals, UEFA Champions League, and Sony TV',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 258900, // Annual ₹999
  },
  {
    id: 'zee5',
    name: 'ZEE5',
    category: 'streaming',
    defaultAmountPaise: 9900,
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#8230C6',
    icon: 'streaming',
    description: 'Regional originals, blockbuster movies',
    hasAutoPaySupport: true,
  },

  // Music & Audio
  {
    id: 'spotify',
    name: 'Spotify Premium',
    category: 'music',
    defaultAmountPaise: 11900, // ₹119/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#1DB954',
    icon: 'music',
    description: 'Ad-free music streaming and offline downloads',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 22900,
  },
  {
    id: 'youtube-premium',
    name: 'YouTube Premium',
    category: 'music',
    defaultAmountPaise: 14900, // ₹149/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#FF0000',
    icon: 'music',
    description: 'Ad-free YouTube and YouTube Music with background play',
    hasAutoPaySupport: true,
  },
  {
    id: 'apple-music',
    name: 'Apple Music',
    category: 'music',
    defaultAmountPaise: 9900, // ₹99/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#FA243C',
    icon: 'music',
    description: 'Lossless audio and spatial audio with Dolby Atmos',
    hasAutoPaySupport: true,
  },
  {
    id: 'jiosaavn',
    name: 'JioSaavn Pro',
    category: 'music',
    defaultAmountPaise: 9900,
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#2BC5B4',
    icon: 'music',
    description: 'Unlimited ringtones and regional tracks',
    hasAutoPaySupport: true,
  },

  // Software & AI
  {
    id: 'chatgpt-plus',
    name: 'ChatGPT Plus',
    category: 'software',
    defaultAmountPaise: 199900, // ₹1,999/mo ($20)
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#10A37F',
    icon: 'software',
    description: 'OpenAI GPT-4o, DALL-E, advanced voice & deep research',
    hasAutoPaySupport: false,
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'software',
    defaultAmountPaise: 85000, // ₹850/mo ($10)
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#24292E',
    icon: 'software',
    description: 'AI pair programmer for code completion and chat',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 170000, // $100/yr vs $120
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365 Family',
    category: 'software',
    defaultAmountPaise: 619900, // ₹6,199/yr
    billingCycle: 'yearly',
    defaultGST: true,
    color: '#D83B01',
    icon: 'software',
    description: 'Office apps + 6TB cloud storage for up to 6 people',
    hasAutoPaySupport: true,
  },
  {
    id: 'notion-plus',
    name: 'Notion Plus',
    category: 'software',
    defaultAmountPaise: 82000, // ₹820/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#000000',
    icon: 'software',
    description: 'Connected workspace with unlimited blocks & file uploads',
    hasAutoPaySupport: false,
  },
  {
    id: 'claude-pro',
    name: 'Claude Pro',
    category: 'software',
    defaultAmountPaise: 199900, // ₹1,999/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#CC785C',
    icon: 'software',
    description: 'Anthropic Claude 3.5 Sonnet & Claude 3.7 with extended thinking',
    hasAutoPaySupport: false,
  },

  // Cloud & Storage
  {
    id: 'google-one',
    name: 'Google One 100GB',
    category: 'cloud',
    defaultAmountPaise: 13000, // ₹130/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#4285F4',
    icon: 'cloud',
    description: 'Google Drive, Photos & Gmail storage + Google Photos editing',
    hasAutoPaySupport: true,
    yearlySavingsPaise: 26000, // ₹1,300/yr vs ₹1,560
  },
  {
    id: 'icloud-plus',
    name: 'iCloud+ 50GB',
    category: 'cloud',
    defaultAmountPaise: 7500, // ₹75/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#34AADC',
    icon: 'cloud',
    description: 'Apple device backups, Private Relay and Hide My Email',
    hasAutoPaySupport: true,
  },

  // Telecom & Broadband
  {
    id: 'airtel-xstream',
    name: 'Airtel Xstream Fiber',
    category: 'utilities',
    defaultAmountPaise: 99900, // ₹999/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#E40000',
    icon: 'utilities',
    description: '200 Mbps broadband with unlimited calls & OTT pack',
    hasAutoPaySupport: true,
  },
  {
    id: 'jio-fiber',
    name: 'JioFiber 150 Mbps',
    category: 'utilities',
    defaultAmountPaise: 99900, // ₹999/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#0A3A82',
    icon: 'utilities',
    description: 'High-speed broadband + set-top box subscriptions',
    hasAutoPaySupport: true,
  },

  // Fitness & Wellness
  {
    id: 'cult-pass-elite',
    name: 'Cult.fit Pass Elite',
    category: 'fitness',
    defaultAmountPaise: 149900, // ₹1,499/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#FF3278',
    icon: 'fitness',
    description: 'Unlimited access to Cult centers and gyms across India',
    hasAutoPaySupport: true,
  },

  // Reading & Gaming
  {
    id: 'kindle-unlimited',
    name: 'Kindle Unlimited',
    category: 'reading',
    defaultAmountPaise: 16900, // ₹169/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#FF9900',
    icon: 'reading',
    description: 'Over 2 million digital books and magazine subscriptions',
    hasAutoPaySupport: true,
  },
  {
    id: 'xbox-game-pass',
    name: 'Xbox Game Pass PC',
    category: 'gaming',
    defaultAmountPaise: 34900, // ₹349/mo
    billingCycle: 'monthly',
    defaultGST: true,
    color: '#107C10',
    icon: 'gaming',
    description: 'Day-one access to top PC titles and EA Play membership',
    hasAutoPaySupport: true,
  },
];

