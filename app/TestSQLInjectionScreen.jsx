

import React, { useState, useContext } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { UserContext } from '../contexts/UserContext'; // Adjust if needed
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // optional icon for back arrow

const TestSQLInjectionScreen = () => {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const router = useRouter()

  const {
    testVulnerableFunction,
    testSecureFunction,
  } = useContext(UserContext);

  const handleVulnerableTest = async () => {
    const res = await testVulnerableFunction(email); //`' UNION SELECT table_name, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM information_schema.tables WHERE table_schema = DATABASE() -- `
    setResult({ type: 'vulnerable', data: res });
  };

  const handleSecureTest = async () => {
    const res = await testSecureFunction(email);
    setResult({ type: 'secure', data: res });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ✅ Back Button */}
      <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#333" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>🧪 SQL Injection Test</Text>

      <TextInput
        style={styles.input}
        placeholder="' OR 1=1 -- '"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Button
        title="🚨 Test Vulnerable Endpoint"
        onPress={handleVulnerableTest}
        color="#cc3333"
      />
      <View style={{ marginVertical: 10 }} />
      <Button
        title="✅ Test Secure Endpoint"
        onPress={handleSecureTest}
        color="#339933"
      />

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>
            {result.type === 'vulnerable' ? '🔓 Vulnerable' : '🔐 Secure'} Result:
          </Text>
          <Text style={styles.resultText}>{JSON.stringify(result.data, null, 2)}</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default TestSQLInjectionScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backText: {
    fontSize: 16,
    marginLeft: 5,
    color: '#333',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 20,
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
  },
  resultLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
