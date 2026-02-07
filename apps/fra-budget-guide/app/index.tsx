import { useApp, UserRole } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import ActionButton from '@/components/ActionButton';
import InfoBanner from '@/components/InfoBanner';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { roleOptions } from '@/constants/data/role-options';

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Shield color={colors.primary} size={48} />
        </View>
        <Text style={styles.title}>Your Role in Fraud Prevention</Text>
        <Text style={styles.subtitle}>
          Select your responsibilities to personalize your guidance
        </Text>
      </View>

      <InfoBanner
        message="As a budget-holder, you are the front line of fraud prevention."
        variant="info"
      />
      <View style={styles.bannerSpacer} />

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
              accessibilityRole="button"
              accessibilityLabel={`${role.title}: ${role.description}${isSelected ? ', selected' : ''}`}
            >
              <View style={styles.roleCardContent}>
                <View style={[styles.iconCircle, isSelected && styles.iconCircleSelected]}>
                  <Icon color={isSelected ? colors.surface : colors.primary} size={24} />
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

      <ActionButton
        label={localSelection.length === 0 ? 'Select at least one role' : 'Continue'}
        onPress={handleContinue}
        disabled={localSelection.length === 0}
      />

      <Text style={styles.footerNote}>
        You can select multiple roles. This helps us show you the most relevant fraud risks and controls.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bannerSpacer: {
    marginBottom: spacing.lg,
  },
  rolesContainer: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.md,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircleSelected: {
    backgroundColor: colors.primary,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleTitleSelected: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 18,
  },
  roleDescriptionSelected: {
    color: colors.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surface,
  },
  footerNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.md,
  },
});
