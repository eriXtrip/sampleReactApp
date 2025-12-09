// app/(profile)/terms.jsx

import React from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedView  from '../../components/ThemedView.jsx';
import ThemedText from '../../components/ThemedText.jsx';
import ThemedButton from '../../components/ThemedButton.jsx';
import { Colors } from '../../constants/Colors.js';

const TermsScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.updated}>Last Updated: 2025-11-28</ThemedText>

        <ThemedText style={styles.h1}>1. Acceptance of Terms</ThemedText>
        <ThemedText style={styles.p}>
          By accessing or using MQuest, you agree to be bound by these Terms and Conditions. If you do not agree,
          do not use the Service. If you are a minor, you must have permission from a parent, guardian, or responsible
          school official, where applicable.
        </ThemedText>

        <ThemedText style={styles.h1}>2. Eligibility</ThemedText>
        <ThemedText style={styles.p}>
          You must meet the minimum age requirements in your jurisdiction (e.g., 13+) or obtain permission from your
          parent or guardian. If your account is provided by a school or educator, they confirm your eligibility and
          authorize your use of the Service.
        </ThemedText>

        <ThemedText style={styles.h1}>3. Accounts and Security</ThemedText>
        <ThemedText style={styles.p}>
          You agree to provide accurate information and keep your credentials secure. You are responsible for all
          activities under your account. Notify us immediately of any unauthorized use or security incident.
        </ThemedText>

        <ThemedText style={styles.h1}>4. Permitted and Prohibited Use</ThemedText>
        <ThemedText style={styles.p}>
          The Service is for lawful, personal, and/or educational use. You agree not to reverse engineer, scrape,
          interfere with the Service, transmit malware, harass others, or violate any laws or the rights of others.
        </ThemedText>

        <ThemedText style={styles.h1}>5. Content and Intellectual Property</ThemedText>
        <ThemedText style={styles.p}>
          You retain ownership of content you submit. You grant matatag and company a limited license to host and display
          your content solely to provide the Service. All Service content, code, and brand assets belong to
          matatag and company and are licensed to you for use within the app only.
        </ThemedText>

        <ThemedText style={styles.h1}>6. Third-Party Links and In-App Browser</ThemedText>
        <ThemedText style={styles.p}>
          The Service may open external websites within the app or your default browser. External sites are governed by
          their own terms and privacy policies. We are not responsible for the content or practices of third-party sites.
        </ThemedText>

        <ThemedText style={styles.h1}>7. Communications and Notifications</ThemedText>
        <ThemedText style={styles.p}>
          We may send in-app, push, or email notifications about service updates, account activity, and security alerts.
          You may adjust notification preferences in your device or account settings where available.
        </ThemedText>

        <ThemedText style={styles.h1}>8. Privacy</ThemedText>
        <ThemedText style={styles.p}>
          Our data practices are described in the Privacy Policy. By using the Service, you agree that we may collect and
          use your information as outlined there.
        </ThemedText>

        <ThemedText style={styles.h1}>9. Disclaimers</ThemedText>
        <ThemedText style={styles.p}>
          The Service is provided "as is" and "as available" without warranties of any kind, except as required by law.
          We do not guarantee uninterrupted or error-free operation.
        </ThemedText>

        <ThemedText style={styles.h1}>10. Limitation of Liability</ThemedText>
        <ThemedText style={styles.p}>
          To the maximum extent permitted by law, matatag and company shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or any loss of data or profits.
        </ThemedText>

        <ThemedText style={styles.h1}>11. Indemnification</ThemedText>
        <ThemedText style={styles.p}>
          You agree to indemnify and hold harmless matatag and company from any claims, damages, liabilities, and expenses
          arising from your use of the Service or violation of these Terms.
        </ThemedText>

        <ThemedText style={styles.h1}>12. Termination</ThemedText>
        <ThemedText style={styles.p}>
          We may suspend or terminate your access to the Service at any time for violations of these Terms, security
          risks, or legal requests.
        </ThemedText>

        <ThemedText style={styles.h1}>13. Changes to Terms</ThemedText>
        <ThemedText style={styles.p}>
          We may modify these Terms from time to time. Material changes will be communicated within the app or by other
          reasonable means. Your continued use of the Service after changes constitutes acceptance.
        </ThemedText>

        <ThemedText style={styles.h1}>14. Governing Law and Dispute Resolution</ThemedText>
        <ThemedText style={styles.p}>
          These Terms are governed by the laws of philippines, without regard to its conflict of law principles. Any
          disputes shall be resolved in the courts or arbitration forums of philippines.
        </ThemedText>

        <ThemedText style={styles.h1}>15. Contact</ThemedText>
        <ThemedText style={styles.p}>
          For questions about these Terms, contact us at matatagquest@gmail.com.
        </ThemedText>

        <View style={styles.divider} />
        <ThemedText style={styles.note}>
          By continuing to use MQuest, you acknowledge you have read and agreed to these Terms.
        </ThemedText>

      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff', paddingBottom:10, },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e7',
  },
  headerBtn: { paddingVertical: 6, paddingRight: 8, paddingLeft: 2 },
  headerBtnText: { color: Colors.primary, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '600' },
  headerRight: { width: 54 },
  content: { padding: 16, paddingBottom: 40 },
  updated: { opacity: 0.6, marginBottom: 12 },
  h1: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
  p: { lineHeight: 20 },
  note: { textAlign: 'center', opacity: 0.8 },
  divider: { height: 1, backgroundColor: '#e4e4e7', marginVertical: 20 },
});
