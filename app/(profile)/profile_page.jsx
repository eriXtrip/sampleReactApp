// app/(profile)/profile_page.jsx
import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import Spacer from '../../components/Spacer';
import ThemedButton from '../../components/ThemedButton';
import { UserContext } from '../../contexts/UserContext';
import { ProfileContext } from '../../contexts/ProfileContext';
import  RankingBoard  from '../../components/RankingBoard';
import { getLocalAvatarPath } from '../../utils/avatarHelper';
import { useRanking } from '../../contexts/RankingContext';

const ProfilePage = () => {
  const router = useRouter();
  const { user, updateUser } = useContext(UserContext || {});
  const { themeColors } = useContext(ProfileContext || {});
  const colorScheme = useColorScheme();
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gradeLevel, setGradeLevel] = useState(''); // new
  const [section, setSection] = useState(''); // new
  const [birthday, setBirthday] = useState(''); // new (YYYY-MM-DD)
  const [saving, setSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  const { ranking, loading } = useRanking();


  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setMiddleName(user.middle_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setGradeLevel(user.grade_level || '');
      setSection(user.section || '');
      setBirthday(user.birthday || '');
    }
  }, [user]);

  const handleSave = async () => {
    const payload = {
      ...user,
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      grade_level: gradeLevel.trim(),
      section: section.trim(),
      birthday: birthday.trim(),
    };

    setSaving(true);
    try {
      if (typeof updateUser === 'function') {
        await updateUser(payload);
      } else {
        // fallback: simulate save if updateUser isn't provided by context
        await new Promise(res => setTimeout(res, 800));
      }
      Alert.alert('Saved', 'Profile updated successfully.', [{ text: 'OK' }]);
      router.back();
    } catch (err) {
      console.error('Save failed', err);
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
  const initials = (firstName?.[0] || '') + (lastName?.[0] || '');
  const displayName = fullName || user?.name || user?.username || 'Your Name';
  const displayEmail = email || user?.email || '';

  const [editing, setEditing] = useState(false);

  // helper to format birthday for display (simple)
  const formatBirthday = (b) => {
    if (!b) return '';
    // if already ISO-like YYYY-MM-DD, convert to readable
    const parts = b.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    return b;
  };

  useEffect(() => {
  (async () => {
    if (!user) {
      setAvatarUri(null);
      return;
    }

    if (user.avatar_file_name) {
      const localPath = getLocalAvatarPath(user.avatar_file_name);
      try {
        const info = await FileSystem.getInfoAsync(localPath);
        if (info.exists) {
          setAvatarUri(localPath);
          return;
        }
      } catch (e) {
        console.log('Avatar file check failed', e);
      }
    }

    setAvatarUri(user.avatar_thumbnail || null);
  })();
}, [user]);

  return (
    <ThemedView style={styles.container} safe={true}>
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: theme.navBackground }]}>
        <View style={styles.profileBlock}>
          <View style={[styles.avatar, { backgroundColor: theme.card || '#ccc' }]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                resizeMode="cover"
              />
            ) : (
              <ThemedText style={[styles.avatarText, { color: theme.text }]}>
                {initials.toUpperCase() || '?'}
              </ThemedText>
            )}
          </View>

          <View style={styles.nameBlock}>
            <ThemedText style={[styles.nameText, { color: theme.text }]} numberOfLines={1}>{displayName}</ThemedText>
            {displayEmail ? <ThemedText style={[styles.emailText, { color: theme.text }]} numberOfLines={1}>{displayEmail}</ThemedText> : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {editing ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => setEditing(false)}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconButton} onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pupil details card (visible when not editing) */}
      {!editing ? (
        <>
          <RankingBoard ranking={ranking} />
        </>
      ) : null}

      {editing ? (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Spacer height={20} />

          <ThemedText style={styles.label}>First name</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.navBackground, color: theme.text }]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor="#999"
          />

          <Spacer height={12} />

          <ThemedText style={styles.label}>Middle name</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.navBackground, color: theme.text }]}
            value={middleName}
            onChangeText={setMiddleName}
            placeholder="Middle name"
            placeholderTextColor="#999"
          />

          <Spacer height={12} />

          <ThemedText style={styles.label}>Last name</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.navBackground, color: theme.text }]}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor="#999"
          />

          <Spacer height={12} />

          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.navBackground, color: theme.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />

      

          <Spacer height={12} />

          {/* <ThemedText style={styles.label}>Birthday</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.navBackground, color: theme.text }]}
            value={birthday}
            onChangeText={setBirthday}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          /> */}

          <Spacer height={24} />

          <ThemedButton onPress={handleSave} style={styles.saveButton} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.saveText}>Save</ThemedText>}
          </ThemedButton>

          <Spacer height={20} />
        </ScrollView>
      ) : null}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // small bottom border to separate header from content
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', marginLeft: 6 },

  profileBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12, marginRight: 8 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  nameBlock: { flex: 1, justifyContent: 'center' },
  nameText: { fontSize: 16, fontWeight: '700' },
  emailText: { fontSize: 12, marginTop: 2, opacity: 0.9 },

  detailsCard: {
    margin: 16,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    // subtle shadow for iOS / elevation for Android could be defined in theme
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  detailIcon: { width: 26 },
  detailLabel: { flex: 0.6, fontSize: 14, fontWeight: '600' },
  detailValue: { flex: 1.4, fontSize: 14, textAlign: 'right', opacity: 0.9 },

  scrollContainer: { padding: 20, paddingBottom: 40 },
  label: { marginBottom: 6, fontSize: 14 },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveButton: {
    marginHorizontal: 0,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
});

export default ProfilePage;