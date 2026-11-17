import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import {
  Home,
  CreditCard,
  PieChart,
  User,
  Settings,
  Plus,
  Search,
  Bell,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
  Edit2,
  Trash2,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Share2,
  Copy,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ExternalLink,
  Calendar,
  Receipt,
  IndianRupee,
  Tv,
  Music,
  Code2,
  Cloud,
  Zap,
  Dumbbell,
  Gamepad2,
  BookOpen,
  ShoppingBag,
  MoreHorizontal,
  Pause,
  Play,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Smartphone,
  Wallet,
  Building,
  CheckCircle2,
  Tag,
  LucideIcon
} from 'lucide-react-native';
import { colors } from './tokens';

export type IconName =
  | 'home'
  | 'subscription'
  | 'card'
  | 'insights'
  | 'analytics'
  | 'user'
  | 'settings'
  | 'add'
  | 'plus'
  | 'search'
  | 'bell'
  | 'check'
  | 'check-circle'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'clock'
  | 'close'
  | 'edit'
  | 'trash'
  | 'filter'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'eye'
  | 'eye-off'
  | 'shield'
  | 'shield-check'
  | 'lock'
  | 'unlock'
  | 'share'
  | 'copy'
  | 'alert'
  | 'alert-triangle'
  | 'info'
  | 'sparkles'
  | 'external-link'
  | 'calendar'
  | 'receipt'
  | 'rupee'
  | 'wallet'
  | 'phone'
  | 'bank'
  | 'file-text'
  | 'pause'
  | 'play'
  | 'tag'
  | 'arrow-up-right'
  // Categories
  | 'streaming'
  | 'music'
  | 'software'
  | 'cloud'
  | 'utilities'
  | 'fitness'
  | 'gaming'
  | 'reading'
  | 'shopping'
  | 'other';

const iconRegistry: Record<IconName, LucideIcon> = {
  home: Home,
  subscription: CreditCard,
  card: CreditCard,
  insights: PieChart,
  analytics: PieChart,
  user: User,
  settings: Settings,
  add: Plus,
  plus: Plus,
  search: Search,
  bell: Bell,
  check: Check,
  'check-circle': CheckCircle2,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  clock: Clock,
  close: X,
  edit: Edit2,
  trash: Trash2,
  filter: Filter,
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  eye: Eye,
  'eye-off': EyeOff,
  shield: Shield,
  'shield-check': ShieldCheck,
  lock: Lock,
  unlock: Unlock,
  share: Share2,
  copy: Copy,
  alert: AlertCircle,
  'alert-triangle': AlertTriangle,
  info: Info,
  sparkles: Sparkles,
  'external-link': ExternalLink,
  calendar: Calendar,
  receipt: Receipt,
  rupee: IndianRupee,
  wallet: Wallet,
  phone: Smartphone,
  bank: Building,
  'file-text': FileText,
  pause: Pause,
  play: Play,
  tag: Tag,
  'arrow-up-right': ArrowUpRight,
  // Categories
  streaming: Tv,
  music: Music,
  software: Code2,
  cloud: Cloud,
  utilities: Zap,
  fitness: Dumbbell,
  gaming: Gamepad2,
  reading: BookOpen,
  shopping: ShoppingBag,
  other: MoreHorizontal,
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Icon({
  name,
  size = 20,
  color = colors.nearBlack,
  strokeWidth = 2,
  style,
}: IconProps) {
  const IconComponent = iconRegistry[name] || MoreHorizontal;
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <IconComponent size={size} color={color} strokeWidth={strokeWidth} />
    </View>
  );
}

