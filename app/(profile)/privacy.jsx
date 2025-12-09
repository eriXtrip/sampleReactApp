import React from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedView from '../../components/ThemedView.jsx';
import ThemedText from '../../components/ThemedText.jsx';
import ThemedButton from '../../components/ThemedButton.jsx';
import { Colors } from '../../constants/Colors.js';

const PrivacyScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.updated}>Last Updated: 2025-11-28</ThemedText>

        <ThemedText style={styles.h1}>1. Introduction</ThemedText>
        <ThemedText style={styles.p}>
          This Privacy Policy explains how matatag and company ("we", "us") collects, uses, and shares information about
          you when you use MQuest. By using the Service, you agree to the collection and use of information
          in accordance with this Policy.
        </ThemedText>

        <ThemedText style={styles.h1}>2. Information We Collect</ThemedText>
        <ThemedText style={styles.p}>
          We collect information you provide (e.g., name, email, gender, profile details) and information collected
          automatically (e.g., device information, app usage data, crash logs, IP address, and push tokens). We may
          also receive information from third-party services where integrations are used.
        </ThemedText>

        <ThemedText style={styles.h1}>3. How We Use Information</ThemedText>
        <ThemedText style={styles.p}>
          We use your information to operate and improve the Service, authenticate users, personalize experiences,
          support offline usage, store progress, send notifications, debug issues, and enhance security.
        </ThemedText>

        <ThemedText style={styles.h1}>4. Legal Bases</ThemedText>
        <ThemedText style={styles.p}>
          Depending on your jurisdiction, we may rely on consent, contract performance, legitimate interests, and/or
          compliance with legal obligations as the legal bases for processing your data.
        </ThemedText>

        <ThemedText style={styles.h1}>5. Sharing and Disclosure</ThemedText>
        <ThemedText style={styles.p}>
          We share data with service providers that help us deliver the Service (e.g., hosting, analytics, notifications).
          We may disclose information to comply with legal requests or to protect rights and safety.
        </ThemedText>

        <ThemedText style={styles.h1}>6. Data Storage, Security, and Retention</ThemedText>
        <ThemedText style={styles.p}>
          We implement reasonable security measures. Data may be stored on secure servers and within the app (e.g.,
          secure credentials, offline databases, cached files). We retain data as long as necessary to provide the
          Service and as required by law.
        </ThemedText>

        <ThemedText style={styles.h1}>7. Children’s Privacy</ThemedText>
        <ThemedText style={styles.p}>
          If MQuest is used by students/minors, we require parental or school authorization where applicable and
          limit data collection to what is necessary for learning and app functionality.
        </ThemedText>

        <ThemedText style={styles.h1}>8. International Data Transfers</ThemedText>
        <ThemedText style={styles.p}>
          If data is transferred across borders, we use appropriate safeguards (e.g., standard contractual clauses)
          to protect your information in accordance with applicable laws.
        </ThemedText>

        <ThemedText style={styles.h1}>9. Your Rights</ThemedText>
        <ThemedText style={styles.p}>
          Depending on your role, you may have rights to access, correct, delete, or export your data, restrict or
          object to certain processing, and withdraw consent. To exercise these rights, contact us at matatagquest@gmail.com.
        </ThemedText>

        <ThemedText style={styles.h1}>10. Cookies and Device Identifiers</ThemedText>
        <ThemedText style={styles.p}>
          We may use device identifiers, local storage, and analytics SDKs to provide core functionality and improve
          performance. You can control certain permissions in your device settings.
        </ThemedText>

        <ThemedText style={styles.h1}>11. Changes to This Policy</ThemedText>
        <ThemedText style={styles.p}>
          We may update this Policy from time to time. Significant changes will be communicated in-app or via other
          reasonable means. Your continued use of the Service after changes indicates your acceptance.
        </ThemedText>

        <ThemedText style={styles.h1}>12. Contact Us</ThemedText>
        <ThemedText style={styles.p}>
          If you have questions or concerns about this Policy, contact us at matatagquest@gmail.com.
        </ThemedText>

      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyScreen;

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
});
