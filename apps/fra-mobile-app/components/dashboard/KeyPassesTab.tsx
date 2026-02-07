import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Key, FileText } from 'lucide-react-native';
import colors from '@/constants/colors';

interface KeyPassesTabProps {
  usedKeyPasses: number;
  totalKeyPasses: number;
  remainingKeyPasses: number;
}

export default function KeyPassesTab({
  usedKeyPasses,
  totalKeyPasses,
  remainingKeyPasses,
}: KeyPassesTabProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key-Pass Management</Text>

      <View style={styles.keyPassCard}>
        <Text style={styles.cardTitle}>Usage Overview</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(usedKeyPasses / totalKeyPasses) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{usedKeyPasses} of {totalKeyPasses} used</Text>
        </View>
        <Text style={styles.progressSubtext}>{remainingKeyPasses} access passes remaining</Text>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Key-Passes', `You have ${remainingKeyPasses} key-passes available to distribute to employees`)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Generate invite link"
        >
          <Key size={20} color={colors.govBlue} />
          <Text style={styles.actionButtonText}>Generate Invite Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Key-Pass Codes', 'List of available key-pass codes would be shown here')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="View key-pass codes"
        >
          <FileText size={20} color={colors.govBlue} />
          <Text style={styles.actionButtonText}>View Key-Pass Codes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 16,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  keyPassCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
    letterSpacing: -0.16,
    lineHeight: 20.8,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.govGrey4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.govBlue,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  progressSubtext: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.lightBlue,
    borderRadius: 6,
    marginTop: 10,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
});
