// SAMPLEREACTAPP/app/(dashboard)/profile.jsx

import { StyleSheet, View, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import { ProfileContext } from '../../contexts/ProfileContext';

const Profile = () => {
  const router = useRouter();
  // Destructure both user and logout from context
  const { user, logout } = useContext(UserContext);

  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  // Safely access user data with fallbacks
  const displayName = user 
    ? `${user.first_name || ''}${
      user.middle_name ? ` ${user.middle_name.charAt(0).toUpperCase()}.` : ''
      } ${user.last_name || ''}`.trim()
    : "Loading...";
  const displayEmail = user?.email || "Loading...";
  const school = "Del Rosario Elementary School";

  const handleLogout = async () => {
    try {
      const success = await logout(user.server_id);
      if (success) {
        router.replace('/login');
      } else {
        Alert.alert(
          'Logout Failed',
          'Server not reachable. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert(
        'Logout Failed',
        'Unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: 'https://api.dicebear.com/9.x/bottts-neutral/png?seed=Aidan' }}
            style={styles.avatar}
          />
          <Spacer height={15} />
          <ThemedText style={styles.name}>{displayName}</ThemedText>
          <ThemedText style={styles.email}>{displayEmail}</ThemedText>
        </View>

        <Spacer height={30} />

        {/* PROFILE MENU Card */}
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>PROFILE MENU</ThemedText>
         
          <TouchableOpacity style={[styles.cardItem]}
            onPress={() => router.push('/profile_page')}
          >
            <ThemedText>My Profile</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.cardItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/change-password')}
          >
            <ThemedText>Change Password</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* <Spacer height={5} />

        
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>APPEARANCE</ThemedText>
          <TouchableOpacity
            style={[styles.cardItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/theme')}
          >
            <ThemedText>Theme</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View> */}

         <Spacer height={5} />

        {/* Download Card */}
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>Download Queue</ThemedText>
          <TouchableOpacity
            style={[styles.cardItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/download')}
          >
            <ThemedText>Dowload</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Spacer height={5} />

        {/* ABOUT MQUEST Card */}
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>ABOUT MQUEST</ThemedText>
          <TouchableOpacity style={styles.cardItem}>
            <ThemedText>Privacy Policy</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardItem, { borderBottomWidth: 0 }]}>
            <ThemedText>Terms and Conditions</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Spacer height={30} />

        {/* Log Out Button */}
        <ThemedButton 
          onPress={handleLogout}
          style={styles.logoutButton}
          textStyle={styles.logoutButtonText}
        >
          Log Out
        </ThemedButton>

        <Spacer height={30} />

        {/* Footer */}
        <View style={styles.footer}>
          <Image 
            source={require('../../assets/img/Login_Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.footerText}>Made for {school}</ThemedText>
          <ThemedText style={styles.versionText}>Version 1.0</ThemedText>
        </View>

      </ScrollView>
      <Spacer height={100} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',  
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cardItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 15,
    borderRadius: 10,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 12,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Profile;