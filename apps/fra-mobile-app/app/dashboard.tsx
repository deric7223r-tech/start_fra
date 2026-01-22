import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Users, Key, FileText, TrendingUp, Filter, Info, Bell, ChevronRight, RefreshCw, X, HelpCircle, AlertCircle, CheckCircle, Clock, PenTool, ArrowRight, Search, ChevronDown, ChevronUp, Download, Grid, List, AlertTriangle, Zap, Eye } from 'lucide-react-native';
import colors from '@/constants/colors';
import type { RiskPriority, AssessmentData } from '@/types/assessment';

type TabType = 'overview' | 'employees' | 'assessments' | 'keypasses' | 'signoff';
type FilterStatus = 'all' | 'completed' | 'in-progress' | 'not-started';
type SortOption = 'name' | 'status' | 'risk' | 'department';
type ViewMode = 'list' | 'grid';

const mockEmployeeData: {
  userId: string;
  userName: string;
  email: string;
  department: string;
  status: 'completed' | 'in-progress' | 'not-started';
  startedAt: string | null;
  completedAt: string | null;
  overallRiskLevel: RiskPriority | null;
}[] = [
  { userId: 'emp-1', userName: 'Sarah Johnson', email: 'sarah.j@company.com', department: 'Finance', status: 'completed', startedAt: '2024-01-15T09:00:00Z', completedAt: '2024-01-15T10:30:00Z', overallRiskLevel: 'medium' },
  { userId: 'emp-2', userName: 'Michael Brown', email: 'michael.b@company.com', department: 'Operations', status: 'in-progress', startedAt: '2024-01-16T14:00:00Z', completedAt: null, overallRiskLevel: null },
  { userId: 'emp-3', userName: 'Emma Davis', email: 'emma.d@company.com', department: 'HR', status: 'not-started', startedAt: null, completedAt: null, overallRiskLevel: null },
  { userId: 'emp-4', userName: 'James Wilson', email: 'james.w@company.com', department: 'Finance', status: 'completed', startedAt: '2024-01-10T08:00:00Z', completedAt: '2024-01-10T09:15:00Z', overallRiskLevel: 'low' },
  { userId: 'emp-5', userName: 'Olivia Taylor', email: 'olivia.t@company.com', department: 'IT', status: 'completed', startedAt: '2024-01-12T11:00:00Z', completedAt: '2024-01-12T12:00:00Z', overallRiskLevel: 'high' },
  { userId: 'emp-6', userName: 'Daniel Martinez', email: 'daniel.m@company.com', department: 'Operations', status: 'in-progress', startedAt: '2024-01-18T10:00:00Z', completedAt: null, overallRiskLevel: null },
];

const completionByDepartment = [
  { department: 'Finance', completed: 2, total: 2 },
  { department: 'Operations', completed: 0, total: 2 },
  { department: 'HR', completed: 0, total: 1 },
  { department: 'IT', completed: 1, total: 1 },
];

const completionTrend = [
  { date: 'Week 1', completed: 0 },
  { date: 'Week 2', completed: 2 },
  { date: 'Week 3', completed: 3 },
  { date: 'Week 4', completed: 3 },
];

const mockAssessmentDetails: Record<string, Partial<AssessmentData>> = {
  'emp-1': {
    id: 'emp-1-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'London', activities: 'Financial services and consulting' },
    riskAppetite: { tolerance: 'low', fraudSeriousness: 'very-serious', reputationImportance: 'critical' },
    fraudTriangle: { pressure: 'moderate', controlStrength: 'reasonably-strong', speakUpCulture: 'quite-confident' },
    procurement: { q1: 'usually', q2: 'always', q3: 'usually', notes: 'Strong procurement controls in place with regular audits' },
    cashBanking: { q1: 'always', q2: 'usually', q3: 'always', notes: 'Dual authorization required for all transactions over £5,000' },
    payrollHR: { q1: 'usually', q2: 'usually', q3: 'always', notes: 'HR reviews payroll changes monthly' },
    revenue: { q1: 'always', q2: 'usually', q3: 'usually', notes: 'Revenue recognition follows IFRS 15 standards' },
    itSystems: { q1: 'usually', q2: 'sometimes', q3: 'usually', notes: 'IT security training conducted quarterly' },
    peopleCulture: { staffChecks: 'always', whistleblowing: 'well-communicated', leadershipMessage: 'very-clear' },
    controlsTechnology: { segregation: 'well-separated', accessManagement: 'very-confident', monitoring: 'regularly' },
    priorities: 'Focus on supplier due diligence and payment controls. Enhance monitoring of high-value transactions.',
    riskRegister: [
      { id: 'r1', title: 'Supplier Fraud', area: 'Procurement', description: 'Risk of fictitious suppliers or invoice manipulation', inherentScore: 15, residualScore: 8, priority: 'medium', suggestedOwner: 'Procurement Manager' },
      { id: 'r2', title: 'Payroll Ghost Employees', area: 'HR', description: 'Risk of unauthorized employees in payroll system', inherentScore: 12, residualScore: 6, priority: 'low', suggestedOwner: 'HR Director' }
    ],
  },
  'emp-4': {
    id: 'emp-4-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'Manchester', activities: 'Manufacturing and distribution' },
    riskAppetite: { tolerance: 'low', fraudSeriousness: 'quite-serious', reputationImportance: 'important' },
    fraudTriangle: { pressure: 'low', controlStrength: 'very-strong', speakUpCulture: 'very-confident' },
    procurement: { q1: 'always', q2: 'always', q3: 'always', notes: 'Excellent procurement processes with automated controls' },
    cashBanking: { q1: 'always', q2: 'always', q3: 'always', notes: 'Full segregation of duties maintained' },
    payrollHR: { q1: 'always', q2: 'always', q3: 'always', notes: 'Automated payroll reconciliation' },
    revenue: { q1: 'always', q2: 'always', q3: 'always', notes: 'Strong revenue controls with regular audits' },
    itSystems: { q1: 'always', q2: 'usually', q3: 'always', notes: 'Comprehensive IT security measures' },
    peopleCulture: { staffChecks: 'always', whistleblowing: 'well-communicated', leadershipMessage: 'very-clear' },
    controlsTechnology: { segregation: 'well-separated', accessManagement: 'very-confident', monitoring: 'regularly' },
    priorities: 'Maintain current control environment. Continue regular monitoring and training.',
    riskRegister: [
      { id: 'r3', title: 'Inventory Theft', area: 'Operations', description: 'Risk of inventory misappropriation', inherentScore: 10, residualScore: 5, priority: 'low', suggestedOwner: 'Operations Manager' }
    ],
  },
  'emp-5': {
    id: 'emp-5-assessment',
    organisation: { name: 'Acme Corp', type: 'private-sme', employeeCount: '51-100', region: 'Birmingham', activities: 'Technology and software development' },
    riskAppetite: { tolerance: 'medium', fraudSeriousness: 'very-serious', reputationImportance: 'critical' },
    fraudTriangle: { pressure: 'high', controlStrength: 'some-gaps', speakUpCulture: 'not-sure' },
    procurement: { q1: 'sometimes', q2: 'sometimes', q3: 'rarely', notes: 'Procurement controls need strengthening - manual processes with gaps' },
    cashBanking: { q1: 'usually', q2: 'sometimes', q3: 'sometimes', notes: 'Limited segregation of duties in some areas' },
    payrollHR: { q1: 'sometimes', q2: 'rarely', q3: 'usually', notes: 'Payroll reviews are inconsistent' },
    revenue: { q1: 'usually', q2: 'sometimes', q3: 'sometimes', notes: 'Revenue recognition practices need improvement' },
    itSystems: { q1: 'sometimes', q2: 'rarely', q3: 'sometimes', notes: 'IT access controls have significant gaps' },
    peopleCulture: { staffChecks: 'sometimes', whistleblowing: 'exists-not-known', leadershipMessage: 'occasionally' },
    controlsTechnology: { segregation: 'partly', accessManagement: 'some-gaps', monitoring: 'some-basic' },
    priorities: 'URGENT: Strengthen procurement controls, improve segregation of duties, enhance whistleblowing communication, implement regular monitoring.',
    riskRegister: [
      { id: 'r4', title: 'Procurement Fraud', area: 'Procurement', description: 'High risk of supplier collusion and kickbacks', inherentScore: 20, residualScore: 16, priority: 'high', suggestedOwner: 'CFO' },
      { id: 'r5', title: 'IT Access Abuse', area: 'IT Systems', description: 'Excessive system access with weak monitoring', inherentScore: 18, residualScore: 14, priority: 'high', suggestedOwner: 'CTO' },
      { id: 'r6', title: 'Payment Fraud', area: 'Finance', description: 'Weak payment authorization controls', inherentScore: 16, residualScore: 13, priority: 'high', suggestedOwner: 'Finance Manager' }
    ],
  },
};

