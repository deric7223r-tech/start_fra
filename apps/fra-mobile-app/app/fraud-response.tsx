import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AlertOctagon, Clock, Search, FileText } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function FraudResponseScreen() {
  const router = useRouter();
  const { assessment, updateAssessment } = useAssessment();
  const [notes, setNotes] = useState(assessment.fraudResponsePlan.notes);

  const handleNext = () => {
    updateAssessment({
      fraudResponsePlan: {
        ...assessment.fraudResponsePlan,
        notes,
      },
    });
    router.push('/action-plan');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AlertOctagon size={32} color={colors.govRed} />
          <Text style={styles.title} accessibilityRole="header">Fraud Response Plan</Text>
        </View>

        <Text style={styles.intro}>
          A clear fraud response plan ensures incidents are handled quickly, consistently, and in compliance with legal requirements.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.govBlue} />
            <Text style={styles.sectionTitle}>Reporting Timelines</Text>
          </View>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Log Incident</Text>
                <Text style={styles.timelineTime}>Within 24 hours</Text>
                <Text style={styles.timelineDesc}>All suspected fraud must be logged in the incident register</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Initial Assessment</Text>
                <Text style={styles.timelineTime}>Within 48 hours</Text>
                <Text style={styles.timelineDesc}>Preliminary review to assess severity and determine next steps</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Investigation Start</Text>
                <Text style={styles.timelineTime}>Within 72 hours</Text>
                <Text style={styles.timelineDesc}>Formal investigation begins with assigned investigator</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Search size={20} color={colors.warningOrange} />
            <Text style={styles.sectionTitle}>Investigation Lifecycle</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>1. Triage</Text>
              <Text style={styles.phaseDays}>2 days</Text>
            </View>
            <Text style={styles.phaseDesc}>Initial evidence gathering and risk assessment</Text>
          </View>
          <View style={[styles.card, styles.cardMargin]}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>2. Investigation</Text>
              <Text style={styles.phaseDays}>10 days</Text>
            </View>
            <Text style={styles.phaseDesc}>Detailed investigation, interviews, and evidence collection</Text>
          </View>
          <View style={[styles.card, styles.cardMargin]}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>3. Findings</Text>
              <Text style={styles.phaseDays}>3 days</Text>
            </View>
            <Text style={styles.phaseDesc}>Analysis, conclusions, and recommendations</Text>
          </View>
          <View style={[styles.card, styles.cardMargin]}>
            <View style={styles.phaseRow}>
              <Text style={styles.phaseLabel}>4. Closure</Text>
              <Text style={styles.phaseDays}>5 days</Text>
            </View>
            <Text style={styles.phaseDesc}>Final report, actions, and case closure</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={20} color={colors.govRed} />
            <Text style={styles.sectionTitle}>Disciplinary Measures</Text>
          </View>
          <View style={styles.disciplinaryCard}>
            <Text style={styles.disciplinaryItem}>1️⃣ Verbal Warning</Text>
            <Text style={styles.disciplinaryItem}>2️⃣ Written Warning</Text>
            <Text style={styles.disciplinaryItem}>3️⃣ Suspension</Text>
            <Text style={styles.disciplinaryItem}>4️⃣ Dismissal</Text>
            <Text style={styles.disciplinaryItem}>5️⃣ Prosecution (where criminal activity identified)</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>External Reporting</Text>
            <Text style={styles.infoText}>
              Regulatory reporting within 7 days where legally required. This includes notifying relevant regulators, law enforcement, or sector-specific bodies as appropriate.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Response Plan Notes</Text>
          <Text style={styles.hint}>
            Describe any organisation-specific response procedures or escalation paths
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter fraud response plan details..."
            placeholderTextColor={colors.govGrey3}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            accessibilityLabel="Response Plan Notes"
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Continue to Action Plan">
          <Text style={styles.nextButtonText}>Continue to Action Plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.govGrey1,
  },
  intro: {
    fontSize: 16,
    color: colors.govGrey2,
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  timelineCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.govBlue,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.govBlue,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.govRed,
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  card: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.warningOrange,
  },
  cardMargin: {
    marginTop: 12,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phaseLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  phaseDays: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.warningOrange,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  phaseDesc: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  disciplinaryCard: {
    backgroundColor: '#fee',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.govRed,
  },
  disciplinaryItem: {
    fontSize: 14,
    color: colors.govGrey1,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  infoBox: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.govBlue,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.govBlue,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.govGrey1,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: colors.govGrey2,
    marginBottom: 12,
    fontStyle: 'italic' as const,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.govGrey1,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: colors.govGrey1,
    backgroundColor: colors.white,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  nextButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.white,
  },

});
