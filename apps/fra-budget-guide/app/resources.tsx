import { useRouter } from 'expo-router';
import { BookOpen, Phone, ExternalLink, Home, Edit3 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ResourceItem {
  name: string;
  contact: string;
  description?: string;
  editable?: boolean;
}

interface Resource {
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  items: ResourceItem[];
}

const resources: Resource[] = [
  {
    title: 'Internal Contacts',
    icon: Phone,
    items: [
      {
        name: 'Fraud Risk Owner',
        contact: 'fraudRiskOwner',
        description: 'Primary contact for fraud concerns',
        editable: true,
      },
      {
        name: 'Whistleblowing Hotline',
        contact: 'whistleblowingHotline',
        description: 'Anonymous reporting channel',
        editable: true,
      },
      {
        name: 'Internal Audit',
        contact: 'internalAudit',
        description: 'Control reviews and investigations',
        editable: true,
      },
      {
        name: 'HR Department',
        contact: 'hrDepartment',
        description: 'Employment and conduct matters',
        editable: true,
      },
    ],
  },
  {
    title: 'External Reporting',
    icon: ExternalLink,
    items: [
      {
        name: 'Action Fraud',
        contact: '0300 123 2040',
        description: 'www.actionfraud.police.uk',
      },
      {
        name: 'Serious Fraud Office',
        contact: 'www.sfo.gov.uk',
        description: 'Major/complex fraud cases',
      },
      {
        name: 'HMRC Fraud Hotline',
        contact: '0800 788 887',
        description: 'Tax-related fraud',
      },
    ],
  },
  {
    title: 'Training & Resources',
    icon: BookOpen,
    items: [
      {
        name: 'ACFE Resources',
        contact: 'www.acfe.com',
        description: 'Global fraud statistics and training',
      },
      {
        name: 'CIPFA Guidance',
        contact: 'www.cipfa.org',
        description: 'Public sector fraud prevention',
      },
      {
        name: 'Stop FRA Platform',
        contact: 'stopFraPlatform',
        description: 'Automated fraud risk assessment tools',
        editable: true,
      },
    ],
  },
];

export default function ResourcesScreen() {
  const router = useRouter();
  const { contactDetails, updateContactDetail } = useApp();
  const [editingContact, setEditingContact] = useState<{
    key: keyof typeof contactDetails;
    name: string;
    currentValue: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const handleLink = (url: string) => {
    if (url.startsWith('www.')) {
      Linking.openURL(`https://${url}`);
    }
  };

  const handleEditContact = (key: keyof typeof contactDetails, name: string) => {
    const currentValue = contactDetails[key];
    setInputValue(currentValue);
    setEditingContact({ key, name, currentValue });
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

  const getContactValue = (contact: string, editable?: boolean) => {
    if (editable && contact in contactDetails) {
      return contactDetails[contact as keyof typeof contactDetails] || 'Tap to insert contact details';
    }
    return contact;
  };

  const isContactEmpty = (contact: string, editable?: boolean) => {
    if (editable && contact in contactDetails) {
      return !contactDetails[contact as keyof typeof contactDetails];
    }
    return false;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <BookOpen color="#1e40af" size={48} />
          <Text style={styles.title}>Resources & Support</Text>
          <Text style={styles.subtitle}>
            Contacts and tools to help you prevent fraud
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {resources.map((resource, index) => {
            const Icon = resource.icon;

            return (
              <View key={index} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconCircle}>
                    <Icon color="#1e40af" size={24} />
                  </View>
                  <Text style={styles.sectionTitle}>{resource.title}</Text>
                </View>

                <View style={styles.itemsContainer}>
                  {resource.items.map((item, itemIndex) => {
                    const contactValue = getContactValue(item.contact, item.editable);
                    const isEmpty = isContactEmpty(item.contact, item.editable);
                    const isLink = item.contact.startsWith('www.');

                    return (
                      <View key={itemIndex} style={styles.resourceCard}>
                        <Text style={styles.resourceName}>{item.name}</Text>
                        {item.editable ? (
                          <TouchableOpacity
                            onPress={() => handleEditContact(item.contact as keyof typeof contactDetails, item.name)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.contactEditRow}>
                              <Text
                                style={[
                                  styles.resourceContact,
                                  isEmpty && styles.resourceContactPlaceholder,
                                ]}
                              >
                                {contactValue}
                              </Text>
                              <Edit3 color={isEmpty ? '#94a3b8' : '#1e40af'} size={14} />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            onPress={() => {
                              if (isLink) {
                                handleLink(item.contact);
                              }
                            }}
                            disabled={!isLink}
                          >
                            <Text
                              style={[
                                styles.resourceContact,
                                isLink && styles.resourceContactLink,
                              ]}
                            >
                              {item.contact}
                            </Text>
                          </TouchableOpacity>
                        )}
                        {item.description && (
                          <Text style={styles.resourceDescription}>{item.description}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.completionCard}>
          <Home color="#059669" size={32} />
          <Text style={styles.completionTitle}>You have completed the guidance</Text>
          <Text style={styles.completionText}>
            You can return anytime to review scenarios, checklists, or take the pledge.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Home color="#ffffff" size={20} />
          <Text style={styles.homeButtonText}>Return to Start</Text>
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
            <Text style={styles.modalSubtitle}>{editingContact?.name}</Text>
            <TextInput
              style={styles.modalInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter contact details (name, email, phone, URL)"
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
    marginBottom: 32,
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
    lineHeight: 21,
  },
  sectionsContainer: {
    gap: 24,
    marginBottom: 32,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemsContainer: {
    gap: 16,
  },
  resourceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 14,
  },
  resourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  contactEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceContact: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    flex: 1,
  },
  resourceContactLink: {
    color: '#1e40af',
    textDecorationLine: 'underline',
  },
  resourceContactPlaceholder: {
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  resourceDescription: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  completionCard: {
    backgroundColor: '#d1fae5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065f46',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 14,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 20,
  },
  homeButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  homeButtonText: {
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
