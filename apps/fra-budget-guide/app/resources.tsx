import { useRouter } from 'expo-router';
import { BookOpen, Phone, ExternalLink, Home, Edit3 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { useApp } from '@/contexts/AppContext';

import ScreenContainer from '@/components/ScreenContainer';
import ActionButton from '@/components/ActionButton';
import { colors, spacing, borderRadius } from '@/constants/theme';

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
    <ScreenContainer screenId="resources">
      <View style={styles.header}>
        <BookOpen color={colors.primary} size={48} />
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
                  <Icon color={colors.primary} size={24} />
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
                          accessibilityRole="button"
                          accessibilityLabel={`Edit contact details for ${item.name}`}
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
                            <Edit3 color={isEmpty ? colors.textFaint : colors.primary} size={14} />
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
                          accessibilityRole={isLink ? 'link' : 'none'}
                          accessibilityLabel={isLink ? `Open ${item.name} website` : undefined}
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
        <Home color={colors.success} size={32} />
        <Text style={styles.completionTitle}>You have completed the guidance</Text>
        <Text style={styles.completionText}>
          You can return anytime to review scenarios, checklists, or take the pledge.
        </Text>
      </View>

      <ActionButton
        label="Return to Start"
        onPress={() => router.push('/')}
      />

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
              placeholderTextColor={colors.textFaint}
              multiline
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelEdit}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveContact}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Save contact details"
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md - 4,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  sectionsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md - 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  itemsContainer: {
    gap: spacing.md,
  },
  resourceCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: 14,
  },
  resourceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  contactEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceContact: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    flex: 1,
  },
  resourceContactLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  resourceContactPlaceholder: {
    color: colors.textFaint,
    fontStyle: 'italic',
  },
  resourceDescription: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  completionCard: {
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.successDarker,
    marginTop: spacing.md - 4,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 14,
    color: colors.successDark,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md - 4,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md - 4,
  },
  modalButton: {
    flex: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md - 4,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.backgroundAlt,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
});
