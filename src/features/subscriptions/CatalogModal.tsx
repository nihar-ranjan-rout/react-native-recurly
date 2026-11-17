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
import { CATALOG_PRESETS, CatalogPreset } from '../../domain/catalog';
import { Card, Badge, Icon, colors, radii, typography } from '../../ui';
import { formatPaise } from '../../services/currency';

interface CatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPreset: (preset: CatalogPreset) => void;
}

export default function CatalogModal({
  visible,
  onClose,
  onSelectPreset,
}: CatalogModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPresets = useMemo(() => {
    return CATALOG_PRESETS.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [search, selectedCategory]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>INDIAN SERVICE CATALOG</Text>
              <Text style={styles.title}>Browse Presets</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              placeholder="Search Netflix, Spotify, ChatGPT, Cult..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          {/* List of presets */}
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {filteredPresets.map((preset) => (
              <Card
                key={preset.id}
                style={styles.presetCard}
                padding={14}
                onPress={() => onSelectPreset(preset)}
              >
                <View style={styles.presetRow}>
                  <View style={[styles.presetIconCircle, { backgroundColor: preset.color }]}>
                    <Icon name={(preset.icon as any) || 'subscription'} size={20} color="#FFFFFF" />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      {preset.hasAutoPaySupport && (
                        <Badge label="AutoPay" variant="autopay" size="sm" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                    <Text style={styles.presetDesc} numberOfLines={1}>
                      {preset.description}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                    <Text style={styles.presetPrice}>
                      {formatPaise(preset.defaultAmountPaise, 'INR')}
                      <Text style={styles.presetCycle}>
                        /{preset.billingCycle === 'yearly' ? 'yr' : preset.billingCycle === 'quarterly' ? 'qtr' : 'mo'}
                      </Text>
                    </Text>
                    <Badge label="GST 18%" variant="gst" size="sm" style={{ marginTop: 4 }} />
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.textMuted,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.nearBlack,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardCream,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.nearBlack,
    outlineStyle: 'none' as any,
  },
  scrollArea: {
    maxHeight: 520,
  },
  presetCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  presetDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  presetPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.nearBlack,
  },
  presetCycle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

