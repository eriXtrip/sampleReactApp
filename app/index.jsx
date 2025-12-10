// app/index.jsx - SIMPLIFIED VERSION
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '../hooks/useUser';
import SplashAnimation from '../components/SplashAnimation';

export default function Index() {
  const router = useRouter();
  const { user, isLoading, isDatabaseReady } = useUser();

  useEffect(() => {
    // Simple navigation logic
    if (!isLoading && isDatabaseReady) {
      const route = user ? '/home' : '/login';
      console.log('Navigating to:', route);
      
      // Small delay for smooth transition
      const timer = setTimeout(() => {
        router.replace(route);
      }, 2000); // 2 seconds for animation
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, isDatabaseReady, user, router]);

  return (
    <View style={styles.container}>
      <SplashAnimation />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});