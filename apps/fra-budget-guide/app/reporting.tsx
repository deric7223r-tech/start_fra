import { useRouter } from 'expo-router';
import { AlertOctagon, Phone, Mail, Building2, Edit3 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

const steps = [
  {
    id: 1,
    title: 'Do Not Confront',
    description: 'Never confront the individual. This may lead to evidence destruction, intimidation, or personal risk.',
    color: '#dc2626',
  },
  {
    id: 2,
    title: 'Preserve Evidence',
    description: 'Make copies of suspicious documents. Save emails. Note dates, times, and people involved. Do not remove originals.',
    color: '#f59e0b',
  },
  {
    id: 3,
    title: 'Report Through Proper Channels',
    description: 'Use internal reporting channels below. Your report will be handled confidentially and professionally.',
    color: '#059669',
  },
];

interface ContactInfo {
  role: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  contactKey: 'fraudRiskOwner' | 'whistleblowingHotline' | 'internalAudit' | 'hrDepartment';
  bestFor: string;
}

const contacts: ContactInfo[] = [
  {
    role: 'Fraud Risk Owner',
    icon: AlertOctagon,
    contactKey: 'fraudRiskOwner',
    bestFor: 'General fraud concerns, complex fraud, or concerns about your manager',
  },
  {
    role: 'Whistleblowing Hotline',
    icon: Phone,
    contactKey: 'whistleblowingHotline',
    bestFor: 'Sensitive concerns or when you prefer anonymity',
  },
  {
    role: 'Internal Audit',
    icon: Building2,
    contactKey: 'internalAudit',
    bestFor: 'Systemic control weaknesses or process issues',
  },
  {
    role: 'HR Department',
    icon: Mail,
    contactKey: 'hrDepartment',
    bestFor: 'Employment fraud (timesheets, expenses, payroll)',
  },
];

export default function ReportingScreen() {
  const router = useRouter();
  const { contactDetails, updateContactDetail } = useApp();
  const [editingContact, setEditingContact] = useState<{
    key: keyof typeof contactDetails;
    role: string;
    currentValue: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleEditContact = (key: keyof typeof contactDetails, role: string) => {
    const currentValue = contactDetails[key];
    setInputValue(currentValue);
    setEditingContact({ key, role, currentValue });
  };

  const handleSaveContact = () => {
    if (editingContact && inputValue.trim()) {
      updateContactDetail(editingContact.key, inputValue.trim());
      setEditingContact(null);
      setInputValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
    setInputValue('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <AlertOctagon color="#dc2626" size={48} />
          <Text style={styles.title}>Stop. Protect. Report.</Text>
          <Text style={styles.subtitle}>What to do if you suspect fraud</Text>
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Raising concerns is a responsibility — not an accusation.
          </Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={step.id} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: step.color }]}>
                <Text style={styles.stepNumberText}>{step.id}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Internal Reporting Channels</Text>

        <View style={styles.contactsContainer}>
          {contacts.map((contact, index) => {
            const Icon = contact.icon;
            const contactValue = contactDetails[contact.contactKey];
            const isEmpty = !contactValue;

            return (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactIconCircle}>
                    <Icon color="#1e40af" size={24} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactRole}>{contact.role}</Text>
                    <TouchableOpacity
                      onPress={() => handleEditContact(contact.contactKey, contact.role)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.contactDetailsRow}>
                        <Text
                          style={[
                            styles.contactDetails,
                            isEmpty && styles.contactDetailsPlaceholder,
                          ]}
                        >
                          {contactValue || 'Tap to insert contact details'}
                        </Text>
                        <Edit3 color={isEmpty ? '#94a3b8' : '#1e40af'} size={16} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.contactBestFor}>Best for: {contact.bestFor}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.externalCard}>
          <Text style={styles.externalTitle}>External Reporting (if internal channels fail)</Text>
          <View style={styles.externalItem}>
            <View style={styles.externalBullet} />
            <View style={styles.externalContent}>
              <Text style={styles.externalName}>Action Fraud</Text>
              <Text style={styles.externalContact}>0300 123 2040 | www.actionfraud.police.uk</Text>
            </View>
          </View>
          <View style={styles.externalItem}>
            <View style={styles.externalBullet} />
            <View style={styles.externalContent}>
              <Text style={styles.externalName}>Serious Fraud Office</Text>
              <Text style={styles.externalContact}>www.sfo.gov.uk</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/whistleblower')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Whistleblower Protection</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={editingContact !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Contact Details</Text>
            <Text style={styles.modalSubtitle}>{editingContact?.role}</Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter contact details (name, email, phone)"
              placeholderTextColor="#94a3b8"
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveContact}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  banner: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  contactsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  contactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  contactIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactDetails: {
    fontSize: 14,
    color: '#1e40af',
    flex: 1,
  },
  contactDetailsPlaceholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  contactBestFor: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  externalCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  externalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  externalItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  externalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#92400e',
    marginTop: 7,
    marginRight: 12,
  },
  externalContent: {
    flex: 1,
  },
  externalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
    marginBottom: 2,
  },
  externalContact: {
    fontSize: 13,
    color: '#92400e',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
  },
  modalButtonSave: {
    backgroundColor: '#1e40af',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
