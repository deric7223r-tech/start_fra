import { useRouter } from 'expo-router';
import { Scale, AlertCircle, User, ChevronRight } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContentBlock {
  id: string;
  title: string;
  icon: React.ComponentType<{ color: string; size: number }>;
  summary: string;
  details: string[];
}

const contentBlocks: ContentBlock[] = [
  {
    id: 'organisational',
    title: 'Organisational Liability',
    icon: Scale,
    summary: 'Under the Economic Crime & Corporate Transparency Act 2023 (effective September 2025)',
    details: [
      'If fraud is committed for the organisation\'s benefit and you failed to prevent it through reasonable procedures, the organisation can face:',
      '• Unlimited fines',
      '• Director disqualification',
      '• Criminal conviction',
    ],
  },
  {
    id: 'personal',
    title: 'Personal Liability',
    icon: AlertCircle,
    summary: 'If you knowingly participate in or facilitate fraud',
    details: [
      '• Criminal prosecution (Fraud Act 2006)',
      '• Dismissal for gross misconduct',
      '• Civil recovery of losses',
      '• Professional disqualification',
    ],
  },
  {
    id: 'ethical',
    title: 'Ethical & Fiduciary Duty',
    icon: User,
    summary: 'Your role as a steward of organisational resources',
    details: [
      'Stewardship: You manage stakeholder resources (taxpayer money, donor funds, shareholder capital). This is a position of trust.',
      'Role Modeling: Your team watches your behavior. Shortcuts you take signal "acceptable" conduct.',
      'Fiduciary Duty: Act in the organisation\'s best interests, not personal convenience.',
    ],
  },
];

export default function LegalScreen() {
  const router = useRouter();
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]);

  const toggleBlock = (id: string) => {
    setExpandedBlocks((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Fraud prevention is a leadership responsibility, not optional compliance.
          </Text>
        </View>

        <View style={styles.blocksContainer}>
          {contentBlocks.map((block) => {
            const isExpanded = expandedBlocks.includes(block.id);
            const Icon = block.icon;

            return (
              <View key={block.id} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleBlock(block.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconCircle}>
                    <Icon color="#dc2626" size={24} />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{block.title}</Text>
                    <Text style={styles.cardSummary}>{block.summary}</Text>
                  </View>
                  <ChevronRight
                    color="#64748b"
                    size={20}
                    style={[
                      styles.chevron,
                      isExpanded && styles.chevronExpanded,
                    ]}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.cardDetails}>
                    {block.details.map((detail, index) => (
                      <Text key={index} style={styles.detailText}>
                        {detail}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/fraud-basics')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Fraud Basics</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.textButtonText}>Back to Role Selection</Text>
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
  banner: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
  },
  blocksContainer: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
  },
  chevron: {
    marginLeft: 8,
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  cardDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  textButton: {
    padding: 12,
    alignItems: 'center',
  },
  textButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
});
