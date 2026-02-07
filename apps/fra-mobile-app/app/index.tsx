import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, FileText, BookOpen, LayoutDashboard, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useAssessment } from '@/contexts/AssessmentContext';
import colors from '@/constants/colors';

const GOLD_ACCENT = '#b38b2e';
const GOLD_LIGHT = '#fdf8ed';

export default function HomeScreen() {
  const router = useRouter();
  const { startNewAssessment, selectPackage } = useAssessment();

  const handlePackage1 = () => {
    startNewAssessment();
    selectPackage('health-check', 795);
    router.push('/organisation');
  };

  const handlePackage2 = () => {
    router.push('/package-professional');
  };

  const handlePackage3 = () => {
    router.push('/package-enterprise');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Shield size={32} color={colors.govBlue} />
          <Text style={styles.welcome} accessibilityRole="header">WELCOME</Text>
          <Text style={styles.brand}>FRAUD RISK CO UK</Text>
        </View>

        <View style={styles.cardsContainer}>
          {/* Package 1 — Starter */}
          <TouchableOpacity
            style={styles.card1}
            onPress={handlePackage1}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Package 1: Starter — Fraud Risk Health Check, 795 pounds one-time"
          >
            <View style={styles.cardInner}>
              <View style={styles.cardIconCircle}>
                <FileText size={28} color={colors.white} />
              </View>
              <View style={styles.packageBadge}>
                <Text style={styles.packageBadgeText}>PACKAGE 1</Text>
              </View>
              <Text style={styles.cardTitle}>Starter</Text>
              <Text style={styles.cardSubtitle}>Fraud Risk Health Check</Text>
              <View style={styles.priceBlock}>
                <Text style={styles.cardPrice}>£795</Text>
                <Text style={styles.cardPriceNote}>one-time + VAT</Text>
              </View>
              <View style={styles.featureDivider} />
              <View style={styles.cardFeatures}>
                <FeatureBullet text="Single fraud risk assessment" color={colors.govBlue} />
                <FeatureBullet text="PDF health check report" color={colors.govBlue} />
                <FeatureBullet text="ECCTA compliance snapshot" color={colors.govBlue} />
                <FeatureBullet text="1 key-pass" color={colors.govBlue} />
              </View>
              <View style={styles.ctaDivider} />
              <View style={styles.ctaOutlineBlue}>
                <Text style={styles.ctaTextBlue}>Start Assessment</Text>
                <ArrowRight size={16} color={colors.govBlue} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Package 2 — Professional */}
          <TouchableOpacity
            style={styles.card2}
            onPress={handlePackage2}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Package 2: Professional — FRA plus Training, 1995 pounds per year"
          >
            <View style={styles.popularTag}>
              <Text style={styles.popularTagText}>MOST POPULAR</Text>
            </View>
            <View style={styles.cardInner}>
              <View style={styles.cardIconCirclePopular}>
                <BookOpen size={28} color={colors.white} />
              </View>
              <View style={styles.packageBadgePopular}>
                <Text style={styles.packageBadgeTextPopular}>PACKAGE 2</Text>
              </View>
              <Text style={styles.cardTitle}>Professional</Text>
              <Text style={styles.cardSubtitle}>FRA + Training</Text>
              <View style={styles.priceBlock}>
                <Text style={styles.cardPricePopular}>£1,995</Text>
                <Text style={styles.cardPriceNote}>/year + VAT</Text>
              </View>
              <View style={styles.featureDivider} />
              <View style={styles.cardFeatures}>
                <FeatureBullet text="Everything in Starter" color={colors.govBlue} />
                <FeatureBullet text="Staff awareness training" color={colors.govBlue} />
                <FeatureBullet text="50 employee key-passes" color={colors.govBlue} />
                <FeatureBullet text="Quarterly reassessment" color={colors.govBlue} />
                <FeatureBullet text="Email support" color={colors.govBlue} />
              </View>
              <View style={styles.ctaDivider} />
              <View style={styles.ctaFilledBlue}>
                <Text style={styles.ctaTextWhite}>View Package</Text>
                <ArrowRight size={16} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Package 3 — Enterprise */}
          <TouchableOpacity
            style={styles.card3}
            onPress={handlePackage3}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Package 3: Enterprise — Full Dashboard, 4995 pounds per year"
          >
            <View style={styles.cardInner}>
              <View style={styles.cardIconCircleGold}>
                <LayoutDashboard size={28} color={colors.white} />
              </View>
              <View style={styles.packageBadgeGold}>
                <Text style={styles.packageBadgeTextGold}>PACKAGE 3</Text>
              </View>
              <Text style={styles.cardTitle}>Enterprise</Text>
              <Text style={styles.cardSubtitle}>Full Dashboard + Unlimited</Text>
              <View style={styles.priceBlock}>
                <Text style={styles.cardPriceGold}>£4,995</Text>
                <Text style={styles.cardPriceNote}>/year + VAT</Text>
              </View>
              <View style={styles.featureDivider} />
              <View style={styles.cardFeatures}>
                <FeatureBullet text="Everything in Professional" color={GOLD_ACCENT} />
                <FeatureBullet text="Real-time dashboard" color={GOLD_ACCENT} />
                <FeatureBullet text="Unlimited key-passes" color={GOLD_ACCENT} />
                <FeatureBullet text="Risk register & tracking" color={GOLD_ACCENT} />
                <FeatureBullet text="API access" color={GOLD_ACCENT} />
                <FeatureBullet text="Priority support" color={GOLD_ACCENT} />
              </View>
              <View style={styles.ctaDivider} />
              <View style={styles.ctaOutlineGold}>
                <Text style={styles.ctaTextGold}>View Package</Text>
                <ArrowRight size={16} color={GOLD_ACCENT} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureBullet({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.featureRow}>
      <CheckCircle size={18} color={color} style={styles.featureIcon} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcome: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey2,
    letterSpacing: 4,
    marginTop: 16,
    marginBottom: 4,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.govBlue,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 28,
  },

  /* ---- Card base styles per package ---- */
  card1: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.govBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'visible',
  },
  card2: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: colors.govBlue,
    shadowColor: colors.govBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'visible',
    marginTop: 8,
  },
  card3: {
    backgroundColor: GOLD_LIGHT,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD_ACCENT,
    shadowColor: GOLD_ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
    overflow: 'visible',
  },

  cardInner: {
    padding: 28,
    paddingTop: 30,
    alignItems: 'center',
  },

  /* ---- Popular badge ---- */
  popularTag: {
    position: 'absolute',
    top: -14,
    alignSelf: 'center',
    zIndex: 1,
    backgroundColor: colors.govGreen,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 14,
    shadowColor: colors.govGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  popularTagText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: colors.white,
    letterSpacing: 1.2,
  },

  /* ---- Icon circles ---- */
  cardIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.govBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardIconCirclePopular: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.govBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    marginTop: 4,
  },
  cardIconCircleGold: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: GOLD_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  /* ---- Package number badges ---- */
  packageBadge: {
    backgroundColor: colors.govGrey4,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  packageBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.govGrey2,
    letterSpacing: 1.5,
  },
  packageBadgePopular: {
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  packageBadgeTextPopular: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.govBlue,
    letterSpacing: 1.5,
  },
  packageBadgeGold: {
    backgroundColor: '#f5ecd2',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  packageBadgeTextGold: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: GOLD_ACCENT,
    letterSpacing: 1.5,
  },

  /* ---- Typography ---- */
  cardTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: colors.govGrey2,
    marginBottom: 16,
  },
  priceBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardPrice: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: colors.govBlue,
    lineHeight: 48,
  },
  cardPricePopular: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: colors.govBlue,
    lineHeight: 48,
  },
  cardPriceGold: {
    fontSize: 40,
    fontWeight: '800' as const,
    color: GOLD_ACCENT,
    lineHeight: 48,
  },
  cardPriceNote: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: colors.govGrey2,
    marginTop: 2,
  },

  /* ---- Dividers ---- */
  featureDivider: {
    height: 1,
    backgroundColor: colors.govGrey4,
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  ctaDivider: {
    height: 1,
    backgroundColor: colors.govGrey4,
    alignSelf: 'stretch',
    marginTop: 4,
    marginBottom: 22,
  },

  /* ---- Feature bullets ---- */
  cardFeatures: {
    alignSelf: 'stretch',
    gap: 10,
    paddingHorizontal: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.govGrey1,
    lineHeight: 21,
    flex: 1,
  },

  /* ---- CTA Buttons ---- */
  ctaOutlineBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.govBlue,
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  ctaFilledBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: colors.govBlue,
    alignSelf: 'stretch',
    shadowColor: colors.govBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaOutlineGold: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GOLD_ACCENT,
    backgroundColor: 'transparent',
    alignSelf: 'stretch',
  },
  ctaTextBlue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.govBlue,
  },
  ctaTextWhite: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  ctaTextGold: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: GOLD_ACCENT,
  },
});
