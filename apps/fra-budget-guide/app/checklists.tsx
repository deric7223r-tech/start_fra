import { useRouter } from 'expo-router';
import { CheckSquare, CreditCard, FileSignature, Users, DollarSign } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChecklistItem {
  id: string;
  text: string;
}

interface Checklist {
  id: string;
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  items: ChecklistItem[];
}

const checklists: Checklist[] = [
  {
    id: 'payments',
    title: 'Before Approving Payments',
    icon: CreditCard,
    items: [
      { id: 'p1', text: 'Verify goods/services actually received (three-way match)' },
      { id: 'p2', text: 'Confirm supplier is legitimate (if new/unusual)' },
      { id: 'p3', text: 'Check invoice amount matches agreement/quote' },
      { id: 'p4', text: 'Ensure proper authorization obtained' },
      { id: 'p5', text: 'Verify bank details if payment to new account' },
      { id: 'p6', text: 'Question anything unusual or urgent' },
    ],
  },
  {
    id: 'timesheets',
    title: 'Before Approving Timesheets',
    icon: Users,
    items: [
      { id: 't1', text: 'Verify hours are reasonable and consistent with work' },
      { id: 't2', text: 'Check employee was scheduled to work claimed days' },
      { id: 't3', text: 'Confirm overtime was pre-authorized' },
      { id: 't4', text: 'Cross-check against project deliverables' },
      { id: 't5', text: 'Question unusual patterns or maximum hours every week' },
    ],
  },
  {
    id: 'expenses',
    title: 'Before Approving Expenses',
    icon: FileSignature,
    items: [
      { id: 'e1', text: 'Check receipts are original, itemized, and dated' },
      { id: 'e2', text: 'Verify business purpose is legitimate and clear' },
      { id: 'e3', text: 'Cross-check dates (employee was traveling/working)' },
      { id: 'e4', text: 'Confirm expenses comply with policy limits' },
      { id: 'e5', text: 'Question weekend/holiday expenses' },
      { id: 'e6', text: 'Verify mileage claims against calendar' },
    ],
  },
  {
    id: 'suppliers',
    title: 'Before Approving New Suppliers',
    icon: CheckSquare,
    items: [
      { id: 's1', text: 'Check Companies House registration (UK)' },
      { id: 's2', text: 'Verify business address is legitimate (not P.O. box only)' },
      { id: 's3', text: 'Call supplier using independently verified phone number' },
      { id: 's4', text: 'Check online presence (website, reviews)' },
      { id: 's5', text: 'Request business references' },
      { id: 's6', text: 'Verify VAT registration if VAT charged' },
    ],
  },
  {
    id: 'bank-changes',
    title: 'Before Changing Bank Details',
    icon: DollarSign,
    items: [
      { id: 'b1', text: 'NEVER update bank details via email alone' },
      { id: 'b2', text: 'Call supplier using contact details from original contract' },
      { id: 'b3', text: 'Obtain verbal confirmation from two authorized signatories' },
      { id: 'b4', text: 'Make test payment (£1) before full amount' },
      { id: 'b5', text: 'Flag change for senior management approval' },
      { id: 'b6', text: 'Document all verification steps taken' },
    ],
  },
];

export default function ChecklistsScreen() {
  const router = useRouter();
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>('payments');

  const activeChecklist = checklists.find((c) => c.id === selectedChecklist);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.selectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectorContent}>
          {checklists.map((checklist) => {
            const Icon = checklist.icon;
            const isActive = selectedChecklist === checklist.id;

            return (
              <TouchableOpacity
                key={checklist.id}
                style={[styles.selectorButton, isActive && styles.selectorButtonActive]}
                onPress={() => setSelectedChecklist(checklist.id)}
                activeOpacity={0.7}
              >
                <Icon color={isActive ? '#ffffff' : '#1e40af'} size={20} />
                <Text style={[styles.selectorText, isActive && styles.selectorTextActive]}>
                  {checklist.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {activeChecklist && (
          <>
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Never change bank details based on email alone.
              </Text>
            </View>

            <View style={styles.checklistCard}>
              <View style={styles.checklistHeader}>
                <View style={styles.iconCircle}>
                  {React.createElement(activeChecklist.icon, { color: '#1e40af', size: 28 })}
                </View>
                <Text style={styles.checklistTitle}>{activeChecklist.title}</Text>
              </View>

              <View style={styles.itemsContainer}>
                {activeChecklist.items.map((item, index) => (
                  <View key={item.id} style={styles.checklistItem}>
                    <View style={styles.checkboxCircle}>
                      <Text style={styles.checkboxNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.itemText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                Use these checklists daily at the point of approval to ensure consistent fraud prevention.
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/authority')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>View Authority Limits</Text>
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
  selectorContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectorContent: {
    padding: 16,
    gap: 12,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  selectorButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  selectorTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  bannerText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  checklistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 20,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checklistTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemsContainer: {
    gap: 16,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1e40af',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 21,
  },
  noteCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
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
