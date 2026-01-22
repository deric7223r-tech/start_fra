import { useApp, UserRole } from '@/contexts/AppContext';
import { useRouter } from 'expo-router';
import {
  FileText,
  CreditCard,
  Users,
  FileSignature,
  CheckSquare,
  AlertCircle,
} from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScenarioCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  description: string;
  relevantRoles: UserRole[];
  scenarioCount: number;
}

const scenarioCategories: ScenarioCategory[] = [
  {
    id: 'procurement',
    title: 'Procurement Fraud',
    icon: FileText,
    description: 'Fake suppliers, inflated pricing, kickbacks, and split purchases',
    relevantRoles: ['procurement', 'invoices'],
    scenarioCount: 3,
  },
  {
    id: 'invoice-payment',
    title: 'Invoice & Payment Fraud',
    icon: CreditCard,
    description: 'Email impersonation, duplicate payments, and bank fraud',
    relevantRoles: ['invoices'],
    scenarioCount: 2,
  },
  {
    id: 'payroll',
    title: 'Payroll & HR Fraud',
    icon: Users,
    description: 'Ghost employees, timesheet fraud, and payroll manipulation',
    relevantRoles: ['payroll'],
    scenarioCount: 2,
  },
  {
    id: 'expenses',
    title: 'Expense Fraud',
    icon: FileSignature,
    description: 'False claims, mileage fraud, and fabricated receipts',
    relevantRoles: ['expenses'],
    scenarioCount: 2,
  },
  {
    id: 'contracts',
    title: 'Contract Fraud',
    icon: CheckSquare,
    description: 'Contract splitting and revenue manipulation',
    relevantRoles: ['contracts'],
    scenarioCount: 2,
  },
];

export default function ScenariosScreen() {
  const { selectedRoles } = useApp();
  const router = useRouter();

  const isRelevant = (category: ScenarioCategory) => {
    return category.relevantRoles.some((role) => selectedRoles.includes(role));
  };

  const sortedCategories = [...scenarioCategories].sort((a, b) => {
    const aRelevant = isRelevant(a);
    const bRelevant = isRelevant(b);
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return 0;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <AlertCircle color="#dc2626" size={40} />
          <Text style={styles.title}>Fraud Scenarios You Will Encounter</Text>
          <Text style={styles.subtitle}>
            Real-world fraud examples with red flags and prevention strategies
          </Text>
        </View>

        {selectedRoles.length > 0 && (
          <View style={styles.priorityBanner}>
            <Text style={styles.priorityText}>
              Categories relevant to your role are shown first
            </Text>
          </View>
        )}

        <View style={styles.categoriesContainer}>
          {sortedCategories.map((category) => {
            const Icon = category.icon;
            const relevant = isRelevant(category);

            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, relevant && styles.categoryCardRelevant]}
                onPress={() =>
                  router.push({
                    pathname: '/scenario-detail',
                    params: { category: category.id },
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <View
                    style={[styles.iconCircle, relevant && styles.iconCircleRelevant]}
                  >
                    <Icon color={relevant ? '#dc2626' : '#64748b'} size={28} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.categoryTitle}>{category.title}</Text>
                      {relevant && <View style={styles.relevantBadge} />}
                    </View>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                    <Text style={styles.scenarioCount}>
                      {category.scenarioCount} scenario{category.scenarioCount > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/red-flags')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Red Flags</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
  },
  priorityBanner: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  priorityText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  categoriesContainer: {
    gap: 16,
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  categoryCardRelevant: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  categoryHeader: {
    flexDirection: 'row',
    padding: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircleRelevant: {
    backgroundColor: '#fee2e2',
  },
  categoryInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  relevantBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 8,
  },
  scenarioCount: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
