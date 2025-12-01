// SAMPLEREACTAPP/app/(dashboard)/profile.jsx

import { StyleSheet, View, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useContext, useState, useEffect } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import * as FileSystem from 'expo-file-system';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import DangerAlert from '../../components/DangerAlert';
import ThemedAlert from '../../components/ThemedAlert';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import { ProfileContext } from '../../contexts/ProfileContext';
import { getLocalAvatarPath } from '../../utils/avatarHelper';

const Profile = () => {
  const router = useRouter();
  // Destructure both user and logout from context
  const { user, logout } = useContext(UserContext);

  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const [avatarUri, setAvatarUri] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [exitAlertVisible, setExitAlertVisible] = useState(false);

  // Safely access user data with fallbacks
  const displayName = user 
    ? `${user.first_name || ''}${
      user.middle_name ? ` ${user.middle_name.charAt(0).toUpperCase()}.` : ''
      } ${user.last_name || ''}`.trim()
    : "Loading...";
  const displayEmail = user?.email || "Loading...";
  const school = "Del Rosario Elementary School";

  // Show the danger alert when logout is pressed
  const handleLogoutPress = () => {
    setExitAlertVisible(true);
  };

  // Show themed alert
  const showThemedAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleLogout = async () => {
    try {
      const success = await logout(user.server_id);
      if (success) {
        router.replace('/login');
      } else {
        showThemedAlert('Server not reachable. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      showThemedAlert('Unexpected error occurred. Please try again.');
    }
  };

  useEffect(() => {
    (async () => {
      if (!user) {
        setAvatarUri(null);
        return;
      }

      // If we have file name → check if local file exists
      if (user.avatar_file_name) {
        const localPath = getLocalAvatarPath(user.avatar_file_name);
        try {
          const info = await FileSystem.getInfoAsync(localPath);
          if (info.exists) {
            setAvatarUri(localPath);
            console.log('Local avatar found:', localPath);
            return;
          }
        } catch (e) {
          console.log('Avatar file check failed');
        }
      }

      // Fallback to thumbnail
      setAvatarUri(user.avatar_thumbnail || null);
    })();
  }, [user]);

  return (
    <ThemedView style={styles.container} safe={true}>
      <ScrollView contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image 
            key={avatarUri || 'no-avatar'}   // ← Forces remount when URI changes
            source={{ uri: avatarUri || undefined }}
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

        <Spacer height={5} />

        {/* Download Card */}
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>Download Queue</ThemedText>
          <TouchableOpacity
            style={[styles.cardItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/download')}
          >
            <ThemedText>Download</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Spacer height={5} />

        {/* ABOUT MQUEST Card */}
        <View style={[styles.card , { backgroundColor: theme.navBackground, borderColor: theme.cardBorder, borderWidth: 1,}]}>
          <ThemedText style={styles.cardTitle}>ABOUT MQUEST</ThemedText>
          <TouchableOpacity style={styles.cardItem}
            onPress={() => router.push('/privacy')}
          >
            <ThemedText>Privacy Policy</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/terms')}
            >
            <ThemedText>Terms and Conditions</ThemedText>
            <Ionicons name="chevron-forward-outline" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <Spacer height={30} />

        {/* Log Out Button */}
        <ThemedButton 
          onPress={handleLogoutPress}
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

      {/* Alerts */}
      <ThemedAlert
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      <DangerAlert
        visible={exitAlertVisible}
        message="Are you sure you want to log out?"
        onCancel={() => setExitAlertVisible(false)}
        onConfirm={() => {
          setExitAlertVisible(false);
          handleLogout(); // logout action
        }}
      />
      <Spacer height={100} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: -20,
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