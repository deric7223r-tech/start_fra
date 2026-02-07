import { useRouter } from 'expo-router';
import {
  Shield,
  FileText,
  BookOpen,
  LayoutDashboard,
  CheckCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import ScreenContainer from '@/components/ScreenContainer';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Package data
// ---------------------------------------------------------------------------

interface PackageFeature {
  label: string;
}

interface PackageOption {
  id: string;
  tier: string;
  title: string;
  price: string;
  priceSuffix: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  features: PackageFeature[];
  popular?: boolean;
  route: string;
  ctaLabel: string;
  ctaVariant: 'outline' | 'filled' | 'accent';
}

const packages: PackageOption[] = [
  {
    id: 'starter',
    tier: 'PACKAGE 1',
    title: 'Starter',
    price: '£795',
    priceSuffix: 'one-time',
    icon: FileText,
    features: [
      { label: 'Fraud health check' },
      { label: 'PDF report' },
      { label: 'ECCTA snapshot' },
      { label: '1 key-pass included' },
    ],
    route: '/legal',
    ctaLabel: 'Get Started',
    ctaVariant: 'outline',
  },
  {
    id: 'professional',
    tier: 'PACKAGE 2',
    title: 'Professional',
    price: '£1,995',
    priceSuffix: '/year',
    icon: BookOpen,
    popular: true,
    features: [
      { label: 'Everything in Starter' },
      { label: 'Training programme' },
      { label: '50 key-passes' },
      { label: 'Quarterly reassessment' },
      { label: 'Email support' },
    ],
    route: '/package-info',
    ctaLabel: 'Choose Professional',
    ctaVariant: 'filled',
  },
  {
    id: 'enterprise',
    tier: 'PACKAGE 3',
    title: 'Enterprise',
    price: '£4,995',
    priceSuffix: '/year',
    icon: LayoutDashboard,
    features: [
      { label: 'Everything in Professional' },
      { label: 'Live dashboard' },
      { label: 'Unlimited key-passes' },
      { label: 'Risk register' },
      { label: 'API access' },
      { label: 'Priority support' },
    ],
    route: '/package-enterprise',
    ctaLabel: 'Contact Sales',
    ctaVariant: 'accent',
  },
];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function PackageSelectionScreen() {
  const router = useRouter();

  const handleSelect = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScreenContainer>
      {/* ---- Header (kept from original) ---- */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Shield color={colors.primary} size={48} />
        </View>
        <Text style={styles.title}>Your Role in Fraud Prevention</Text>
        <Text style={styles.subtitle}>
          Choose the package that fits your organisation
        </Text>
      </View>

      {/* ---- Package Cards ---- */}
      <View style={styles.cardsContainer}>
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          const isPopular = !!pkg.popular;

          return (
            <View
              key={pkg.id}
              style={[
                styles.card,
                isPopular && styles.cardPopular,
              ]}
            >
              {/* Popular badge */}
              {isPopular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              {/* Tier badge */}
              <View style={styles.tierBadgeRow}>
                <View style={[styles.tierBadge, isPopular && styles.tierBadgePopular]}>
                  <Text style={[styles.tierBadgeText, isPopular && styles.tierBadgeTextPopular]}>
                    {pkg.tier}
                  </Text>
                </View>
              </View>

              {/* Icon circle */}
              <View style={[styles.iconCircle, isPopular && styles.iconCirclePopular]}>
                <Icon
                  color={isPopular ? colors.surface : colors.primary}
                  size={28}
                />
              </View>

              {/* Title */}
              <Text style={[styles.packageTitle, isPopular && styles.packageTitlePopular]}>
                {pkg.title}
              </Text>

              {/* Price */}
              <View style={styles.priceRow}>
                <Text style={[styles.price, isPopular && styles.pricePopular]}>
                  {pkg.price}
                </Text>
                <Text style={[styles.priceSuffix, isPopular && styles.priceSuffixPopular]}>
                  {pkg.priceSuffix}
                </Text>
              </View>

              {/* Divider */}
              <View style={[styles.divider, isPopular && styles.dividerPopular]} />

              {/* Features */}
              <View style={styles.featuresList}>
                {pkg.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <CheckCircle
                      color={colors.success}
                      size={18}
                    />
                    <Text style={[styles.featureText, isPopular && styles.featureTextPopular]}>
                      {feat.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Divider */}
              <View style={[styles.divider, isPopular && styles.dividerPopular]} />

              {/* CTA */}
              <TouchableOpacity
                style={[
                  styles.ctaBase,
                  pkg.ctaVariant === 'outline' && styles.ctaOutline,
                  pkg.ctaVariant === 'filled' && styles.ctaFilled,
                  pkg.ctaVariant === 'accent' && styles.ctaAccent,
                ]}
                onPress={() => handleSelect(pkg.route)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${pkg.ctaLabel} — ${pkg.title} package at ${pkg.price} ${pkg.priceSuffix}`}
              >
                <Text
                  style={[
                    styles.ctaTextBase,
                    pkg.ctaVariant === 'outline' && styles.ctaTextOutline,
                    pkg.ctaVariant === 'filled' && styles.ctaTextFilled,
                    pkg.ctaVariant === 'accent' && styles.ctaTextAccent,
                  ]}
                >
                  {pkg.ctaLabel}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      <Text style={styles.footerNote}>
        All packages include ECCTA-aligned fraud controls. Prices exclude VAT.
      </Text>
    </ScreenContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerIconContainer: {
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

  // Cards container
  cardsContainer: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  cardPopular: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...shadows.lg,
  },

  // Popular badge
  popularBadge: {
    position: 'absolute',
    top: -13,
    alignSelf: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: borderRadius.full,
  },
  popularBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Tier badge
  tierBadgeRow: {
    marginBottom: spacing.md,
  },
  tierBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tierBadgePopular: {
    backgroundColor: colors.primaryLight,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  tierBadgeTextPopular: {
    color: colors.primary,
  },

  // Icon circle
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCirclePopular: {
    backgroundColor: colors.primary,
  },

  // Package title
  packageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  packageTitlePopular: {
    color: colors.primary,
  },

  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
  },
  pricePopular: {
    color: colors.primary,
  },
  priceSuffix: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  priceSuffixPopular: {
    color: colors.textMuted,
  },

  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  dividerPopular: {
    backgroundColor: colors.primaryBorder,
  },

  // Features
  featuresList: {
    width: '100%',
    gap: spacing.sm + 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: colors.textSecondary,
    marginLeft: spacing.sm + 2,
    lineHeight: 20,
    flex: 1,
  },
  featureTextPopular: {
    color: colors.text,
    fontWeight: '500',
  },

  // CTA buttons
  ctaBase: {
    width: '100%',
    paddingVertical: spacing.md - 2,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ctaFilled: {
    backgroundColor: colors.primary,
  },
  ctaAccent: {
    backgroundColor: colors.warning,
  },
  ctaTextBase: {
    fontSize: 16,
    fontWeight: '700',
  },
  ctaTextOutline: {
    color: colors.primary,
  },
  ctaTextFilled: {
    color: colors.surface,
  },
  ctaTextAccent: {
    color: colors.warningDarkest,
  },

  // Footer
  footerNote: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
