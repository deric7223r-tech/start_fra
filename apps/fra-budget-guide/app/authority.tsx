import { useRouter } from 'expo-router';
import { Shield, AlertCircle } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthorityLevel {
  type: string;
  upTo1k: string;
  upTo5k: string;
  upTo25k: string;
  over25k: string;
}

const authorityMatrix: AuthorityLevel[] = [
  {
    type: 'Procurement',
    upTo1k: 'Team Leader',
    upTo5k: 'Budget Holder',
    upTo25k: 'Senior Manager',
    over25k: 'Director + CFO',
  },
  {
    type: 'Expenses',
    upTo1k: 'Line Manager',
    upTo5k: 'Budget Holder',
    upTo25k: 'Director',
    over25k: 'CEO',
  },
  {
    type: 'Payroll Changes',
    upTo1k: 'HR Officer',
    upTo5k: 'HR Manager',
    upTo25k: 'HR Director',
    over25k: 'CEO',
  },
  {
    type: 'Contract Awards',
    upTo1k: 'N/A',
    upTo5k: 'Budget Holder',
    upTo25k: 'Director + Proc.',
    over25k: 'Board',
  },
  {
    type: 'New Suppliers',
    upTo1k: 'N/A',
    upTo5k: 'Budget Holder',
    upTo25k: 'Senior Manager',
    over25k: 'CFO',
  },
];

const goldenRules = [
  'Never exceed your authority (even "just this once")',
  'Never approve your own transactions',
  'Never approve for family/friends without disclosure',
  'If in doubt, escalate upward',
];

export default function AuthorityScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Shield color="#1e40af" size={40} />
          <Text style={styles.title}>Know Your Limits</Text>
          <Text style={styles.subtitle}>
            Authority limits protect you and the organisation
          </Text>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Golden Rules</Text>
          {goldenRules.map((rule, index) => (
            <View key={index} style={styles.ruleItem}>
              <View style={styles.ruleBullet} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={styles.matrixCard}>
          <Text style={styles.matrixTitle}>Authority Matrix (Example)</Text>
          <Text style={styles.matrixNote}>
            This is an example. Check your organisation&apos;s specific limits.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCell, styles.tableHeaderCell, styles.cellType]}>
                  <Text style={styles.tableHeaderText}>Type</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeaderCell, styles.cellAmount]}>
                  <Text style={styles.tableHeaderText}>Up to £1k</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeaderCell, styles.cellAmount]}>
                  <Text style={styles.tableHeaderText}>£1k-£5k</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeaderCell, styles.cellAmount]}>
                  <Text style={styles.tableHeaderText}>£5k-£25k</Text>
                </View>
                <View style={[styles.tableCell, styles.tableHeaderCell, styles.cellAmount]}>
                  <Text style={styles.tableHeaderText}>£25k+</Text>
                </View>
              </View>

              {authorityMatrix.map((row, index) => (
                <View
                  key={index}
                  style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}
                >
                  <View style={[styles.tableCell, styles.cellType]}>
                    <Text style={styles.tableCellTextBold}>{row.type}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.cellAmount]}>
                    <Text style={styles.tableCellText}>{row.upTo1k}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.cellAmount]}>
                    <Text style={styles.tableCellText}>{row.upTo5k}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.cellAmount]}>
                    <Text style={styles.tableCellText}>{row.upTo25k}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.cellAmount]}>
                    <Text style={styles.tableCellText}>{row.over25k}</Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.infoCard}>
          <AlertCircle color="#1e40af" size={24} />
          <Text style={styles.infoText}>
            Delegation limits ensure appropriate oversight and prevent single-person fraud.
            They also protect you from unwitting involvement in fraudulent activities.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/reporting')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Report Fraud Guidance</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  rulesCard: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginTop: 7,
    marginRight: 12,
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 21,
  },
  matrixCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 24,
  },
  matrixTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  matrixNote: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  table: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tableHeaderCell: {
    padding: 12,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center',
  },
  cellType: {
    width: 140,
  },
  cellAmount: {
    width: 115,
  },
  tableCellText: {
    fontSize: 13,
    color: '#334155',
  },
  tableCellTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
