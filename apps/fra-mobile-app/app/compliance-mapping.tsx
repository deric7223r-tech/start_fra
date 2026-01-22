import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAssessment } from '@/contexts/AssessmentContext';
import { CheckCircle, AlertCircle, FileCheck } from 'lucide-react-native';
import colors from '@/constants/colors';

export default function ComplianceMappingScreen() {
  const router = useRouter();
  const { assessment, updateAssessment } = useAssessment();
  const [notes, setNotes] = useState(assessment.complianceMapping.notes);

  const handleNext = () => {
    updateAssessment({
      complianceMapping: {
        ...assessment.complianceMapping,
        notes,
      },
    });
    router.push('/fraud-response');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <FileCheck size={32} color={colors.govBlue} />
          <Text style={styles.title}>Compliance Mapping</Text>
        </View>

        <Text style={styles.intro}>
          Map your fraud prevention framework against key UK standards and regulatory requirements.
        </Text>

        <View style={styles.section}>
          <View style={styles.standardCard}>
            <View style={styles.standardHeader}>
              <CheckCircle size={24} color={colors.govBlue} />
              <Text style={styles.standardTitle}>GovS-013 Counter Fraud Standard</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Fully Compliant</Text>
            </View>
            <Text style={styles.standardDesc}>
              The Government Functional Standard for Counter Fraud provides the framework for counter fraud activity across government.
            </Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirementItem}>✓ 3.2 Controls in place</Text>
              <Text style={styles.requirementItem}>✓ 3.4 Monitoring procedures</Text>
              <Text style={styles.requirementItem}>✓ 4.1 Investigation readiness</Text>
              <Text style={styles.requirementItem}>⚠ Minor improvements required</Text>
            </View>
          </View>

          <View style={[styles.standardCard, styles.partialCard]}>
            <View style={styles.standardHeader}>
              <AlertCircle size={24} color={colors.warningOrange} />
              <Text style={styles.standardTitle}>Fraud Prevention Standard</Text>
            </View>
            <View style={[styles.statusBadge, styles.partialBadge]}>
              <Text style={styles.statusText}>Partially Compliant</Text>
            </View>
            <Text style={styles.standardDesc}>
              Proportionality and control expectations for fraud prevention across all organisations.
            </Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirementItem}>✓ Risk assessment completed</Text>
              <Text style={styles.requirementItem}>✓ Basic controls in place</Text>
              <Text style={styles.requirementItem}>⚠ Enhanced monitoring needed</Text>
              <Text style={styles.requirementItem}>⚠ Training program expansion required</Text>
            </View>
          </View>

          <View style={styles.standardCard}>
            <View style={styles.standardHeader}>
              <CheckCircle size={24} color={colors.successGreen} />
              <Text style={styles.standardTitle}>ECCTA 2023</Text>
            </View>
            <View style={[styles.statusBadge, styles.alignedBadge]}>
              <Text style={styles.statusText}>Framework Aligned</Text>
            </View>
            <Text style={styles.standardDesc}>
              Economic Crime and Corporate Transparency Act 2023 introduces &ldquo;failure to prevent fraud&rdquo; offence requiring reasonable prevention procedures.
            </Text>
            <View style={styles.requirementsList}>
              <Text style={styles.requirementItem}>✓ Reasonable procedures framework</Text>
              <Text style={styles.requirementItem}>✓ Risk-based approach</Text>
              <Text style={styles.requirementItem}>✓ Documentation and evidence</Text>
              <Text style={styles.requirementItem}>⚠ Periodic testing required</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.summaryTitle}>Compliance Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryItem}>🟢 Overall compliance level: <Text style={styles.bold}>Good</Text></Text>
            <Text style={styles.summaryItem}>📋 Total requirements assessed: <Text style={styles.bold}>42</Text></Text>
            <Text style={styles.summaryItem}>✅ Fully compliant: <Text style={styles.bold}>28</Text></Text>
            <Text style={styles.summaryItem}>⚠️ Partially compliant: <Text style={styles.bold}>11</Text></Text>
            <Text style={styles.summaryItem}>❌ Non-compliant: <Text style={styles.bold}>3</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Compliance Notes</Text>
          <Text style={styles.hint}>
            Describe any specific compliance gaps, actions taken, or planned improvements
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter compliance mapping details..."
            placeholderTextColor={colors.govGrey3}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>Continue to Fraud Response Plan</Text>
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
  standardCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.govBlue,
  },
  partialCard: {
    borderLeftColor: colors.warningOrange,
  },
  standardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  standardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: colors.govBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  partialBadge: {
    backgroundColor: colors.warningOrange,
  },
  alignedBadge: {
    backgroundColor: colors.successGreen,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
    textTransform: 'uppercase' as const,
  },
  standardDesc: {
    fontSize: 14,
    color: colors.govGrey2,
    marginBottom: 14,
    lineHeight: 20,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    fontSize: 13,
    color: colors.govGrey1,
    paddingLeft: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.successGreen,
  },
  summaryItem: {
    fontSize: 14,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700' as const,
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