export default function DashboardScreen() {
  const { organisation } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [lastUpdated] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [bannerCollapsed, setBannerCollapsed] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [visibleMetrics] = useState({
    keyPasses: true,
    completionRate: true,
    riskDistribution: true,
    departmentBreakdown: true,
  });
  const [alertsCount] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);

  const filteredEmployees = useMemo(() => {
    let filtered = mockEmployeeData.filter(e => {
      if (filterStatus !== 'all' && e.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && e.department !== filterDepartment) return false;
      if (filterRisk !== 'all' && e.overallRiskLevel !== filterRisk) return false;
      if (searchQuery && !e.userName.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !e.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.userName.localeCompare(b.userName);
        case 'status':
          const statusOrder = { 'not-started': 0, 'in-progress': 1, 'completed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        case 'department':
          return a.department.localeCompare(b.department);
        case 'risk':
          const riskOrder = { 'high': 0, 'medium': 1, 'low': 2, null: 3 };
          return (riskOrder[a.overallRiskLevel as keyof typeof riskOrder] || 3) - 
                 (riskOrder[b.overallRiskLevel as keyof typeof riskOrder] || 3);
        default:
          return 0;
      }
    });

    return filtered;
  }, [filterStatus, filterDepartment, filterRisk, searchQuery, sortBy]);

  const totalKeyPasses = organisation?.keyPassesAllocated || 0;
  const usedKeyPasses = organisation?.keyPassesUsed || 0;
  const remainingKeyPasses = totalKeyPasses - usedKeyPasses;

  const employeesStarted = filteredEmployees.filter(e => e.status !== 'not-started').length;
  const employeesCompleted = filteredEmployees.filter(e => e.status === 'completed').length;
  const completionRate = usedKeyPasses > 0 ? Math.round((employeesCompleted / usedKeyPasses) * 100) : 0;

  const riskDistribution = useMemo(() => {
    const completed = filteredEmployees.filter(e => e.status === 'completed');
    return {
      high: completed.filter(e => e.overallRiskLevel === 'high').length,
      medium: completed.filter(e => e.overallRiskLevel === 'medium').length,
      low: completed.filter(e => e.overallRiskLevel === 'low').length,
    };
  }, [filteredEmployees]);

  const chartData = completionByDepartment.map(d => ({
    department: d.department,
    rate: d.total > 0 ? (d.completed / d.total) * 100 : 0,
  }));

  if (!organisation || organisation.packageType !== 'with-dashboard') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.emptyState}>
            <LayoutDashboard size={64} color={colors.govGrey3} />
            <Text style={styles.emptyTitle}>Dashboard Unavailable</Text>
            <Text style={styles.emptyText}>
              The organisation dashboard is only available with the All Inclusive (FRA + Dashboard) package.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => Alert.alert('Upgrade', 'Contact support to upgrade your package')}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>Upgrade Package</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const departments = ['all', ...Array.from(new Set(mockEmployeeData.map(e => e.department)))];

  const renderOverviewTab = () => (
    <>
      {!bannerCollapsed && (
      <View style={styles.priorityBanner}>
        <View style={styles.bannerHeader}>
          <View style={styles.bannerIconContainer}>
            <AlertCircle size={24} color={colors.white} />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Action Required</Text>
            <Text style={styles.bannerSubtitle}>Main Assessment Sign-Off Pending</Text>
          </View>
        </View>
        <View style={styles.progressTracker}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotComplete]}>
              <CheckCircle size={16} color={colors.white} />
            </View>
            <Text style={styles.progressLabel}>Draft</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotComplete]}>
              <CheckCircle size={16} color={colors.white} />
            </View>
            <Text style={styles.progressLabel}>Under Review</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Clock size={16} color={colors.white} />
            </View>
            <Text style={[styles.progressLabel, styles.progressLabelActive]}>Sign-Off</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineInactive]} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot}>
              <Text style={styles.progressDotNumber}>4</Text>
            </View>
            <Text style={styles.progressLabel}>Signed</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.bannerButton}
          onPress={() => router.push('/signature')}
          activeOpacity={0.8}
        >
          <PenTool size={18} color={colors.white} />
          <Text style={styles.bannerButtonText}>Review & Sign Now</Text>
          <ArrowRight size={18} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.bannerCollapseButton}
          onPress={() => setBannerCollapsed(true)}
          activeOpacity={0.8}
        >
          <ChevronUp size={16} color={colors.white} />
          <Text style={styles.bannerCollapseText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
      )}

      {bannerCollapsed && (
        <TouchableOpacity 
          style={styles.collapsedBanner}
          onPress={() => setBannerCollapsed(false)}
          activeOpacity={0.8}
        >
          <AlertCircle size={20} color={colors.warningOrange} />
          <Text style={styles.collapsedBannerText}>Action Required: Sign-Off Pending</Text>
          <ChevronDown size={20} color={colors.warningOrange} />
        </TouchableOpacity>
      )}

      <View style={styles.lastUpdatedContainer}>
        <RefreshCw size={14} color={colors.govGrey2} />
        <Text style={styles.lastUpdatedText}>
          Last updated: {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {visibleMetrics.keyPasses && (
        <View style={styles.metricsSection}>
        <View style={styles.metricsGrid}>
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => setActiveTab('keypasses')}
            activeOpacity={0.7}
          >
            <View style={styles.metricIcon}>
              <Key size={24} color={colors.govBlue} />
            </View>
            <Text style={styles.metricValue}>{usedKeyPasses}/{totalKeyPasses}</Text>
            <Text style={styles.metricLabel}>Key-Passes Used</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => setActiveTab('employees')}
            activeOpacity={0.7}
          >
            <View style={styles.metricIcon}>
              <Users size={24} color={colors.govGreen} />
            </View>
            <Text style={styles.metricValue}>{employeesCompleted}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </TouchableOpacity>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <TrendingUp size={24} color={colors.warningOrange} />
            </View>
            <Text style={styles.metricValue}>{completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <FileText size={24} color={colors.govBlue} />
            </View>
            <Text style={styles.metricValue}>{employeesStarted}</Text>
            <Text style={styles.metricLabel}>In Progress</Text>
          </View>
        </View>
        </View>
      )}

      {visibleMetrics.departmentBreakdown && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Completion by Department</Text>
            <TouchableOpacity onPress={() => Alert.alert('Chart Info', 'Shows the percentage of completed assessments by department.')}>
              <Info size={18} color={colors.govGrey2} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartPlaceholder}>
            {chartData.map((item, index) => (
              <TouchableOpacity 
                key={item.department} 
                style={styles.barChartRow}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item.department, `${Math.round(item.rate)}% completed`)}
              >
                <Text style={styles.barChartLabel}>{item.department}</Text>
                <View style={styles.barChartBarContainer}>
                  <View style={[styles.barChartBar, { width: `${item.rate}%` }]}>
                    {item.rate > 15 && (
                      <Text style={styles.barChartInnerValue}>{Math.round(item.rate)}%</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.barChartValue}>{Math.round(item.rate)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {visibleMetrics.completionRate && (
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Completion Trend</Text>
            <TouchableOpacity onPress={() => Alert.alert('Chart Info', 'Shows how many assessments were completed over the past 4 weeks.')}>
              <Info size={18} color={colors.govGrey2} />
            </TouchableOpacity>
          </View>
          <View style={styles.lineChartWrapper}>
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>3</Text>
              <Text style={styles.yAxisLabel}>2</Text>
              <Text style={styles.yAxisLabel}>1</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>
            <View style={styles.chartWithGrid}>
              <View style={styles.gridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>
              <View style={styles.lineChartContainer}>
                {completionTrend.map((item, index) => (
                  <TouchableOpacity 
                    key={item.date} 
                    style={styles.lineChartPoint}
                    activeOpacity={0.7}
                    onPress={() => Alert.alert(item.date, `${item.completed} assessments completed`)}
                  >
                    <View style={styles.lineChartBar}>
                      <View style={[styles.lineChartBarFill, { height: `${(item.completed / 3) * 100}%` }]} />
                    </View>
                    <Text style={styles.barValueLabel}>{item.completed}</Text>
                    <Text style={styles.lineChartLabel}>{item.date}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.chartTargetLine}>
            <View style={styles.targetLineDash} />
            <Text style={styles.targetLineText}>Target: 6 assessments</Text>
          </View>
        </View>
      )}

      {visibleMetrics.riskDistribution && (
        <View style={styles.riskCard}>
          <Text style={styles.sectionTitle}>Risk Distribution</Text>
          <View style={styles.riskBars}>
            <View style={styles.riskBarRow}>
              <View style={styles.riskLabelContainer}>
                <AlertTriangle size={18} color={colors.errorRed} />
                <Text style={styles.riskLabel}>High Risk</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[styles.riskBarFill, styles.riskBarHigh, { width: `${Math.max(riskDistribution.high * 20, 5)}%` }]} />
              </View>
              <View style={styles.riskCountContainer}>
                <Text style={styles.riskCount}>{riskDistribution.high}</Text>
                <Text style={styles.riskPercentage}>({employeesCompleted > 0 ? Math.round((riskDistribution.high / employeesCompleted) * 100) : 0}%)</Text>
              </View>
            </View>
            <View style={styles.riskBarRow}>
              <View style={styles.riskLabelContainer}>
                <Zap size={18} color="#FF8C00" />
                <Text style={styles.riskLabel}>Medium Risk</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[styles.riskBarFill, styles.riskBarMedium, { width: `${Math.max(riskDistribution.medium * 20, 5)}%` }]} />
              </View>
              <View style={styles.riskCountContainer}>
                <Text style={styles.riskCount}>{riskDistribution.medium}</Text>
                <Text style={styles.riskPercentage}>({employeesCompleted > 0 ? Math.round((riskDistribution.medium / employeesCompleted) * 100) : 0}%)</Text>
              </View>
            </View>
            <View style={styles.riskBarRow}>
              <View style={styles.riskLabelContainer}>
                <CheckCircle size={16} color={colors.govGreen} />
                <Text style={styles.riskLabel}>Low Risk</Text>
              </View>
              <View style={styles.riskBarContainer}>
                <View style={[styles.riskBarFill, styles.riskBarLow, { width: `${Math.max(riskDistribution.low * 20, 5)}%` }]} />
              </View>
              <View style={styles.riskCountContainer}>
                <Text style={styles.riskCount}>{riskDistribution.low}</Text>
                <Text style={styles.riskPercentage}>({employeesCompleted > 0 ? Math.round((riskDistribution.low / employeesCompleted) * 100) : 0}%)</Text>
              </View>
            </View>
          </View>
          <Text style={styles.riskLegend}>Based on {employeesCompleted} completed assessments</Text>
        </View>
      )}
    </>
  );

  const renderEmployeesTab = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Employee Assessments</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            activeOpacity={0.7}
          >
            {viewMode === 'list' ? <Grid size={20} color={colors.govBlue} /> : <List size={20} color={colors.govBlue} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Alert.alert('Export', 'Export functionality would be implemented here')}
            activeOpacity={0.7}
          >
            <Download size={20} color={colors.govBlue} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={colors.govGrey2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={colors.govGrey2}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.govGrey2} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterChipsContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.7}
        >
          <Filter size={16} color={colors.govBlue} />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
          {filterStatus !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>
                {filterStatus === 'in-progress' ? 'In Progress' : filterStatus === 'not-started' ? 'Not Started' : 'Completed'}
              </Text>
              <TouchableOpacity onPress={() => setFilterStatus('all')}>
                <X size={14} color={colors.govBlue} />
              </TouchableOpacity>
            </View>
          )}
          {filterDepartment !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>{filterDepartment}</Text>
              <TouchableOpacity onPress={() => setFilterDepartment('all')}>
                <X size={14} color={colors.govBlue} />
              </TouchableOpacity>
            </View>
          )}
          {filterRisk !== 'all' && (
            <View style={styles.activeFilterChip}>
              <Text style={styles.activeFilterChipText}>{filterRisk} risk</Text>
              <TouchableOpacity onPress={() => setFilterRisk('all')}>
                <X size={14} color={colors.govBlue} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['name', 'status', 'risk', 'department'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
              onPress={() => setSortBy(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredEmployees.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Users size={48} color={colors.govGrey3} />
          <Text style={styles.emptyStateTitle}>No Employees Found</Text>
          <Text style={styles.emptyStateText}>
            {searchQuery ? 'Try adjusting your search or filters' : 'No employees match the current filters'}
          </Text>
          {(searchQuery || filterStatus !== 'all' || filterDepartment !== 'all' || filterRisk !== 'all') && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setFilterDepartment('all');
                setFilterRisk('all');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFiltersButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={viewMode === 'grid' ? styles.employeeGrid : undefined}>
      {filteredEmployees.map((employee) => {
        const hasDetails = employee.status === 'completed' && mockAssessmentDetails[employee.userId];
        return (
        <TouchableOpacity
          key={employee.userId}
          style={[styles.employeeCard, viewMode === 'grid' && styles.employeeCardGrid, hasDetails && styles.employeeCardClickable]}
          onPress={() => {
            if (hasDetails) {
              setSelectedEmployee(employee.userId);
              setShowAssessmentDetails(true);
            } else {
              Alert.alert(
                employee.userName,
                `Department: ${employee.department}\nStatus: ${employee.status}\nEmail: ${employee.email}${employee.completedAt ? `\nCompleted: ${new Date(employee.completedAt).toLocaleDateString('en-GB')}` : ''}${employee.overallRiskLevel ? `\nRisk Level: ${employee.overallRiskLevel}` : ''}`,
                [{ text: 'Close' }]
              );
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{employee.userName}</Text>
            <Text style={styles.employeeEmail}>{employee.email}</Text>
            <Text style={styles.employeeDepartment}>{employee.department}</Text>
          </View>

          <View style={styles.employeeStatus}>
            <View style={[
              styles.statusBadge,
              employee.status === 'completed' && styles.statusCompleted,
              employee.status === 'in-progress' && styles.statusInProgress,
              employee.status === 'not-started' && styles.statusNotStarted,
            ]}>
              <Text style={styles.statusText}>
                {employee.status === 'completed' ? 'Completed' :
                 employee.status === 'in-progress' ? 'In Progress' : 'Not Started'}
              </Text>
            </View>

            {employee.status === 'completed' && employee.overallRiskLevel && (
              <View style={[
                styles.riskBadge,
                employee.overallRiskLevel === 'high' && styles.riskHigh,
                employee.overallRiskLevel === 'medium' && styles.riskMedium,
                employee.overallRiskLevel === 'low' && styles.riskLow,
              ]}>
                <Text style={styles.riskText}>
                  {employee.overallRiskLevel.charAt(0).toUpperCase() + employee.overallRiskLevel.slice(1)}
                </Text>
              </View>
            )}

            {hasDetails && (
              <View style={styles.viewDetailsButton}>
                <Eye size={16} color={colors.govBlue} />
                <Text style={styles.viewDetailsText}>View Details</Text>
              </View>
            )}
            {!hasDetails && viewMode === 'list' && (
              <ChevronRight size={20} color={colors.govGrey2} />
            )}
          </View>
        </TouchableOpacity>
        );
      })}
        </View>
      )}
    </View>
  );

  const renderKeyPassesTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key-Pass Management</Text>
      
      <View style={styles.keyPassCard}>
        <Text style={styles.cardTitle}>Usage Overview</Text>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(usedKeyPasses / totalKeyPasses) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{usedKeyPasses} of {totalKeyPasses} used</Text>
        </View>
        <Text style={styles.progressSubtext}>{remainingKeyPasses} access passes remaining</Text>
      </View>

      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Key-Passes', `You have ${remainingKeyPasses} key-passes available to distribute to employees`)}
          activeOpacity={0.7}
        >
          <Key size={20} color={colors.govBlue} />
          <Text style={styles.actionButtonText}>Generate Invite Link</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => Alert.alert('Key-Pass Codes', 'List of available key-pass codes would be shown here')}
          activeOpacity={0.7}
        >
          <FileText size={20} color={colors.govBlue} />
          <Text style={styles.actionButtonText}>View Key-Pass Codes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSignOffTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sign-Off & Approvals</Text>
      
      <View style={styles.infoBoxWithIcon}>
        <Info size={20} color={colors.govBlue} />
        <Text style={styles.infoText}>
          This section displays signature status for your main organisational FRA assessment.
        </Text>
      </View>

      <View style={styles.signOffCardEnhanced}>
        <View style={styles.signOffHeader}>
          <View style={styles.signOffIconWrapper}>
            <FileText size={32} color={colors.govBlue} />
          </View>
          <View style={styles.signOffHeaderText}>
            <Text style={styles.signOffCardTitle}>Main Organisational FRA</Text>
            <Text style={styles.signOffAssessmentId}>Assessment ID: FRA-2024-001</Text>
          </View>
        </View>

        <View style={styles.signOffProgressWrapper}>
          <Text style={styles.signOffProgressTitle}>Completion Progress</Text>
          <View style={styles.signOffProgressBar}>
            <View style={[styles.signOffProgressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.signOffProgressText}>3 of 4 steps complete</Text>
        </View>

        <View style={styles.statusBadgeContainer}>
          <View style={[styles.statusBadgeLarge, styles.statusPending]}>
            <Clock size={16} color={colors.white} />
            <Text style={styles.statusBadgeText}>Pending Sign-Off</Text>
          </View>
        </View>

        <View style={styles.signOffMetaInfo}>
          <View style={styles.signOffMetaRow}>
            <Text style={styles.signOffMetaLabel}>Created:</Text>
            <Text style={styles.signOffMetaValue}>{new Date().toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={styles.signOffMetaRow}>
            <Text style={styles.signOffMetaLabel}>Package:</Text>
            <Text style={styles.signOffMetaValue}>All Inclusive (with Dashboard)</Text>
          </View>
          <View style={styles.signOffMetaRow}>
            <Text style={styles.signOffMetaLabel}>Awaiting Signature From:</Text>
            <Text style={[styles.signOffMetaValue, { fontWeight: '600' as const }]}>{organisation.name}</Text>
          </View>
        </View>

        <View style={styles.signOffHelpBox}>
          <HelpCircle size={16} color={colors.govBlue} />
          <Text style={styles.signOffHelpText}>
            Your signature confirms that you&apos;ve reviewed and approved the Fraud Risk Assessment for your organisation.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.signOffButtonPrimary}
          onPress={() => router.push('/signature')}
          activeOpacity={0.8}
        >
          <PenTool size={20} color={colors.white} />
          <Text style={styles.signOffButtonTextPrimary}>Review & Sign Assessment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.orgIconContainer}>
              <LayoutDashboard size={28} color={colors.govBlue} />
            </View>
            <View>
              <Text style={styles.title}>{organisation.name}</Text>
              <Text style={styles.subtitle}>Organisation Dashboard</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowHelp(true)}
              activeOpacity={0.7}
            >
              <HelpCircle size={24} color={colors.govBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButtonBadge}
              onPress={() => {
                Alert.alert(
                  'Pending Actions',
                  `You have ${alertsCount} pending action:\n\n• Main Assessment Sign-Off: Requires your signature`,
                  [
                    { text: 'View Later' },
                    { text: 'Sign Now', onPress: () => router.push('/signature') }
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <Bell size={24} color={colors.govBlue} />
              {alertsCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{alertsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.7}
          >
            <LayoutDashboard size={18} color={activeTab === 'overview' ? colors.govBlue : colors.govGrey2} />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'employees' && styles.tabActive]}
            onPress={() => setActiveTab('employees')}
            activeOpacity={0.7}
          >
            <Users size={18} color={activeTab === 'employees' ? colors.govBlue : colors.govGrey2} />
            <Text style={[styles.tabText, activeTab === 'employees' && styles.tabTextActive]}>Employees</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'keypasses' && styles.tabActive]}
            onPress={() => setActiveTab('keypasses')}
            activeOpacity={0.7}
          >
            <Key size={18} color={activeTab === 'keypasses' ? colors.govBlue : colors.govGrey2} />
            <Text style={[styles.tabText, activeTab === 'keypasses' && styles.tabTextActive]}>Key-Passes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'signoff' && styles.tabActive]}
            onPress={() => setActiveTab('signoff')}
            activeOpacity={0.7}
          >
            <FileText size={18} color={activeTab === 'signoff' ? colors.govBlue : colors.govGrey2} />
            <Text style={[styles.tabText, activeTab === 'signoff' && styles.tabTextActive]}>Sign-Off</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'employees' && renderEmployeesTab()}
        {activeTab === 'keypasses' && renderKeyPassesTab()}
        {activeTab === 'signoff' && renderSignOffTab()}
      </ScrollView>

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.govGrey1} />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.filterOptions}>
              {(['all', 'completed', 'in-progress', 'not-started'] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[styles.filterOption, filterStatus === status && styles.filterOptionActive]}
                  onPress={() => setFilterStatus(status)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, filterStatus === status && styles.filterOptionTextActive]}>
                    {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status === 'not-started' ? 'Not Started' : 'Completed'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Department</Text>
            <View style={styles.filterOptions}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[styles.filterOption, filterDepartment === dept && styles.filterOptionActive]}
                  onPress={() => setFilterDepartment(dept)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, filterDepartment === dept && styles.filterOptionTextActive]}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterSectionTitle}>Risk Level</Text>
            <View style={styles.filterOptions}>
              {['all', 'high', 'medium', 'low'].map((risk) => (
                <TouchableOpacity
                  key={risk}
                  style={[styles.filterOption, filterRisk === risk && styles.filterOptionActive]}
                  onPress={() => setFilterRisk(risk)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterOptionText, filterRisk === risk && styles.filterOptionTextActive]}>
                    {risk === 'all' ? 'All Risks' : `${risk.charAt(0).toUpperCase() + risk.slice(1)} Risk`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAssessmentDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAssessmentDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.assessmentModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assessment Details</Text>
              <TouchableOpacity onPress={() => setShowAssessmentDetails(false)}>
                <X size={24} color={colors.govGrey1} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && mockAssessmentDetails[selectedEmployee] ? (
              <ScrollView style={styles.assessmentDetailsScroll} showsVerticalScrollIndicator={true}>
                {(() => {
                  const employee = mockEmployeeData.find(e => e.userId === selectedEmployee);
                  const assessment = mockAssessmentDetails[selectedEmployee];
                  
                  if (!employee || !assessment) return (
                    <View style={styles.emptyStateContainer}>
                      <AlertCircle size={48} color={colors.govGrey3} />
                      <Text style={styles.emptyStateTitle}>No Data Available</Text>
                      <Text style={styles.emptyStateText}>Assessment details could not be loaded.</Text>
                    </View>
                  );

                  const formatLabel = (key: string): string => {
                    return key.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                  };

                  return (
                    <>
                      <View style={styles.detailHeader}>
                        <View style={styles.detailHeaderIcon}>
                          <FileText size={32} color={colors.govBlue} />
                        </View>
                        <View style={styles.detailHeaderText}>
                          <Text style={styles.detailEmployeeName}>{employee.userName}</Text>
                          <Text style={styles.detailEmployeeEmail}>{employee.email}</Text>
                          <Text style={styles.detailEmployeeDept}>{employee.department}</Text>
                        </View>
                      </View>

                      <View style={styles.completionInfoBanner}>
                        <CheckCircle size={20} color={colors.govGreen} />
                        <View style={styles.completionInfoText}>
                          <Text style={styles.completionInfoTitle}>Assessment Completed</Text>
                          <Text style={styles.completionInfoSubtitle}>All sections have been answered and reviewed</Text>
                        </View>
                      </View>

                      <View style={styles.detailSummaryBadges}>
                        <View style={[styles.statusBadge, styles.statusCompleted]}>
                          <Text style={styles.statusText}>Completed</Text>
                        </View>
                        {employee.overallRiskLevel && (
                          <View style={[
                            styles.riskBadge,
                            employee.overallRiskLevel === 'high' && styles.riskHigh,
                            employee.overallRiskLevel === 'medium' && styles.riskMedium,
                            employee.overallRiskLevel === 'low' && styles.riskLow,
                          ]}>
                            <Text style={styles.riskText}>
                              {employee.overallRiskLevel.charAt(0).toUpperCase() + employee.overallRiskLevel.slice(1)} Risk
                            </Text>
                          </View>
                        )}
                      </View>

                      {employee.completedAt && (
                        <View style={styles.detailMetaInfo}>
                          <Text style={styles.detailMetaLabel}>Completed on:</Text>
                          <Text style={styles.detailMetaValue}>
                            {new Date(employee.completedAt).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </Text>
                        </View>
                      )}

                      {assessment.riskRegister && assessment.riskRegister.length > 0 && (
                        <View style={styles.detailSummaryCards}>
                          <View style={styles.summaryCard}>
                            <Text style={styles.summaryCardValue}>{assessment.riskRegister.length}</Text>
                            <Text style={styles.summaryCardLabel}>Risks Identified</Text>
                          </View>
                          <View style={styles.summaryCard}>
                            <Text style={styles.summaryCardValue}>
                              {assessment.riskRegister.filter(r => r.priority === 'high').length}
                            </Text>
                            <Text style={styles.summaryCardLabel}>High Priority</Text>
                          </View>
                          <View style={styles.summaryCard}>
                            <Text style={styles.summaryCardValue}>
                              {assessment.riskRegister.filter(r => r.priority === 'medium').length}
                            </Text>
                            <Text style={styles.summaryCardLabel}>Medium Priority</Text>
                          </View>
                        </View>
                      )}

                      {assessment.organisation && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Organisation Information</Text>
                          <View style={styles.detailCard}>
                            {assessment.organisation.name && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Organisation Name:</Text>
                                <Text style={styles.detailValue}>{assessment.organisation.name}</Text>
                              </View>
                            )}
                            {assessment.organisation.type && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Type:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.organisation.type)}</Text>
                              </View>
                            )}
                            {assessment.organisation.employeeCount && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Employee Count:</Text>
                                <Text style={styles.detailValue}>{assessment.organisation.employeeCount}</Text>
                              </View>
                            )}
                            {assessment.organisation.region && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Region:</Text>
                                <Text style={styles.detailValue}>{assessment.organisation.region}</Text>
                              </View>
                            )}
                            {assessment.organisation.activities && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Activities:</Text>
                                <Text style={styles.detailValue}>{assessment.organisation.activities}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.riskAppetite && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Risk Appetite</Text>
                          <View style={styles.detailCard}>
                            {assessment.riskAppetite.tolerance && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Tolerance:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.riskAppetite.tolerance)}</Text>
                              </View>
                            )}
                            {assessment.riskAppetite.fraudSeriousness && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Fraud Seriousness:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.riskAppetite.fraudSeriousness)}</Text>
                              </View>
                            )}
                            {assessment.riskAppetite.reputationImportance && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reputation Importance:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.riskAppetite.reputationImportance)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.fraudTriangle && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Fraud Triangle Assessment</Text>
                          <View style={styles.detailCard}>
                            {assessment.fraudTriangle.pressure && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Pressure Level:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.fraudTriangle.pressure)}</Text>
                              </View>
                            )}
                            {assessment.fraudTriangle.controlStrength && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Control Strength:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.fraudTriangle.controlStrength)}</Text>
                              </View>
                            )}
                            {assessment.fraudTriangle.speakUpCulture && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Speak-Up Culture:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.fraudTriangle.speakUpCulture)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.procurement && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Procurement Controls</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How often is segregation of duties maintained in procurement?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.procurement.q1 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How frequently are suppliers verified before onboarding?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.procurement.q2 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>Are purchase orders properly authorized?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.procurement.q3 || 'Not answered')}</Text>
                              </View>
                            </View>
                            {assessment.procurement.notes && (
                              <View style={styles.notesBlock}>
                                <Text style={styles.notesBlockTitle}>Additional Notes:</Text>
                                <Text style={styles.notesBlockText}>{assessment.procurement.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.cashBanking && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Cash & Banking Controls</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How often are transaction controls applied?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.cashBanking.q1 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How frequently are bank reconciliations performed?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.cashBanking.q2 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>Is dual authorization required for payments?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.cashBanking.q3 || 'Not answered')}</Text>
                              </View>
                            </View>
                            {assessment.cashBanking.notes && (
                              <View style={styles.notesBlock}>
                                <Text style={styles.notesBlockTitle}>Additional Notes:</Text>
                                <Text style={styles.notesBlockText}>{assessment.cashBanking.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.payrollHR && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Payroll & HR Controls</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How often are payroll reports reviewed?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.payrollHR.q1 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How frequently are employees verified in the payroll system?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.payrollHR.q2 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>Are payroll changes properly authorized?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.payrollHR.q3 || 'Not answered')}</Text>
                              </View>
                            </View>
                            {assessment.payrollHR.notes && (
                              <View style={styles.notesBlock}>
                                <Text style={styles.notesBlockTitle}>Additional Notes:</Text>
                                <Text style={styles.notesBlockText}>{assessment.payrollHR.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.revenue && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Revenue Controls</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How consistently is revenue recognition policy applied?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.revenue.q1 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How often are invoices properly managed and tracked?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.revenue.q2 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>Are credit notes and refunds properly controlled?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.revenue.q3 || 'Not answered')}</Text>
                              </View>
                            </View>
                            {assessment.revenue.notes && (
                              <View style={styles.notesBlock}>
                                <Text style={styles.notesBlockTitle}>Additional Notes:</Text>
                                <Text style={styles.notesBlockText}>{assessment.revenue.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.itSystems && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>IT Systems & Security</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How often are IT access controls reviewed and updated?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.itSystems.q1 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>How frequently are security measures tested?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.itSystems.q2 || 'Not answered')}</Text>
                              </View>
                            </View>
                            <View style={styles.questionBlock}>
                              <Text style={styles.questionText}>Are data protection measures adequately maintained?</Text>
                              <View style={styles.answerContainer}>
                                <CheckCircle size={16} color={colors.govGreen} />
                                <Text style={styles.answerText}>{formatLabel(assessment.itSystems.q3 || 'Not answered')}</Text>
                              </View>
                            </View>
                            {assessment.itSystems.notes && (
                              <View style={styles.notesBlock}>
                                <Text style={styles.notesBlockTitle}>Additional Notes:</Text>
                                <Text style={styles.notesBlockText}>{assessment.itSystems.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.peopleCulture && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>People & Culture</Text>
                          <View style={styles.detailCard}>
                            {assessment.peopleCulture.staffChecks && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Staff Background Checks:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.peopleCulture.staffChecks)}</Text>
                              </View>
                            )}
                            {assessment.peopleCulture.whistleblowing && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Whistleblowing:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.peopleCulture.whistleblowing)}</Text>
                              </View>
                            )}
                            {assessment.peopleCulture.leadershipMessage && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Leadership Message:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.peopleCulture.leadershipMessage)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.controlsTechnology && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Controls & Technology</Text>
                          <View style={styles.detailCard}>
                            {assessment.controlsTechnology.segregation && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Segregation of Duties:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.controlsTechnology.segregation)}</Text>
                              </View>
                            )}
                            {assessment.controlsTechnology.accessManagement && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Access Management:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.controlsTechnology.accessManagement)}</Text>
                              </View>
                            )}
                            {assessment.controlsTechnology.monitoring && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Monitoring:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.controlsTechnology.monitoring)}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.priorities && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Priorities & Recommendations</Text>
                          <View style={styles.detailCard}>
                            <Text style={styles.detailPriorities}>{assessment.priorities}</Text>
                          </View>
                        </View>
                      )}

                      {assessment.riskRegister && assessment.riskRegister.length > 0 && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Risk Register ({assessment.riskRegister.length} items)</Text>
                          {assessment.riskRegister.map((risk) => (
                            <View key={risk.id} style={styles.riskRegisterCard}>
                              <View style={styles.riskRegisterHeader}>
                                <Text style={styles.riskRegisterTitle}>{risk.title}</Text>
                                <View style={[
                                  styles.riskBadge,
                                  risk.priority === 'high' && styles.riskHigh,
                                  risk.priority === 'medium' && styles.riskMedium,
                                  risk.priority === 'low' && styles.riskLow,
                                ]}>
                                  <Text style={styles.riskText}>{risk.priority.toUpperCase()}</Text>
                                </View>
                              </View>
                              <Text style={styles.riskRegisterArea}>{risk.area}</Text>
                              <Text style={styles.riskRegisterDescription}>{risk.description}</Text>
                              <View style={styles.riskScores}>
                                <View style={styles.riskScoreItem}>
                                  <Text style={styles.riskScoreLabel}>Inherent:</Text>
                                  <Text style={styles.riskScoreValue}>{risk.inherentScore}/25</Text>
                                </View>
                                <View style={styles.riskScoreItem}>
                                  <Text style={styles.riskScoreLabel}>Residual:</Text>
                                  <Text style={styles.riskScoreValue}>{risk.residualScore}/25</Text>
                                </View>
                              </View>
                              <View style={styles.riskOwner}>
                                <Text style={styles.riskOwnerLabel}>Owner:</Text>
                                <Text style={styles.riskOwnerValue}>{risk.suggestedOwner}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {assessment.paymentsModule && assessment.paymentsModule.risks && assessment.paymentsModule.risks.length > 0 && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Payments Module - Risk Assessment</Text>
                          {assessment.paymentsModule.risks.map((risk) => (
                            <View key={risk.id} style={styles.detailCard}>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Risk Area:</Text>
                                <Text style={styles.detailValue}>{formatLabel(risk.area)}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Title:</Text>
                                <Text style={styles.detailValue}>{risk.title}</Text>
                              </View>
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>Description:</Text>
                                <Text style={styles.detailNotesValue}>{risk.description}</Text>
                              </View>
                              <View style={styles.riskScores}>
                                <View style={styles.riskScoreItem}>
                                  <Text style={styles.riskScoreLabel}>Inherent:</Text>
                                  <Text style={styles.riskScoreValue}>{risk.inherentScore}</Text>
                                </View>
                                <View style={styles.riskScoreItem}>
                                  <Text style={styles.riskScoreLabel}>Residual:</Text>
                                  <Text style={styles.riskScoreValue}>{risk.residualScore}</Text>
                                </View>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Control Effectiveness:</Text>
                                <Text style={styles.detailValue}>{formatLabel(risk.controlEffectiveness)}</Text>
                              </View>
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Owner:</Text>
                                <Text style={styles.detailValue}>{risk.owner}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {assessment.trainingAwareness && (assessment.trainingAwareness.mandatoryTraining?.length > 0 || assessment.trainingAwareness.specialistTraining?.length > 0) && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Training & Awareness</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Overall Completion Rate:</Text>
                              <Text style={styles.detailValue}>{assessment.trainingAwareness.overallCompletionRate}%</Text>
                            </View>
                            {assessment.trainingAwareness.mandatoryTraining?.length > 0 && (
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>Mandatory Training Programs:</Text>
                                <Text style={styles.detailNotesValue}>
                                  {assessment.trainingAwareness.mandatoryTraining.map(t => `• ${t.trainingType} (${t.completionRate}%)`).join('\n')}
                                </Text>
                              </View>
                            )}
                            {assessment.trainingAwareness.notes && (
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>Notes:</Text>
                                <Text style={styles.detailNotesValue}>{assessment.trainingAwareness.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.monitoringEvaluation && assessment.monitoringEvaluation.kpis?.length > 0 && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Monitoring & Evaluation</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Review Frequency:</Text>
                              <Text style={styles.detailValue}>{formatLabel(assessment.monitoringEvaluation.reviewFrequency)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Responsible Person:</Text>
                              <Text style={styles.detailValue}>{assessment.monitoringEvaluation.responsiblePerson || 'Not assigned'}</Text>
                            </View>
                            {assessment.monitoringEvaluation.lastReviewDate && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Last Review:</Text>
                                <Text style={styles.detailValue}>{new Date(assessment.monitoringEvaluation.lastReviewDate).toLocaleDateString('en-GB')}</Text>
                              </View>
                            )}
                            {assessment.monitoringEvaluation.kpis.length > 0 && (
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>Key Performance Indicators:</Text>
                                <Text style={styles.detailNotesValue}>
                                  {assessment.monitoringEvaluation.kpis.map(kpi => `• ${kpi.name}: ${kpi.current}/${kpi.target} ${kpi.unit} (${kpi.status})`).join('\n')}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.complianceMapping && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Compliance Mapping</Text>
                          <View style={styles.detailCard}>
                            {assessment.complianceMapping.govS013 && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>GovS-013 Status:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.complianceMapping.govS013.status)}</Text>
                              </View>
                            )}
                            {assessment.complianceMapping.fraudPreventionStandard && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Fraud Prevention Standard:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.complianceMapping.fraudPreventionStandard.status)}</Text>
                              </View>
                            )}
                            {assessment.complianceMapping.eccta2023 && (
                              <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>ECCTA 2023:</Text>
                                <Text style={styles.detailValue}>{formatLabel(assessment.complianceMapping.eccta2023.status)}</Text>
                              </View>
                            )}
                            {assessment.complianceMapping.notes && (
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>Notes:</Text>
                                <Text style={styles.detailNotesValue}>{assessment.complianceMapping.notes}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.fraudResponsePlan && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Fraud Response Plan</Text>
                          <View style={styles.detailCard}>
                            <Text style={[styles.detailLabel, { marginBottom: 8, fontWeight: '700' as const }]}>Reporting Timelines</Text>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Log Incident:</Text>
                              <Text style={styles.detailValue}>&lt; {assessment.fraudResponsePlan.reportingTimelines.logIncident} hours</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Initial Assessment:</Text>
                              <Text style={styles.detailValue}>&lt; {assessment.fraudResponsePlan.reportingTimelines.initialAssessment} hours</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Investigation Start:</Text>
                              <Text style={styles.detailValue}>&lt; {assessment.fraudResponsePlan.reportingTimelines.investigationStart} hours</Text>
                            </View>
                            <Text style={[styles.detailLabel, { marginTop: 12, marginBottom: 8, fontWeight: '700' as const }]}>Investigation Lifecycle (Days)</Text>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Triage:</Text>
                              <Text style={styles.detailValue}>{assessment.fraudResponsePlan.investigationLifecycle.triage} days</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Investigation:</Text>
                              <Text style={styles.detailValue}>{assessment.fraudResponsePlan.investigationLifecycle.investigation} days</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Findings:</Text>
                              <Text style={styles.detailValue}>{assessment.fraudResponsePlan.investigationLifecycle.findings} days</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Closure:</Text>
                              <Text style={styles.detailValue}>{assessment.fraudResponsePlan.investigationLifecycle.closure} days</Text>
                            </View>
                            {assessment.fraudResponsePlan.externalReporting && (
                              <View style={styles.detailNotesRow}>
                                <Text style={styles.detailLabel}>External Reporting:</Text>
                                <Text style={styles.detailNotesValue}>{assessment.fraudResponsePlan.externalReporting}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}

                      {assessment.actionPlan && (assessment.actionPlan.highPriority?.length > 0 || assessment.actionPlan.mediumPriority?.length > 0 || assessment.actionPlan.lowPriority?.length > 0) && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Action Plan</Text>
                          {assessment.actionPlan.highPriority?.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                              <Text style={[styles.detailLabel, { marginBottom: 8, fontWeight: '700' as const, color: colors.errorRed }]}>High Priority Actions</Text>
                              {assessment.actionPlan.highPriority.map((action) => (
                                <View key={action.id} style={[styles.detailCard, { marginBottom: 8 }]}>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Title:</Text>
                                    <Text style={styles.detailValue}>{action.title}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Timeline:</Text>
                                    <Text style={styles.detailValue}>{action.timeline}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Owner:</Text>
                                    <Text style={styles.detailValue}>{action.owner}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Status:</Text>
                                    <Text style={styles.detailValue}>{formatLabel(action.status)}</Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                          {assessment.actionPlan.mediumPriority?.length > 0 && (
                            <View style={{ marginBottom: 16 }}>
                              <Text style={[styles.detailLabel, { marginBottom: 8, fontWeight: '700' as const, color: '#FF8C00' }]}>Medium Priority Actions</Text>
                              {assessment.actionPlan.mediumPriority.map((action) => (
                                <View key={action.id} style={[styles.detailCard, { marginBottom: 8 }]}>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Title:</Text>
                                    <Text style={styles.detailValue}>{action.title}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Timeline:</Text>
                                    <Text style={styles.detailValue}>{action.timeline}</Text>
                                  </View>
                                  <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Owner:</Text>
                                    <Text style={styles.detailValue}>{action.owner}</Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}

                      {assessment.documentControl && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailSectionTitle}>Document Control</Text>
                          <View style={styles.detailCard}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Version:</Text>
                              <Text style={styles.detailValue}>{assessment.documentControl.version}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Last Updated:</Text>
                              <Text style={styles.detailValue}>{new Date(assessment.documentControl.lastUpdated).toLocaleDateString('en-GB')}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Classification:</Text>
                              <Text style={styles.detailValue}>{assessment.documentControl.classification}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Retention Period:</Text>
                              <Text style={styles.detailValue}>{assessment.documentControl.retentionPeriod}</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      <View style={styles.detailFooter}>
                        <TouchableOpacity
                          style={styles.exportDetailButton}
                          onPress={() => Alert.alert('Export', 'Assessment details would be exported as PDF')}
                          activeOpacity={0.8}
                        >
                          <Download size={18} color={colors.govBlue} />
                          <Text style={styles.exportDetailButtonText}>Export as PDF</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.closeDetailButton}
                          onPress={() => setShowAssessmentDetails(false)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.closeDetailButtonText}>Close</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  );
                })()}
              </ScrollView>
            ) : (
              <View style={styles.emptyStateContainer}>
                <AlertCircle size={48} color={colors.govGrey3} />
                <Text style={styles.emptyStateTitle}>No Assessment Data</Text>
                <Text style={styles.emptyStateText}>
                  This employee has not completed their assessment yet or data is not available.
                </Text>
                <TouchableOpacity
                  style={styles.closeDetailButton}
                  onPress={() => setShowAssessmentDetails(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeDetailButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>How to Read This Dashboard</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <X size={24} color={colors.govGrey1} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpContent}>
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Overview Tab</Text>
                <Text style={styles.helpText}>View key metrics, completion rates by department, and risk distribution across all completed assessments.</Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Employees Tab</Text>
                <Text style={styles.helpText}>See all employees who have used key-passes. Tap any employee to view their detailed assessment status and results.</Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Key-Passes Tab</Text>
                <Text style={styles.helpText}>Manage your employee access codes. Generate new invite links and view remaining key-passes.</Text>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Risk Levels</Text>
                <View style={styles.helpRiskRow}>
                  <View style={[styles.helpRiskBadge, { backgroundColor: colors.errorRed }]} />
                  <AlertTriangle size={16} color={colors.errorRed} style={{ marginLeft: -4 }} />
                  <Text style={styles.helpText}>High Risk (15-25): Immediate action required</Text>
                </View>
                <View style={styles.helpRiskRow}>
                  <View style={[styles.helpRiskBadge, { backgroundColor: '#FF8C00' }]} />
                  <Zap size={16} color="#FF8C00" style={{ marginLeft: -4 }} />
                  <Text style={styles.helpText}>Medium Risk (8-14): Plan mitigation within 3-6 months</Text>
                </View>
                <View style={styles.helpRiskRow}>
                  <View style={[styles.helpRiskBadge, { backgroundColor: colors.govGreen }]} />
                  <CheckCircle size={16} color={colors.govGreen} style={{ marginLeft: -4 }} />
                  <Text style={styles.helpText}>Low Risk (1-7): Monitor and review annually</Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Data Updates</Text>
                <Text style={styles.helpText}>Dashboard metrics refresh automatically when employees complete assessments. Check the &ldquo;Last updated&rdquo; timestamp at the top.</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orgIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 4,
    letterSpacing: -0.28,
    lineHeight: 36.4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.govGrey2,
    lineHeight: 21,
  },
  metricsSection: {
    marginBottom: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 44,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.govGrey2,
    textAlign: 'center' as const,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
    letterSpacing: -0.16,
    lineHeight: 20.8,
  },
  lastUpdatedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  iconButtonBadge: {
    padding: 4,
    position: 'relative' as const,
  },
  notificationBadge: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    backgroundColor: colors.errorRed,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.govGrey4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.govBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: '#6C757D',
    letterSpacing: -0.13,
  },
  tabTextActive: {
    color: colors.govBlue,
    fontWeight: '600' as const,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  riskBars: {
    gap: 12,
  },
  riskBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  riskLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    width: 80,
  },
  riskBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.govGrey4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  riskBarHigh: {
    backgroundColor: colors.errorRed,
  },
  riskBarMedium: {
    backgroundColor: '#FF8C00',
  },
  riskBarLow: {
    backgroundColor: colors.govGreen,
  },
  riskCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    width: 30,
    textAlign: 'right' as const,
  },
  riskLegend: {
    fontSize: 12,
    color: colors.govGrey2,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.lightBlue,
    borderRadius: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  employeeDepartment: {
    fontSize: 12,
    color: colors.govGrey2,
    marginTop: 2,
  },
  keyPassCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  signOffCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  signOffStatus: {
    fontSize: 14,
    color: colors.warningOrange,
    marginBottom: 16,
  },
  signOffButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOffButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.govGrey1,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.govGrey4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.govGrey3,
  },
  filterOptionActive: {
    backgroundColor: colors.lightBlue,
    borderColor: colors.govBlue,
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey2,
  },
  filterOptionTextActive: {
    color: colors.govBlue,
  },
  applyButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  helpContent: {
    maxHeight: 500,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.govGrey2,
    lineHeight: 21,
  },
  helpRiskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  helpRiskBadge: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  chartPlaceholder: {
    paddingVertical: 10,
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  barChartLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    width: 80,
  },
  barChartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: colors.govGrey4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barChartBar: {
    height: '100%',
    backgroundColor: colors.govBlue,
    borderRadius: 4,
  },
  barChartValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    width: 40,
    textAlign: 'right' as const,
  },
  lineChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
    paddingVertical: 20,
  },
  lineChartPoint: {
    alignItems: 'center',
    flex: 1,
  },
  lineChartBar: {
    width: 40,
    height: 120,
    backgroundColor: colors.govGrey4,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  lineChartBarFill: {
    width: '100%',
    backgroundColor: colors.govBlue,
    borderRadius: 4,
  },
  lineChartLabel: {
    fontSize: 11,
    color: colors.govGrey2,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: colors.govGrey4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.govBlue,
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  progressSubtext: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 16,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  employeeCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 44,
  },
  employeeCardGrid: {
    flex: 1,
    minWidth: '45%',
  },
  employeeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  employeeInfo: {
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  employeeStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#28A745',
  },
  statusInProgress: {
    backgroundColor: '#0066CC',
  },
  statusNotStarted: {
    backgroundColor: '#6C757D',
  },
  statusPendingAction: {
    backgroundColor: '#FFA500',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.white,
  },
  employeeDate: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskHigh: {
    backgroundColor: colors.errorRed,
  },
  riskMedium: {
    backgroundColor: '#FF8C00',
  },
  riskLow: {
    backgroundColor: colors.govGreen,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.white,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.lightBlue,
    borderRadius: 6,
    marginTop: 10,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  infoBox: {
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
  },
  infoBoxWithIcon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.govGrey1,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.govGrey2,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  priorityBanner: {
    backgroundColor: colors.warningOrange,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.white,
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  progressTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressDotComplete: {
    backgroundColor: colors.govGreen,
  },
  progressDotActive: {
    backgroundColor: colors.govBlue,
  },
  progressDotNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: colors.white,
  },
  progressLabel: {
    fontSize: 10,
    color: colors.white,
    textAlign: 'center' as const,
    opacity: 0.8,
  },
  progressLabelActive: {
    fontWeight: '700' as const,
    opacity: 1,
  },
  progressLine: {
    height: 2,
    flex: 1,
    backgroundColor: colors.govGreen,
    marginHorizontal: -8,
  },
  progressLineInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  bannerButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.warningOrange,
  },
  signOffCardEnhanced: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signOffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.govGrey4,
  },
  signOffIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  signOffHeaderText: {
    flex: 1,
  },
  signOffCardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  signOffAssessmentId: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  signOffProgressWrapper: {
    marginBottom: 20,
  },
  signOffProgressTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 8,
  },
  signOffProgressBar: {
    height: 8,
    backgroundColor: colors.govGrey4,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  signOffProgressFill: {
    height: '100%',
    backgroundColor: colors.govBlue,
    borderRadius: 4,
  },
  signOffProgressText: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  statusBadgeContainer: {
    marginBottom: 20,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start' as const,
  },
  statusPending: {
    backgroundColor: colors.warningOrange,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  signOffMetaInfo: {
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  signOffMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signOffMetaLabel: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  signOffMetaValue: {
    fontSize: 13,
    color: colors.govGrey1,
    textAlign: 'right' as const,
  },
  signOffHelpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.lightBlue,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  signOffHelpText: {
    flex: 1,
    fontSize: 12,
    color: colors.govGrey1,
    lineHeight: 18,
  },
  signOffButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.govBlue,
    borderRadius: 8,
    paddingVertical: 16,
    gap: 10,
    shadowColor: colors.govBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOffButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  collapsedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warningOrange,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  collapsedBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  bannerCollapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  bannerCollapseText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.white,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.govGrey3,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.govGrey1,
    padding: 0,
    lineHeight: 20,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  filterChips: {
    flexGrow: 0,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightBlue,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey2,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.govGrey4,
    borderRadius: 20,
    marginRight: 8,
  },
  sortOptionActive: {
    backgroundColor: colors.govBlue,
  },
  sortOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey2,
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.govGrey2,
    textAlign: 'center' as const,
    lineHeight: 21,
    maxWidth: 280,
    marginBottom: 20,
  },
  clearFiltersButton: {
    backgroundColor: colors.govBlue,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.white,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
    marginTop: 16,
  },
  lineChartWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  yAxisLabel: {
    fontSize: 11,
    color: colors.govGrey2,
    width: 20,
  },
  chartWithGrid: {
    flex: 1,
    position: 'relative' as const,
  },
  gridLines: {
    position: 'absolute' as const,
    top: 10,
    left: 0,
    right: 0,
    bottom: 40,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.govGrey4,
  },
  barValueLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginTop: 4,
  },
  chartTargetLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  targetLineDash: {
    flex: 1,
    height: 2,
    backgroundColor: colors.govGrey3,
    borderRadius: 1,
  },
  targetLineText: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  barChartInnerValue: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: colors.white,
    paddingLeft: 8,
    paddingVertical: 2,
  },
  riskLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 110,
  },
  riskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 70,
  },
  riskPercentage: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  assessmentModalContent: {
    maxHeight: '90%',
    paddingBottom: 40,
    flex: 1,
  },
  assessmentDetailsScroll: {
    flexGrow: 1,
    flexShrink: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.govGrey4,
  },
  detailHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.lightBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailHeaderText: {
    flex: 1,
  },
  detailEmployeeName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.govGrey1,
    marginBottom: 4,
  },
  detailEmployeeEmail: {
    fontSize: 13,
    color: colors.govGrey2,
    marginBottom: 2,
  },
  detailEmployeeDept: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  detailSummaryBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.govGrey4,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  detailMetaLabel: {
    fontSize: 13,
    color: colors.govGrey2,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 12,
    letterSpacing: -0.16,
  },
  detailCard: {
    backgroundColor: colors.govGrey4,
    borderRadius: 10,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.govGrey2,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    flex: 1,
    textAlign: 'right' as const,
  },
  detailNotesRow: {
    marginTop: 4,
  },
  detailNotesValue: {
    fontSize: 13,
    color: colors.govGrey1,
    lineHeight: 20,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  detailPriorities: {
    fontSize: 14,
    color: colors.govGrey1,
    lineHeight: 21,
  },
  riskRegisterCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.govBlue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  riskRegisterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  riskRegisterTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    flex: 1,
  },
  riskRegisterArea: {
    fontSize: 12,
    color: colors.govBlue,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  riskRegisterDescription: {
    fontSize: 13,
    color: colors.govGrey2,
    lineHeight: 19,
    marginBottom: 12,
  },
  riskScores: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 8,
  },
  riskScoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskScoreLabel: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  riskScoreValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: colors.govGrey1,
  },
  riskOwner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskOwnerLabel: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  riskOwnerValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govGrey1,
  },
  detailFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.govGrey4,
  },
  exportDetailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.govBlue,
    borderRadius: 8,
    paddingVertical: 14,
    minHeight: 44,
  },
  exportDetailButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  closeDetailButton: {
    flex: 1,
    backgroundColor: colors.govBlue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  closeDetailButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.white,
  },
  employeeCardClickable: {
    borderWidth: 1,
    borderColor: colors.govBlue + '20',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  detailSummaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.govBlue,
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 11,
    color: colors.govGrey2,
    textAlign: 'center' as const,
  },
  completionInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7F6ED',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.govGreen,
  },
  completionInfoText: {
    flex: 1,
  },
  completionInfoTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govGrey1,
    marginBottom: 2,
  },
  completionInfoSubtitle: {
    fontSize: 12,
    color: colors.govGrey2,
  },
  questionBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.govGrey3,
  },
  questionText: {
    fontSize: 13,
    color: colors.govGrey1,
    lineHeight: 19,
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  answerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 6,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.govBlue,
  },
  notesBlock: {
    backgroundColor: colors.white,
    borderRadius: 6,
    padding: 12,
    marginTop: 4,
  },
  notesBlockTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.govGrey2,
    marginBottom: 6,
  },
  notesBlockText: {
    fontSize: 13,
    color: colors.govGrey1,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
});
