import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { CheckCircle, PenTool } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const pledgeItems = [
  'Understand and comply with all financial policies',
  'Exercise delegated authority responsibly and within limits',
  'Apply controls consistently (no shortcuts, no exceptions)',
  'Question unusual, urgent, or suspicious requests',
  'Verify suppliers, invoices, and bank details before approval',
  'Never approve my own transactions',
  'Declare all conflicts of interest',
  'Report fraud concerns immediately through proper channels',
  'Set the tone for my team (ethical behavior, speak-up culture)',
  'Complete mandatory fraud awareness training annually',
  'Support fraud investigations with full cooperation',
  'Protect whistleblowers from retaliation',
];

export default function PledgeScreen() {
  const { pledge, savePledge } = useApp();
  const router = useRouter();
  const [signature, setSignature] = useState('');
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const allChecked = pledgeItems.every((_, index) => checkedItems[index]);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSubmit = async () => {
    if (!allChecked) {
      Alert.alert('Incomplete', 'Please check all commitment items.');
      return;
    }

    if (!signature.trim()) {
      Alert.alert('Signature Required', 'Please enter your name to sign the pledge.');
      return;
    }

    await savePledge(signature.trim());
    Alert.alert(
      'Pledge Recorded',
      'Your commitment has been saved. Thank you for your dedication to fraud prevention.',
      [
        {
          text: 'Continue',
          onPress: () => router.push('/resources'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CheckCircle color="#059669" size={48} />
          </View>
          <Text style={styles.title}>Your Commitment as a Budget-Holder</Text>
          <Text style={styles.subtitle}>
            Confirm your understanding and commitment to fraud prevention
          </Text>
        </View>

        {pledge ? (
          <View style={styles.completedCard}>
            <CheckCircle color="#059669" size={32} />
            <Text style={styles.completedTitle}>Pledge Already Recorded</Text>
            <Text style={styles.completedText}>
              Signed by: {pledge.signature}
            </Text>
            <Text style={styles.completedDate}>
              Date: {new Date(pledge.timestamp).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.pledgeCard}>
              <Text style={styles.pledgeTitle}>As a budget-holder, I commit to:</Text>
              <View style={styles.itemsContainer}>
                {pledgeItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.pledgeItem}
                    onPress={() => toggleItem(index)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, checkedItems[index] && styles.checkboxChecked]}>
                      {checkedItems[index] && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.pledgeItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.signatureCard}>
              <View style={styles.signatureHeader}>
                <PenTool color="#1e40af" size={24} />
                <Text style={styles.signatureTitle}>Your Signature</Text>
              </View>
              <TextInput
                style={styles.signatureInput}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                value={signature}
                onChangeText={setSignature}
                autoCapitalize="words"
              />
              <Text style={styles.signatureNote}>
                By signing, you acknowledge your understanding and commitment to these responsibilities.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!allChecked || !signature.trim()) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!allChecked || !signature.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>
                {!allChecked
                  ? 'Check all items to continue'
                  : !signature.trim()
                  ? 'Enter signature to submit'
                  : 'Submit Pledge'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/resources')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {pledge ? 'View Resources' : 'Skip for Now'}
          </Text>
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
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
  },
  completedCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#059669',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 12,
    marginBottom: 8,
  },
  completedText: {
    fontSize: 15,
    color: '#047857',
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 14,
    color: '#059669',
  },
  pledgeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 20,
  },
  pledgeTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 14,
  },
  pledgeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  pledgeItemText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  signatureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 20,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  signatureTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 12,
  },
  signatureInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  signatureNote: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
});
