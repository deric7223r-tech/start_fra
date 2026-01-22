import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Eye, User, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RedFlag {
  id: string;
  category: 'people' | 'transactions';
  text: string;
}

const redFlags: RedFlag[] = [
  {
    id: 'people-1',
    category: 'people',
    text: 'Employee discussing money problems or debt',
  },
  {
    id: 'people-2',
    category: 'people',
    text: 'Sudden lifestyle changes inconsistent with salary',
  },
  {
    id: 'people-3',
    category: 'people',
    text: 'Reluctance to take leave or share responsibilities',
  },
  {
    id: 'people-4',
    category: 'people',
    text: 'Working unusual hours alone',
  },
  {
    id: 'people-5',
    category: 'people',
    text: 'Defensive when questioned about transactions',
  },
  {
    id: 'people-6',
    category: 'people',
    text: 'Overly close relationships with suppliers/contractors',
  },
  {
    id: 'people-7',
    category: 'people',
    text: 'Control issues - won\'t delegate or share passwords',
  },
  {
    id: 'people-8',
    category: 'people',
    text: 'Disgruntlement with employer or entitlement mentality',
  },
  {
    id: 'trans-1',
    category: 'transactions',
    text: 'New suppliers with generic email addresses (Gmail, Hotmail)',
  },
  {
    id: 'trans-2',
    category: 'transactions',
    text: 'Round numbers on invoices (£5,000.00 vs £4,847.23)',
  },
  {
    id: 'trans-3',
    category: 'transactions',
    text: 'Invoices just below approval thresholds',
  },
  {
    id: 'trans-4',
    category: 'transactions',
    text: 'Urgent payment demands without justification',
  },
  {
    id: 'trans-5',
    category: 'transactions',
    text: 'Vague invoice descriptions (Miscellaneous services)',
  },
  {
    id: 'trans-6',
    category: 'transactions',
    text: 'Same supplier used repeatedly without competition',
  },
  {
    id: 'trans-7',
    category: 'transactions',
    text: 'Bank detail change requests via email',
  },
  {
    id: 'trans-8',
    category: 'transactions',
    text: 'Missing or photocopied receipts',
  },
  {
    id: 'trans-9',
    category: 'transactions',
    text: 'Sequential invoice numbers across different vendors',
  },
  {
    id: 'trans-10',
    category: 'transactions',
    text: 'Supplier with no online presence or Companies House record',
  },
];

export default function RedFlagsScreen() {
  const router = useRouter();
  const { isWatched, toggleWatchItem } = useApp();
  const [activeTab, setActiveTab] = useState<'people' | 'transactions'>('people');

  const filteredFlags = redFlags.filter((flag) => flag.category === activeTab);

  const handleToggleWatch = (flag: RedFlag) => {
    toggleWatchItem(flag);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.tabActive]}
          onPress={() => setActiveTab('people')}
          activeOpacity={0.7}
        >
          <User color={activeTab === 'people' ? '#1e40af' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
            People & Behaviour
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
          activeOpacity={0.7}
        >
          <Eye color={activeTab === 'transactions' ? '#1e40af' : '#64748b'} size={20} />
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Red flags are indicators, not proof. Report concerns — do not investigate.
          </Text>
        </View>

        <View style={styles.flagsContainer}>
          {filteredFlags.map((flag) => {
            const watched = isWatched(flag.id);

            return (
              <TouchableOpacity
                key={flag.id}
                style={[styles.flagCard, watched && styles.flagCardWatched]}
                onPress={() => handleToggleWatch(flag)}
                activeOpacity={0.7}
              >
                <Text style={[styles.flagText, watched && styles.flagTextWatched]}>
                  {flag.text}
                </Text>
                <View style={[styles.watchIndicator, watched && styles.watchIndicatorActive]}>
                  <Text style={styles.watchText}>{watched ? '★' : '☆'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/checklists')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>View Approval Checklists</Text>
          <ChevronRight color="#ffffff" size={20} />
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1e40af',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#1e40af',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 19,
  },
  flagsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  flagCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagCardWatched: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 19,
  },
  flagTextWatched: {
    fontWeight: '600',
    color: '#0f172a',
  },
  watchIndicator: {
    marginLeft: 12,
  },
  watchIndicatorActive: {
    transform: [{ scale: 1.2 }],
  },
  watchText: {
    fontSize: 24,
    color: '#f59e0b',
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
});
