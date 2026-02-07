import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Share, Alert, Clipboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, Download, Share2, ChevronDown, ChevronUp, AlertTriangle, GraduationCap, BarChart3, FileCheck, AlertOctagon, ListChecks, DollarSign, Link2, Copy, Users } from 'lucide-react-native';
import colors from '@/constants/colors';
import { createLogger } from '@/utils/logger';

export default function ConfirmationScreen() {
  const logger = createLogger('Confirmation');
  const router = useRouter();
  const { assessment } = useAssessment();
  const { organisation } = useAuth();
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  const handleDownloadReport = () => {
    Alert.alert(
      'Report Ready',
      'Your comprehensive FRA Version 2.0 report has been generated and would be downloaded as a PDF file.',
      [{ text: 'OK' }]
    );
  };

  const handleExportRegister = () => {
    Alert.alert(
      'Export Risk Register',
      'Your risk register would be exported as a CSV file for use in Excel or other tools.',
      [{ text: 'OK' }]
    );
  };

  const handleShareReport = async () => {
    try {
      await Share.share({
        message: `Fraud Risk Assessment Version 2.0 completed for ${assessment.organisation.name}. Transaction ID: ${assessment.payment.transactionId}`,
        title: 'FRA Report',
      });
    } catch (error) {
      logger.error('Error sharing:', error);
    }
  };

  const packageName = assessment.payment.packageType === 'health-check'
    ? 'Health Check FRA'
    : assessment.payment.packageType === 'with-awareness'
    ? 'FRA + Awareness Briefing'
    : 'FRA + Dashboard (12 months)';

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const highRiskCount = assessment.riskRegister.filter(r => r.priority === 'high').length;
  const mediumRiskCount = assessment.riskRegister.filter(r => r.priority === 'medium').length;
  const lowRiskCount = assessment.riskRegister.filter(r => r.priority === 'low').length;
  const totalRisks = assessment.riskRegister.length;
  
  const overallRiskRating = highRiskCount > 3 ? 'High' : highRiskCount > 0 ? 'Medium' : 'Low';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}>
          <CheckCircle2 size={64} color={colors.govGreen} strokeWidth={2} />
        </View>

        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your comprehensive fraud risk assessment is complete</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Package</Text>
            <Text style={styles.detailValue}>{packageName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount paid</Text>
            <Text style={styles.detailValue}>£{assessment.payment.price.toLocaleString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{assessment.payment.transactionId}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {new Date(assessment.payment.date || '').toLocaleDateString('en-GB')}
            </Text>
          </View>
        </View>

        {organisation && (organisation.keyPassesAllocated ?? 0) > 0 && (
          <View style={styles.employeeAccessCard}>
            <View style={styles.employeeAccessHeader}>
              <Link2 size={24} color={colors.govBlue} />
              <Text style={styles.employeeAccessTitle}>Employee Access Link</Text>
            </View>
            <Text style={styles.employeeAccessDescription}>
              Share this link with your employees to give them access to fraud awareness training and materials.
            </Text>

            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                https://rork.app/employee-access/{organisation?.organisationId || 'unknown'}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => {
                  Clipboard.setString(`https://rork.app/employee-access/${organisation?.organisationId || 'unknown'}`);
                  Alert.alert('Copied!', 'Link copied to clipboard');
                }}
                activeOpacity={0.7}
              >
                <Copy size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.keyPassInfo}>
              <Users size={16} color={colors.govGrey2} />
              <Text style={styles.keyPassInfoText}>
                {(organisation.keyPassesAllocated ?? 0) - (organisation.keyPassesUsed ?? 0)} of {organisation.keyPassesAllocated ?? 0} access passes available
              </Text>
            </View>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={async () => {
                try {
                  await Share.share({
                    message: `You've been granted access to fraud risk awareness training. Visit this link to get started: https://rork.app/employee-access/${organisation?.organisationId || 'unknown'}`,
                    title: 'Fraud Risk Awareness Training Access',
                  });
                } catch (error) {
                  logger.error('Error sharing link:', error);
                }
              }}
              activeOpacity={0.8}
            >
              <Share2 size={18} color={colors.govBlue} />
              <Text style={styles.shareButtonText}>Share Link with Employees</Text>
            </TouchableOpacity>

            <Text style={styles.employeeAccessNote}>
              Employees will need to enter their email address to access the materials. Each access uses one key-pass.
            </Text>
          </View>
        )}

        <View style={styles.fraHeaderCard}>
          <Text style={styles.fraTitle}>COMPREHENSIVE FRAUD RISK ASSESSMENT</Text>
          <Text style={styles.fraSubtitle}>Version 2.0</Text>
          <Text style={styles.fraStandards}>Aligned with UK GovS-013, Fraud Prevention Standard & ECCTA 2023</Text>
        </View>

        <View style={styles.documentControlCard}>
          <Text style={styles.sectionTitle}>DOCUMENT CONTROL</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Organisation:</Text>
            <Text style={styles.infoValue}>{assessment.organisation.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>{assessment.documentControl.version}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{new Date(assessment.documentControl.lastUpdated).toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Classification:</Text>
            <Text style={styles.infoValue}>{assessment.documentControl.classification}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Retention Period:</Text>
            <Text style={styles.infoValue}>{assessment.documentControl.retentionPeriod}</Text>
          </View>
        </View>

        <View style={styles.executiveSummaryCard}>
          <Text style={styles.sectionTitle}>EXECUTIVE SUMMARY</Text>
          
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Purpose</Text>
            <Text style={styles.bodyText}>This assessment identifies, evaluates, and prioritizes fraud risks and establishes proportionate prevention procedures.</Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Standards Applied</Text>
            <Text style={styles.bodyText}>• GovS-013 Counter Fraud Standard</Text>
            <Text style={styles.bodyText}>• Fraud Prevention Standard</Text>
            <Text style={styles.bodyText}>• ECCTA 2023 &quot;Failure to Prevent Fraud&quot; offence</Text>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Overall Risk Rating</Text>
            <View style={[
              styles.riskBadge,
              overallRiskRating === 'High' && { backgroundColor: colors.errorRed },
              overallRiskRating === 'Medium' && { backgroundColor: colors.warningOrange },
              overallRiskRating === 'Low' && { backgroundColor: colors.govGreen },
            ]}>
              <Text style={styles.riskBadgeText}>{overallRiskRating}</Text>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Key Findings</Text>
            <Text style={styles.bodyText}>Risks Identified: {totalRisks}</Text>
            <View style={styles.priorityRow}>
              <View style={styles.priorityBadgeHigh}>
                <Text style={styles.priorityBadgeSmallText}>High: {highRiskCount}</Text>
              </View>
              <View style={styles.priorityBadgeMedium}>
                <Text style={styles.priorityBadgeSmallText}>Medium: {mediumRiskCount}</Text>
              </View>
              <View style={styles.priorityBadgeLow}>
                <Text style={styles.priorityBadgeSmallText}>Low: {lowRiskCount}</Text>
              </View>
            </View>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Top Priority Recommendations</Text>
            {assessment.actionPlan.highPriority.slice(0, 3).map((action) => (
              <Text key={action.id} style={styles.bodyText}>• {action.title}</Text>
            ))}
            {assessment.actionPlan.highPriority.length === 0 && (
              <>
                <Text style={styles.bodyText}>• Strengthen procurement controls and supplier due diligence</Text>
                <Text style={styles.bodyText}>• Implement continuous transaction monitoring</Text>
                <Text style={styles.bodyText}>• Introduce updated whistleblowing portal</Text>
              </>
            )}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('riskRegister')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <AlertTriangle size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>FRAUD RISK REGISTER</Text>
            {expandedSections.riskRegister ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.riskRegister && (
          <View style={styles.expandedContent}>
            {assessment.riskRegister.map((risk) => (
              <View key={risk.id} style={styles.riskItem}>
                <View style={styles.riskHeader}>
                  <Text style={styles.riskId}>{risk.id}</Text>
                  <View style={[
                    styles.priorityBadgeSmall,
                    risk.priority === 'high' && { backgroundColor: colors.errorRed },
                    risk.priority === 'medium' && { backgroundColor: colors.warningOrange },
                    risk.priority === 'low' && { backgroundColor: colors.govGreen },
                  ]}>
                    <Text style={styles.priorityBadgeSmallText}>{risk.priority.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.riskTitle}>{risk.title}</Text>
                <Text style={styles.riskArea}>Area: {risk.area}</Text>
                <Text style={styles.riskDescription}>{risk.description}</Text>
                <View style={styles.riskScores}>
                  <Text style={styles.scoreText}>Inherent: {risk.inherentScore}/25</Text>
                  <Text style={styles.scoreText}>Residual: {risk.residualScore}/25</Text>
                </View>
                <Text style={styles.riskOwner}>Owner: {risk.suggestedOwner}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('payments')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <DollarSign size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>PAYMENTS RISK MODULE</Text>
            {expandedSections.payments ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.payments && (
          <View style={styles.expandedContent}>
            <Text style={styles.moduleTitle}>Overview</Text>
            <Text style={styles.bodyText}>Payments represent one of the highest-exposure fraud areas. This module provides full analysis of payment-related risks, controls, monitoring requirements, and scenarios.</Text>
            
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Payment Process Scope</Text>
              <Text style={styles.bodyText}>• Supplier payments (domestic & international)</Text>
              <Text style={styles.bodyText}>• Payroll payments</Text>
              <Text style={styles.bodyText}>• Refunds and customer compensation</Text>
              <Text style={styles.bodyText}>• One-off / emergency payments</Text>
              <Text style={styles.bodyText}>• Bank file creation, approval, and upload</Text>
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Key Payment Risks Identified</Text>
              {assessment.paymentsModule.risks.map((risk) => (
                <Text key={risk.id} style={styles.bodyText}>• {risk.title} (Inherent: {risk.inherentScore}/25)</Text>
              ))}
              {assessment.paymentsModule.risks.length === 0 && (
                <>
                  <Text style={styles.bodyText}>• Duplicate payments</Text>
                  <Text style={styles.bodyText}>• Fictitious suppliers</Text>
                  <Text style={styles.bodyText}>• Invoice manipulation or inflation</Text>
                  <Text style={styles.bodyText}>• Bank detail manipulation (BEC)</Text>
                </>
              )}
            </View>

            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Monitoring KPIs</Text>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Duplicate payments/month:</Text>
                <Text style={styles.kpiValue}>{assessment.paymentsModule.kpis.duplicatePayments} (Target: 0)</Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Manual overrides:</Text>
                <Text style={styles.kpiValue}>{assessment.paymentsModule.kpis.manualOverrides}% (Target: &lt;1%)</Text>
              </View>
              <View style={styles.kpiRow}>
                <Text style={styles.kpiLabel}>Supplier verification rate:</Text>
                <Text style={styles.kpiValue}>{assessment.paymentsModule.kpis.supplierVerificationRate}% (Target: 100%)</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('training')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <GraduationCap size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>TRAINING & AWARENESS</Text>
            {expandedSections.training ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.training && (
          <View style={styles.expandedContent}>
            <Text style={styles.bodyText}>• Mandatory annual training for all staff</Text>
            <Text style={styles.bodyText}>• Specialist training for Finance, Procurement, HR</Text>
            <Text style={styles.bodyText}>• Board training every 2 years</Text>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Overall Completion Rate</Text>
              <Text style={styles.highlight}>{assessment.trainingAwareness.overallCompletionRate}%</Text>
              <Text style={styles.bodyText}>Target: 95%</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('monitoring')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <BarChart3 size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>MONITORING & EVALUATION</Text>
            {expandedSections.monitoring ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.monitoring && (
          <View style={styles.expandedContent}>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Key Performance Indicators</Text>
              {assessment.monitoringEvaluation.kpis.map((kpi) => (
                <View key={kpi.id} style={styles.kpiRow}>
                  <Text style={styles.kpiLabel}>{kpi.name}:</Text>
                  <Text style={styles.kpiValue}>{kpi.current}{kpi.unit} / {kpi.target}{kpi.unit} ({kpi.status})</Text>
                </View>
              ))}
              {assessment.monitoringEvaluation.kpis.length === 0 && (
                <>
                  <Text style={styles.bodyText}>• Training completion: 95% target</Text>
                  <Text style={styles.bodyText}>• Investigation closure time: &lt; 30 days</Text>
                  <Text style={styles.bodyText}>• High-risk controls tested: 20 per year</Text>
                </>
              )}
            </View>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Review Frequency</Text>
              <Text style={styles.bodyText}>{assessment.monitoringEvaluation.reviewFrequency}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('compliance')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <FileCheck size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>COMPLIANCE MAPPING</Text>
            {expandedSections.compliance ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.compliance && (
          <View style={styles.expandedContent}>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceStandard}>GovS-013</Text>
              <View style={[styles.statusBadge, getStatusColor(assessment.complianceMapping.govS013.status)]}>
                <Text style={styles.statusText}>{getStatusLabel(assessment.complianceMapping.govS013.status)}</Text>
              </View>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceStandard}>Fraud Prevention Standard</Text>
              <View style={[styles.statusBadge, getStatusColor(assessment.complianceMapping.fraudPreventionStandard.status)]}>
                <Text style={styles.statusText}>{getStatusLabel(assessment.complianceMapping.fraudPreventionStandard.status)}</Text>
              </View>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceStandard}>ECCTA 2023</Text>
              <View style={[styles.statusBadge, getStatusColor(assessment.complianceMapping.eccta2023.status)]}>
                <Text style={styles.statusText}>{getStatusLabel(assessment.complianceMapping.eccta2023.status)}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('response')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <AlertOctagon size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>FRAUD RESPONSE PLAN</Text>
            {expandedSections.response ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.response && (
          <View style={styles.expandedContent}>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Reporting Timelines</Text>
              <Text style={styles.bodyText}>• Log incident: &lt; {assessment.fraudResponsePlan.reportingTimelines.logIncident} hours</Text>
              <Text style={styles.bodyText}>• Initial assessment: &lt; {assessment.fraudResponsePlan.reportingTimelines.initialAssessment} hours</Text>
              <Text style={styles.bodyText}>• Investigation start: &lt; {assessment.fraudResponsePlan.reportingTimelines.investigationStart} hours</Text>
            </View>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Investigation Lifecycle</Text>
              <Text style={styles.bodyText}>• Triage: {assessment.fraudResponsePlan.investigationLifecycle.triage} days</Text>
              <Text style={styles.bodyText}>• Investigation: {assessment.fraudResponsePlan.investigationLifecycle.investigation} days</Text>
              <Text style={styles.bodyText}>• Findings: {assessment.fraudResponsePlan.investigationLifecycle.findings} days</Text>
              <Text style={styles.bodyText}>• Closure: {assessment.fraudResponsePlan.investigationLifecycle.closure} days</Text>
            </View>
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Disciplinary Measures</Text>
              {assessment.fraudResponsePlan.disciplinaryMeasures.map((measure, idx) => (
                <Text key={idx} style={styles.bodyText}>• {measure}</Text>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.expandableSection}
          onPress={() => toggleSection('actions')}
          activeOpacity={0.7}
        >
          <View style={styles.expandableHeader}>
            <ListChecks size={20} color={colors.govBlue} />
            <Text style={styles.expandableTitle}>ACTION PLAN</Text>
            {expandedSections.actions ? <ChevronUp size={20} color={colors.govGrey2} /> : <ChevronDown size={20} color={colors.govGrey2} />}
          </View>
        </TouchableOpacity>
        {expandedSections.actions && (
          <View style={styles.expandedContent}>
            {assessment.actionPlan.highPriority.length > 0 ? (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>High Priority (0-3 Months)</Text>
                {assessment.actionPlan.highPriority.map((action) => (
                  <View key={action.id} style={styles.actionItem}>
                    <Text style={styles.actionTitle}>• {action.title}</Text>
                    <Text style={styles.actionOwner}>Owner: {action.owner}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>High Priority (0-3 Months)</Text>
                <Text style={styles.bodyText}>• Deploy new whistleblowing system</Text>
                <Text style={styles.bodyText}>• Refresh conflict of interest policy</Text>
                <Text style={styles.bodyText}>• Strengthen supplier due diligence</Text>
              </View>
            )}
            {assessment.actionPlan.mediumPriority.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Medium Priority (3-6 Months)</Text>
                {assessment.actionPlan.mediumPriority.map((action) => (
                  <View key={action.id} style={styles.actionItem}>
                    <Text style={styles.actionTitle}>• {action.title}</Text>
                    <Text style={styles.actionOwner}>Owner: {action.owner}</Text>
                  </View>
                ))}
              </View>
            )}
            {assessment.actionPlan.lowPriority.length > 0 && (
              <View style={styles.subsection}>
                <Text style={styles.subsectionTitle}>Low Priority (6-12 Months)</Text>
                {assessment.actionPlan.lowPriority.map((action) => (
                  <View key={action.id} style={styles.actionItem}>
                    <Text style={styles.actionTitle}>• {action.title}</Text>
                    <Text style={styles.actionOwner}>Owner: {action.owner}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>Export Options</Text>

          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReport} activeOpacity={0.7}>
            <View style={styles.actionIcon}>
              <Download size={20} color={colors.govBlue} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Download Full Report (PDF)</Text>
              <Text style={styles.actionSubtitle}>Complete FRA Version 2.0 document</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportRegister} activeOpacity={0.7}>
            <View style={styles.actionIcon}>
              <Download size={20} color={colors.govBlue} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Export Risk Register (CSV)</Text>
              <Text style={styles.actionSubtitle}>For use in Excel or other tools</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShareReport} activeOpacity={0.7}>
            <View style={styles.actionIcon}>
              <Share2 size={20} color={colors.govBlue} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Share Assessment</Text>
              <Text style={styles.actionSubtitle}>Send details to colleagues</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.emailNote}>
          A confirmation email with download links has been sent to your registered address.
        </Text>

        <TouchableOpacity
          style={styles.signButton}
          onPress={() => router.push('/signature')}
          activeOpacity={0.8}
        >
          <Text style={styles.signButtonText}>Sign Assessment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>Return to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  successIcon: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.govGrey2,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.govGrey2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  fraHeaderCard: {
    backgroundColor: colors.govBlue,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center' as const,
  },
  fraTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  fraSubtitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: 8,
  },
  fraStandards: {
    fontSize: 12,
    color: colors.white,
    textAlign: 'center' as const,
    opacity: 0.9,
  },
  documentControlCard: {
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  executiveSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.govBlue,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.govGrey2,
    fontWeight: '600' as const,
  },
  infoValue: {
    fontSize: 14,
    color: colors.govGrey1,
  },
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: colors.govGrey1,
    lineHeight: 20,
    marginBottom: 4,
  },
  highlight: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.govBlue,
    marginBottom: 4,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start' as const,
  },
  riskBadgeText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.white,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  priorityBadgeHigh: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.errorRed,
    borderRadius: 12,
  },
  priorityBadgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.warningOrange,
    borderRadius: 12,
  },
  priorityBadgeLow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.govGreen,
    borderRadius: 12,
  },
  priorityBadgeSmallText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.white,
  },
  expandableSection: {
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  expandableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  expandableTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.govGrey1,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: colors.white,
  },
  riskItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.govGrey4,
    borderRadius: 6,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskId: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.govBlue,
  },
  priorityBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  riskTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  riskArea: {
    fontSize: 13,
    color: colors.govGrey2,
    marginBottom: 4,
  },
  riskDescription: {
    fontSize: 13,
    color: colors.govGrey1,
    lineHeight: 18,
    marginBottom: 8,
  },
  riskScores: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govGrey2,
  },
  riskOwner: {
    fontSize: 12,
    color: colors.govGrey2,
    fontStyle: 'italic' as const,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 13,
    color: colors.govGrey2,
    flex: 1,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  complianceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: colors.govGrey4,
    borderRadius: 6,
  },
  complianceStandard: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.white,
  },
  actionItem: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    color: colors.govGrey1,
    marginBottom: 2,
  },
  actionOwner: {
    fontSize: 12,
    color: colors.govGrey2,
    fontStyle: 'italic' as const,
  },
  actionsContainer: {
    marginBottom: 20,
    marginTop: 8,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  emailNote: {
    fontSize: 13,
    color: colors.govGrey2,
    textAlign: 'center' as const,
    marginBottom: 20,
    fontStyle: 'italic' as const,
  },
  signButton: {
    backgroundColor: colors.govGreen,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  signButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.white,
  },
  homeButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.govBlue,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  employeeAccessCard: {
    backgroundColor: colors.lightBlue,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.govBlue,
  },
  employeeAccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  employeeAccessTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.govGrey1,
  },
  employeeAccessDescription: {
    fontSize: 14,
    color: colors.govGrey2,
    lineHeight: 20,
    marginBottom: 16,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: colors.govBlue,
    fontWeight: '500' as const,
  },
  copyButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPassInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  keyPassInfoText: {
    fontSize: 13,
    color: colors.govGrey2,
    fontWeight: '600' as const,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.govBlue,
    borderRadius: 8,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  employeeAccessNote: {
    fontSize: 12,
    color: colors.govGrey2,
    lineHeight: 16,
    fontStyle: 'italic' as const,
  },
});

function getStatusLabel(status: string): string {
  switch (status) {
    case 'compliant': return 'Compliant';
    case 'partially-compliant': return 'Partially Compliant';
    case 'non-compliant': return 'Non-Compliant';
    default: return 'Not Assessed';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'compliant': return { backgroundColor: colors.govGreen };
    case 'partially-compliant': return { backgroundColor: colors.warningOrange };
    case 'non-compliant': return { backgroundColor: colors.errorRed };
    default: return { backgroundColor: colors.govGrey2 };
  }
}
