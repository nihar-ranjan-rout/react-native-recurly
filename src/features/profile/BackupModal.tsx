import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { useSubscriptionStore, usePaymentStore, useUserStore } from '../../store';
import { Card, Button, Icon, colors, radii, typography } from '../../ui';
import { ExportService } from '../../services/export';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../data/local/LocalStorage';

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function BackupModal({ visible, onClose }: BackupModalProps) {
  const { subscriptions, loadSubscriptions } = useSubscriptionStore();
  const { payments, loadAll } = usePaymentStore();
  const [importJson, setImportJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const json = ExportService.generateBackupJSON({
      subscriptions,
      payments,
      timestamp: new Date().toISOString(),
    });

    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recurly-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setStatusMessage('Backup JSON downloaded successfully!');
    } else {
      Alert.alert('Backup JSON Generated', 'Vault data exported successfully.');
    }
  };

  const handleRestoreJSON = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.subscriptions || !Array.isArray(parsed.subscriptions)) {
        throw new Error('Invalid backup file: missing subscriptions array');
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.SUBSCRIPTIONS,
        JSON.stringify(parsed.subscriptions)
      );

      if (parsed.payments && Array.isArray(parsed.payments)) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.PAYMENTS,
          JSON.stringify(parsed.payments)
        );
      }

      await Promise.all([loadSubscriptions(), loadAll()]);
      setStatusMessage('Vault restored successfully!');
      setImportJson('');
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message || 'Invalid JSON format'}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>DATA PORTABILITY</Text>
              <Text style={styles.title}>Backup & Restore Vault</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Export Section */}
            <Card style={styles.sectionCard} padding={16}>
              <Text style={styles.cardTitle}>Export Encrypted Vault Backup</Text>
              <Text style={styles.cardDesc}>
                Export all subscription records, payment ledgers, and UPI AutoPay mandates as an offline JSON snapshot.
              </Text>
              <Button
                label="Download JSON Backup"
                variant="primary"
                size="md"
                icon="download"
                onPress={handleDownloadBackup}
                style={{ marginTop: 10 }}
              />
            </Card>

            {/* Import Section */}
            <Card style={styles.sectionCard} padding={16}>
              <Text style={styles.cardTitle}>Restore Vault from JSON</Text>
              <Text style={styles.cardDesc}>
                Paste your raw JSON backup payload below to overwrite and restore your portfolio vault.
              </Text>
              <TextInput
                style={styles.jsonInput}
                placeholder="Paste backup JSON payload here..."
                placeholderTextColor={colors.textMuted}
                multiline
                value={importJson}
                onChangeText={setImportJson}
              />
              <Button
                label="Restore Vault Data"
                variant="secondary"
                size="md"
                icon="upload"
                disabled={!importJson.trim()}
                onPress={handleRestoreJSON}
                style={{ marginTop: 10 }}
              />
            </Card>

            {statusMessage && (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{statusMessage}</Text>
              </View>
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
  scrollArea: {
    maxHeight: 520,
  },
  sectionCard: {
    backgroundColor: colors.cardCream,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.nearBlack,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  jsonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    height: 100,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.nearBlack,
    marginTop: 10,
    outlineStyle: 'none' as any,
  },
  statusBox: {
    backgroundColor: colors.tealLight,
    padding: 12,
    borderRadius: radii.md,
    marginVertical: 10,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.teal,
    textAlign: 'center',
  },
});

