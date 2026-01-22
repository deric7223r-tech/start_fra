import { useRouter } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const protections = [
  {
    title: 'Legal Protection',
    items: [
      'Protected from dismissal if you report in good faith',
      'Protected from disciplinary action or demotion',
      'Protected from harassment or victimization',
      'Protected under Public Interest Disclosure Act 1998 (UK)',
    ],
  },
  {
    title: 'Qualifying Disclosure Requirements',
    items: [
      'You report in good faith',
      'You reasonably believe the information is true',
      'You report to the appropriate person or body',
      'The disclosure is in the public interest',
    ],
  },
  {
    title: 'Your Responsibilities',
    items: [
      'Report through proper channels first (internal before external)',
      'Do not make malicious or false allegations',
      'Do not disclose for personal gain',
      'Cooperate with any investigation',
    ],
  },
];

export default function WhistleblowerScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <ShieldCheck color="#059669" size={48} />
          </View>
          <Text style={styles.title}>You Are Protected</Text>
          <Text style={styles.subtitle}>
            Legal protections for raising concerns about fraud
          </Text>
        </View>

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            If you report fraud concerns in good faith, you are protected by law from retaliation.
          </Text>
        </View>

        <View style={styles.sectionsContainer}>
          {protections.map((section, index) => (
            <View key={index} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.itemsContainer}>
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex} style={styles.item}>
                    <View style={styles.itemBullet} />
                    <Text style={styles.itemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.retaliationCard}>
          <Text style={styles.retaliationTitle}>If You Face Retaliation</Text>
          <Text style={styles.retaliationText}>
            Contact HR or Legal immediately. Retaliation against whistleblowers is illegal and grounds for employment tribunal claim.
          </Text>
          <Text style={styles.retaliationContact}>
            [Insert HR/Legal Contact Details]
          </Text>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Whistleblower protection exists to encourage honest reporting. The organisation values your courage in speaking up.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/myths')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Common Fraud Myths</Text>
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
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  banner: {
    backgroundColor: '#059669',
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
  sectionsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  itemsContainer: {
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginTop: 7,
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  retaliationCard: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  retaliationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  retaliationText: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
    marginBottom: 12,
  },
  retaliationContact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  noteCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
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
