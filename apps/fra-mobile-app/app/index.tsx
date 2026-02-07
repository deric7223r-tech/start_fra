import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAssessment } from '@/contexts/AssessmentContext';
import colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { startNewAssessment } = useAssessment();
  const [mounted, setMounted] = useState(false);

  const handleStartNew = () => {
    startNewAssessment();
    router.push('/organisation');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[colors.govBlue, colors.govBlueDark]}
          style={[styles.container, styles.centered]}
        >
          <ActivityIndicator size="large" color={colors.white} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[colors.govBlue, colors.govBlueDark]}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroBadge}>
            <Shield size={16} color={colors.white} />
            <Text style={styles.heroBadgeText}>UK GovS-013 & ECCTA 2023 Compliant</Text>
          </View>

          <Text style={styles.heroTitle} accessibilityRole="header">Fraud Risk Assessment</Text>
          <Text style={styles.heroTitleAccent}>Made Accessible</Text>

          <Text style={styles.heroSubtitle}>
            A lightweight, standards-aligned FRA for charities and organisations.{"\n"}
            Get the evidence auditors, funders and regulators require—without the heavy consultancy price tag.
          </Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.ctaPrimary} onPress={handleStartNew} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Get Started">
              <Text style={styles.ctaPrimaryText}>Get Started</Text>
              <ArrowRight size={18} color={colors.govBlue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => router.push('/packages')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="View Pricing"
            >
              <Text style={styles.ctaSecondaryText}>View Pricing</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Why this matters</Text>
            <Text style={styles.sectionBody}>
              Fraud prevention is now a governance expectation. This assessment helps you document risks, controls, and priorities in a clear format aligned with UK guidance.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle} accessibilityRole="header">What you get</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Structured assessment across key risk areas</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Risk register with inherent and residual scores</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Clear action priorities to strengthen controls</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.govBlue,
  },
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 48,
    paddingBottom: 60,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 18,
  },
  heroBadgeText: {
    color: colors.white,
    opacity: 0.9,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  heroTitle: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroTitleAccent: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: '#b38b2e',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    opacity: 0.85,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.white,
    minWidth: 160,
  },
  ctaPrimaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.govBlue,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 160,
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: colors.white,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    opacity: 0.85,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: colors.white,
    marginRight: 8,
    fontWeight: '700' as const,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    opacity: 0.9,
  },
});
