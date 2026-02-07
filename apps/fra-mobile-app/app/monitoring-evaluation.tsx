import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAssessment } from '@/contexts/AssessmentContext';
import { BarChart3, Target, TrendingUp } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function MonitoringEvaluationScreen() {
  const router = useRouter();
  const { assessment, updateAssessment } = useAssessment();
  const [notes, setNotes] = useState(assessment.monitoringEvaluation.notes);
  const [responsiblePerson, setResponsiblePerson] = useState(assessment.monitoringEvaluation.responsiblePerson);

  const handleNext = () => {
    updateAssessment({
      monitoringEvaluation: {
        ...assessment.monitoringEvaluation,
        notes,
        responsiblePerson,
      },
    });
    router.push('/compliance-mapping');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BarChart3 size={32} color={colors.govBlue} />
          <Text style={styles.title} accessibilityRole="header">Monitoring & Evaluation</Text>
        </View>

        <Text style={styles.intro}>
          Continuous monitoring and evaluation ensure fraud prevention measures remain effective over time.
        </Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={20} color={colors.govBlue} />
            <Text style={styles.sectionTitle}>Key Performance Indicators (KPIs)</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Training Completion Rate</Text>
              <Text style={styles.kpiTarget}>Target: 95%</Text>
            </View>
            <Text style={styles.kpiDesc}>Percentage of staff completing mandatory fraud training</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Investigation Closure Time</Text>
              <Text style={styles.kpiTarget}>Target: &lt; 30 days</Text>
            </View>
            <Text style={styles.kpiDesc}>Average time to complete fraud investigations</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>High-Risk Controls Tested</Text>
              <Text style={styles.kpiTarget}>Target: 20 per year</Text>
            </View>
            <Text style={styles.kpiDesc}>Number of critical controls reviewed annually</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Duplicate Payments</Text>
              <Text style={styles.kpiTarget}>Target: 0 per month</Text>
            </View>
            <Text style={styles.kpiDesc}>Number of duplicate payments detected</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={styles.kpiRow}>
              <Text style={styles.kpiLabel}>Manual Overrides</Text>
              <Text style={styles.kpiTarget}>Target: &lt; 1%</Text>
            </View>
            <Text style={styles.kpiDesc}>Percentage of payments with manual approval overrides</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.successGreen} />
            <Text style={styles.sectionTitle}>Review Framework</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.reviewItem}>📅 Quarterly FRA review meetings</Text>
            <Text style={styles.reviewItem}>📊 Monthly KPI dashboard updates</Text>
            <Text style={styles.reviewItem}>🔍 Semi-annual deep-dive audits</Text>
            <Text style={styles.reviewItem}>📈 Annual risk register refresh</Text>
            <Text style={styles.reviewItem}>✅ Continuous control testing</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Responsible Person</Text>
          <Text style={styles.hint}>
            Who is responsible for monitoring and evaluation oversight?
          </Text>
          <TextInput
            style={styles.input}
            value={responsiblePerson}
            onChangeText={setResponsiblePerson}
            placeholder="e.g. Head of Internal Audit, CFO"
            placeholderTextColor={colors.govGrey3}
            accessibilityLabel="Responsible Person"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Monitoring Notes</Text>
          <Text style={styles.hint}>
            Describe current monitoring practices or planned improvements
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter monitoring and evaluation details..."
            placeholderTextColor={colors.govGrey3}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            accessibilityLabel="Monitoring Notes"
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Continue to Compliance Mapping">
          <Text style={styles.nextButtonText}>Continue to Compliance Mapping</Text>
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
  kpiCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.govBlue,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    flex: 1,
  },
  kpiTarget: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.govBlue,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  kpiDesc: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  card: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.successGreen,
  },
  reviewItem: {
    fontSize: 14,
    color: colors.govGrey1,
    marginBottom: 8,
    paddingLeft: 4,
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
