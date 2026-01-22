import { useRouter } from 'expo-router';
import { RotateCcw, CheckCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Myth {
  id: string;
  myth: string;
  reality: string;
}

const myths: Myth[] = [
  {
    id: '1',
    myth: 'Fraud only happens in large organisations',
    reality:
      'Small organisations suffer higher fraud losses (as % of revenue) due to fewer resources for controls, greater trust/familiarity, and lack of segregation of duties.',
  },
  {
    id: '2',
    myth: 'Trusted, long-serving employees won\'t commit fraud',
    reality:
      'Average fraudster tenure is 8+ years (ACFE). Trust creates opportunity. Pressure and rationalization can affect anyone, regardless of tenure.',
  },
  {
    id: '3',
    myth: 'We have an audit—fraud would be detected',
    reality:
      'Audits sample transactions (don\'t check 100%). Auditors aren\'t forensic investigators. Only 15% of fraud is detected by external audit vs. 40% by whistleblowing.',
  },
  {
    id: '4',
    myth: 'Fraud prevention is Finance\'s job',
    reality:
      'Budget-holders approve 85% of fraud transactions. YOU are the front line. Finance provides oversight, but you approve day-to-day spending.',
  },
  {
    id: '5',
    myth: 'Small amounts don\'t matter',
    reality:
      'Small frauds escalate as fraudster becomes emboldened. They signal weak controls and attract more fraud. £100/week = £5,200/year. Cultural impact: "if they get away with it, why can\'t I?"',
  },
];

export default function MythsScreen() {
  const router = useRouter();
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const handleFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <RotateCcw color="#f59e0b" size={40} />
          <Text style={styles.title}>Common Fraud Myths</Text>
          <Text style={styles.subtitle}>Tap any card to reveal the reality</Text>
        </View>

        <View style={styles.cardsContainer}>
          {myths.map((myth) => {
            const isFlipped = flippedCards[myth.id];

            return (
              <TouchableOpacity
                key={myth.id}
                style={styles.cardWrapper}
                onPress={() => handleFlip(myth.id)}
                activeOpacity={0.9}
              >
                <View style={[styles.card, isFlipped && styles.cardFlipped]}>
                  {!isFlipped ? (
                    <View style={styles.cardFront}>
                      <View style={styles.mythBadge}>
                        <Text style={styles.mythBadgeText}>MYTH</Text>
                      </View>
                      <Text style={styles.mythText}>{myth.myth}</Text>
                      <Text style={styles.tapHint}>Tap to see reality</Text>
                    </View>
                  ) : (
                    <View style={styles.cardBack}>
                      <View style={styles.realityBadge}>
                        <CheckCircle color="#ffffff" size={20} />
                        <Text style={styles.realityBadgeText}>REALITY</Text>
                      </View>
                      <Text style={styles.realityText}>{myth.reality}</Text>
                      <Text style={styles.tapHint}>Tap to see myth</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Remove complacency and false confidence by understanding these common misconceptions.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => router.push('/pledge')}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Take Your Pledge</Text>
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
    fontSize: 28,
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
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  cardWrapper: {
    minHeight: 200,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFlipped: {
    backgroundColor: '#059669',
  },
  cardFront: {
    alignItems: 'center',
  },
  cardBack: {
    alignItems: 'center',
  },
  mythBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  mythBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  mythText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  realityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  realityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  realityText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  tapHint: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  noteCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
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
