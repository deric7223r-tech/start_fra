import { useRouter } from 'expo-router';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FraudBasicsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <AlertTriangle color="#f59e0b" size={48} />
          </View>
          <Text style={styles.title}>How Fraud Really Happens</Text>
          <Text style={styles.subtitle}>The Fraud Triangle</Text>
        </View>

        <View style={styles.triangleContainer}>
          <View style={styles.triangleVisual}>
            <View style={styles.triangleTop}>
              <View style={styles.triangleNode}>
                <Text style={styles.triangleNodeLabel}>PRESSURE</Text>
                <Text style={styles.triangleNodeText}>Financial stress{'\n'}Unrealistic targets</Text>
              </View>
            </View>
            <View style={styles.triangleBottom}>
              <View style={[styles.triangleNode, styles.triangleNodeHighlight]}>
                <Text style={[styles.triangleNodeLabel, styles.triangleNodeLabelHighlight]}>
                  OPPORTUNITY
                </Text>
                <Text style={[styles.triangleNodeText, styles.triangleNodeTextHighlight]}>
                  Weak controls{'\n'}Lack of oversight
                </Text>
              </View>
              <View style={styles.triangleNode}>
                <Text style={styles.triangleNodeLabel}>RATIONALIZATION</Text>
                <Text style={styles.triangleNodeText}>Everyone does it{'\n'}I deserve this</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Your Control Point</Text>
          <Text style={styles.insightText}>
            You cannot control employee financial pressures or their ability to rationalize.
          </Text>
          <Text style={[styles.insightText, styles.insightTextBold]}>
            But you CAN remove opportunities through robust controls.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Fraud occurs when three elements align:</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <View style={styles.bullet} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Pressure:</Text> Financial difficulties, unrealistic performance targets, or personal problems
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.bullet, styles.bulletHighlight]} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Opportunity:</Text> Weak internal controls, lack of oversight, or trust without verification
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.bullet} />
              <Text style={styles.infoText}>
                <Text style={styles.infoBold}>Rationalization:</Text> Justifying dishonest behavior through mental gymnastics
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/scenarios')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>View Fraud Scenarios</Text>
          <ChevronRight color="#ffffff" size={20} />
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
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  triangleContainer: {
    marginBottom: 24,
  },
  triangleVisual: {
    paddingVertical: 20,
  },
  triangleTop: {
    alignItems: 'center',
    marginBottom: 40,
  },
  triangleBottom: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  triangleNode: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 16,
    width: 160,
    alignItems: 'center',
  },
  triangleNodeHighlight: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  triangleNodeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  triangleNodeLabelHighlight: {
    color: '#f59e0b',
  },
  triangleNodeText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  triangleNodeTextHighlight: {
    color: '#d97706',
  },
  insightCard: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  insightText: {
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  insightTextBold: {
    fontWeight: '700',
    marginBottom: 0,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
    marginTop: 6,
    marginRight: 12,
  },
  bulletHighlight: {
    backgroundColor: '#f59e0b',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
    color: '#0f172a',
  },
  continueButton: {
    backgroundColor: '#1e40af',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
});
