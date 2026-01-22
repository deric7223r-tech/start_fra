import { useApp, UserRole } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Shield, FileText, Users, CreditCard, FileSignature, CheckSquare } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface RoleOption {
  id: UserRole;
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  description: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'procurement',
    title: 'Procurement & Suppliers',
    icon: FileText,
    description: 'Managing suppliers, purchase orders, and procurement decisions',
  },
  {
    id: 'invoices',
    title: 'Invoices & Payments',
    icon: CreditCard,
    description: 'Approving invoices and authorizing payments',
  },
  {
    id: 'payroll',
    title: 'Payroll & Timesheets',
    icon: Users,
    description: 'Managing payroll, approving timesheets and HR functions',
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: FileSignature,
    description: 'Reviewing and approving employee expense claims',
  },
  {
    id: 'contracts',
    title: 'Contracts',
    icon: CheckSquare,
    description: 'Managing and approving contracts with third parties',
  },
];

export default function RoleSelectionScreen() {
  const { selectedRoles, updateRoles, isLoading } = useApp();
  const [localSelection, setLocalSelection] = useState<UserRole[]>(selectedRoles);
  const router = useRouter();

  const toggleRole = (roleId: UserRole) => {
    setLocalSelection((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    );
  };

  const handleContinue = async () => {
    await updateRoles(localSelection);
    router.push('/legal');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Shield color="#1e40af" size={48} />
          </View>
          <Text style={styles.title}>Your Role in Fraud Prevention</Text>
          <Text style={styles.subtitle}>
            Select your responsibilities to personalize your guidance
          </Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            As a budget-holder, you are the front line of fraud prevention.
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roleOptions.map((role) => {
            const isSelected = localSelection.includes(role.id);
            const Icon = role.icon;

            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => toggleRole(role.id)}
                activeOpacity={0.7}
              >
                <View style={styles.roleCardContent}>
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                    <Icon color={isSelected ? '#ffffff' : '#1e40af'} size={24} />
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>
                      {role.title}
                    </Text>
                    <Text style={[styles.roleDescription, isSelected && styles.roleDescriptionSelected]}>
                      {role.description}
                    </Text>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <View style={styles.checkboxInner} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.continueButton, localSelection.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={localSelection.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {localSelection.length === 0 ? 'Select at least one role' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          You can select multiple roles. This helps us show you the most relevant fraud risks and controls.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  messageCard: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
  },
  rolesContainer: {
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  roleCardSelected: {
    borderColor: '#1e40af',
    backgroundColor: '#eff6ff',
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconCircleSelected: {
    backgroundColor: '#1e40af',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  roleTitleSelected: {
    color: '#1e40af',
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  roleDescriptionSelected: {
    color: '#1e40af',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#1e40af',
    backgroundColor: '#1e40af',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  footerNote: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
