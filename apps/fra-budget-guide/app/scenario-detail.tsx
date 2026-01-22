import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, Eye, Shield } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Scenario {
  id: string;
  title: string;
  howItWorks: string;
  redFlags: string[];
  whatToDo: string[];
  controls: string[];
  example: string;
  decision?: {
    prompt: string;
    options: {
      text: string;
      correct: boolean;
      feedback: string;
    }[];
  };
}

const scenarioData: Record<string, Scenario[]> = {
  procurement: [
    {
      id: 'fake-supplier',
      title: 'Fake Supplier Invoice',
      howItWorks:
        'Fraudster creates fake supplier identity, submits invoice for goods/services never provided. Invoice appears legitimate with professional branding and VAT number. Payment processed to fraudulent bank account.',
      redFlags: [
        'New supplier with no prior relationship',
        'Sole trader/individual rather than established company',
        'Generic email (Gmail, Hotmail vs. corporate domain)',
        'No physical address or vague location',
        'Payment urgency ("Pay immediately to avoid penalties")',
        'Round numbers (£5,000.00 vs. £4,847.23)',
      ],
      whatToDo: [
        'Verify ALL new suppliers before first payment',
        'Check Companies House registration (UK)',
        'Call supplier using independently verified phone number',
        'Require purchase order before invoice submission',
      ],
      controls: [
        'Three quotes for purchases above threshold',
        'New supplier verification checklist',
        'Segregation of duties (requisitioner ≠ approver)',
      ],
      example:
        'Finance team received £8,500 invoice from "IT Solutions Ltd" for software licenses. Checked Companies House—company dissolved 2 years ago. Avoided £8,500 loss.',
      decision: {
        prompt: 'A new supplier submits an invoice for £4,950 with urgent payment requested. What do you do?',
        options: [
          {
            text: 'Pay immediately to avoid penalties',
            correct: false,
            feedback:
              'Wrong. Urgency is a major red flag. Always verify new suppliers before any payment.',
          },
          {
            text: 'Verify supplier through Companies House and independent phone call',
            correct: true,
            feedback:
              'Correct! Always verify new suppliers using independent sources before processing any payment.',
          },
          {
            text: 'Ask colleague if they recognize the supplier',
            correct: false,
            feedback:
              'Insufficient. Rely on documented verification, not verbal confirmation.',
          },
        ],
      },
    },
  ],
  'invoice-payment': [
    {
      id: 'email-impersonation',
      title: 'Email Impersonation (Business Email Compromise)',
      howItWorks:
        'Fraudster impersonates supplier via spoofed email stating "We\'ve changed bank details—please update for future payments." Email looks identical to legitimate supplier communication. Often timed when key person on leave.',
      redFlags: [
        'Unexpected bank detail change request',
        'Urgency language ("Update immediately")',
        'Slight misspelling in sender email (supp1ier vs. supplier)',
        'Generic greeting ("Dear Customer" vs. your name)',
        'Request sent outside normal business hours',
      ],
      whatToDo: [
        'NEVER update bank details via email alone',
        'Call supplier using phone number from contract/invoice (not email)',
        'Verbal confirmation with two authorized signatories',
        'Test payment (£1) before full amount',
      ],
      controls: [
        'Flag all bank changes for senior approval',
        'Email security (SPF, DKIM, DMARC checks)',
        'Mandatory phone verification policy',
      ],
      example:
        'NHS trust received email from "construction supplier" requesting bank change. Verified by phone—supplier had not sent email. Avoided £127,000 fraud.',
      decision: {
        prompt: 'You receive an email from a regular supplier requesting updated bank details. What do you do?',
        options: [
          {
            text: 'Update the details immediately',
            correct: false,
            feedback: 'Wrong. Email is not secure for bank detail changes.',
          },
          {
            text: 'Call supplier using contact details from the original contract',
            correct: true,
            feedback:
              'Correct! Always verify bank changes by phone using independently sourced contact information.',
          },
          {
            text: 'Reply to the email asking for confirmation',
            correct: false,
            feedback:
              'Wrong. If the email is fraudulent, the reply goes to the fraudster.',
          },
        ],
      },
    },
  ],
  payroll: [
    {
      id: 'ghost-employees',
      title: 'Ghost Employees',
      howItWorks:
        'Fictitious employee added to payroll system. Salary payments made to fraudulent bank account. Employee "works" in department with poor headcount oversight. May be former employee not removed from system.',
      redFlags: [
        'Employees with no personnel file',
        'Same bank account for multiple employees',
        'Employees never taking leave',
        'No emergency contact information',
        'Employee unreachable or never seen in office',
      ],
      whatToDo: [
        'Monthly headcount reconciliation (payroll vs. actual staff)',
        'Starter/leaver verification by HR and department',
        'Random personnel file audits',
      ],
      controls: [
        'Bank account uniqueness checks',
        'Mandatory annual leave (fraud detection opportunity)',
        'Segregation of duties in payroll processing',
      ],
      example:
        'Council payroll audit found 3 "employees" paid for 18 months. Total loss: £87,000. Fraudster was payroll clerk with weak oversight.',
    },
  ],
  expenses: [
    {
      id: 'false-expenses',
      title: 'False Expense Claims',
      howItWorks:
        'Personal expenses claimed as business (meals, travel, accommodation). Receipts fabricated or altered using Photoshop or online generators. Same receipt submitted multiple times to different approvers.',
      redFlags: [
        'Receipts from unusual sources (handwritten, poor quality)',
        'Mileage claims inconsistent with diary/meetings',
        'High-value claims with vague descriptions',
        'Weekend/holiday expenses for "business" activities',
        'Receipts in employee name (hotels should show organisation)',
      ],
      whatToDo: [
        'Require original itemized receipts (not credit card slips)',
        'Cross-check mileage vs. calendar appointments',
        'Sample verification (call hotel/restaurant to confirm)',
      ],
      controls: [
        'Expense policy with clear examples',
        'Random audit of expense claims',
        'Digital receipt submission (harder to alter)',
      ],
      example:
        'Employee claimed £8,000 in "client entertainment" over 6 months. Audit revealed receipts from family birthday parties, personal dining. Dismissed for gross misconduct.',
    },
  ],
  contracts: [
    {
      id: 'contract-splitting',
      title: 'Contract Splitting',
      howItWorks:
        'Large contract artificially divided into smaller contracts. Each below competitive tender threshold. Avoids procurement scrutiny. May involve kickbacks from supplier.',
      redFlags: [
        'Multiple small contracts with same supplier for similar services',
        'Contracts start/end on consecutive dates',
        'Total value would exceed tender threshold',
        'Services could reasonably be consolidated',
      ],
      whatToDo: [
        'Aggregate spending review per supplier annually',
        'Contracts board review all awards',
        'Require business justification for multiple contracts',
      ],
      controls: [
        'Procurement oversight of contract patterns',
        'Automated alerts for supplier spending concentration',
        'Annual conflict of interest declarations',
      ],
      example:
        'Department had 5 contracts totaling £120,000 with one IT supplier, each below £25,000 tender threshold. Investigation revealed manager receiving "consulting fees."',
    },
  ],
};

