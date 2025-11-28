import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import ThemedText from '../components/ThemedText.jsx';
import ThemedView from '../components/ThemedView.jsx';
import { Colors } from '../constants/Colors.js';

const InAppBrowserScreen = () => {
  const { url, title } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  // Debug the received parameters
  console.log('InAppBrowserScreen params:', { url, title });

  const parsedUrl = useMemo(() => {
    if (!url) return null;
    try {
      // Handle both encoded and raw URLs
      const decodedUrl = decodeURIComponent(String(url));
      console.log('Decoded URL:', decodedUrl);
      return new URL(decodedUrl).toString();
    } catch (error) {
      console.error('URL parsing error:', error);
      // Try to use as-is if URL parsing fails
      return String(url);
    }
  }, [url]);

  console.log('Parsed URL:', parsedUrl);

  if (!parsedUrl) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ThemedText>No valid URL to open.</ThemedText>
          <ThemedText style={styles.helperText}>Received URL: {String(url)}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <ThemedText style={styles.helperText}>Loading…</ThemedText>
        </View>
      )}

      <WebView
        source={{ uri: parsedUrl }}
        onLoadEnd={() => setLoading(false)}
        onLoadStart={() => setLoading(true)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          setLoading(false);
        }}
        startInLoadingState={true}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
};

export default InAppBrowserScreen;

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#fff', 
    marginBottom: 49,
  },
  center: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24, 
    gap: 12,
    backgroundColor: '#fff',
    zIndex: 1000
  },
  helperText: { 
    textAlign: 'center', 
    opacity: 0.7, 
    fontSize: 12 
  },
});