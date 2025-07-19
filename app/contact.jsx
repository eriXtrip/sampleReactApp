import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { setApiUrl, getApiUrl } from '../utils/apiManager';
import { Ionicons } from '@expo/vector-icons';

const ApiConfigScreen = ({ onComplete }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    (async () => {
      const saved = await getApiUrl();
      if (saved) setUrl(saved);
    })();
  }, []);

  const handleSave = async () => {
    console.log('Save button pressed', url);
    if (!url) return alert('Please enter a valid API IP (e.g. http://192.168.0.112:3001/api)');
    await setApiUrl(url);
    onComplete();
  };

  return (
    <View
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Ionicons name="cloud-outline" size={40} color="#4A90E2" style={styles.icon} />

        <Text style={styles.title}>API Configuration</Text>
        <Text style={styles.description}>
          Enter your API Server IP address (e.g. <Text style={{ fontWeight: 'bold' }}>http://192.168.0.112:3001/api</Text>)
        </Text>

        <TextInput
          value={url}
          onChangeText={setUrl}
          style={styles.input}
          placeholder="http://192.168.0.112:3001/api"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save and Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ApiConfigScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#cececeff',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    padding: 28,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});