export default function ScenarioDetailScreen() {
  const params = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({});

  const categoryId = params.category || '';
  const scenarios = scenarioData[categoryId] || [];

  const handleAnswer = (scenarioId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [scenarioId]: optionIndex }));
    setShowFeedback((prev) => ({ ...prev, [scenarioId]: true }));
  };

  if (scenarios.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Scenario not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {scenarios.map((scenario) => (
          <View key={scenario.id} style={styles.scenarioContainer}>
            <Text style={styles.scenarioTitle}>{scenario.title}</Text>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AlertCircle color="#0f172a" size={20} />
                <Text style={styles.sectionTitle}>How It Works</Text>
              </View>
              <Text style={styles.sectionText}>{scenario.howItWorks}</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Eye color="#dc2626" size={20} />
                <Text style={styles.sectionTitle}>Red Flags</Text>
              </View>
              {scenario.redFlags.map((flag, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletRed} />
                  <Text style={styles.listText}>{flag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 color="#059669" size={20} />
                <Text style={styles.sectionTitle}>What To Do</Text>
              </View>
              {scenario.whatToDo.map((action, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletGreen} />
                  <Text style={styles.listText}>{action}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Shield color="#1e40af" size={20} />
                <Text style={styles.sectionTitle}>Controls</Text>
              </View>
              {scenario.controls.map((control, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.bulletBlue} />
                  <Text style={styles.listText}>{control}</Text>
                </View>
              ))}
            </View>

            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>Real Example</Text>
              <Text style={styles.exampleText}>{scenario.example}</Text>
            </View>

            {scenario.decision && (
              <View style={styles.decisionCard}>
                <Text style={styles.decisionPrompt}>{scenario.decision.prompt}</Text>
                <View style={styles.optionsContainer}>
                  {scenario.decision.options.map((option, index) => {
                    const isSelected = selectedAnswers[scenario.id] === index;
                    const showResult = showFeedback[scenario.id];
                    const isCorrect = option.correct;

                    return (
                      <View key={index}>
                        <TouchableOpacity
                          style={[
                            styles.optionButton,
                            isSelected && showResult && isCorrect && styles.optionButtonCorrect,
                            isSelected && showResult && !isCorrect && styles.optionButtonWrong,
                          ]}
                          onPress={() => handleAnswer(scenario.id, index)}
                          disabled={showFeedback[scenario.id]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              isSelected && showResult && styles.optionTextSelected,
                            ]}
                          >
                            {option.text}
                          </Text>
                        </TouchableOpacity>
                        {isSelected && showResult && (
                          <View
                            style={[
                              styles.feedbackCard,
                              isCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
                            ]}
                          >
                            <Text style={styles.feedbackText}>{option.feedback}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ))}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/checklists')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>View Approval Checklists</Text>
        </TouchableOpacity>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  scenarioContainer: {
    marginBottom: 32,
  },
  scenarioTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  bulletRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
    marginTop: 7,
    marginRight: 10,
  },
  bulletGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 7,
    marginRight: 10,
  },
  bulletBlue: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e40af',
    marginTop: 7,
    marginRight: 10,
  },
  exampleCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  exampleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  decisionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  decisionPrompt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    padding: 14,
  },
  optionButtonCorrect: {
    borderColor: '#059669',
    backgroundColor: '#d1fae5',
  },
  optionButtonWrong: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e2',
  },
  optionText: {
    fontSize: 14,
    color: '#0f172a',
    lineHeight: 19,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  feedbackCard: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  feedbackCorrect: {
    backgroundColor: '#d1fae5',
  },
  feedbackWrong: {
    backgroundColor: '#fee2e2',
  },
  feedbackText: {
    fontSize: 13,
    color: '#0f172a',
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
