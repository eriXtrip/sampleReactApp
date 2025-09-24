// SAMPLEREACTNATIVE/app/(home)/subject_details.jsx

import React, { useContext, useLayoutEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import SelfEnrollmentAlert from '../../components/SelfEnrollmentAlert';
import { UserContext } from '../../contexts/UserContext';
import { useEnrollment } from '../../contexts/EnrollmentContext';
import Spacer from '../../components/Spacer';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const typeToAccent = {
  subject: '#48cae4',
  section: '#9d4edd',
};

const typeToIcon = {
  subject: 'book',
  section: 'layers',
};

const SubjectDetail = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];
  const { user } = useContext(UserContext);
  const { 
    enrollInSubject,
    checkSectionRequiresKey,
    enrollInSectionWithKey,
    enrollInSectionWithoutKey,
    loading: enrolling 
  } = useEnrollment();
  
  const navigation = useNavigation();
  const router = useRouter();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  const { 
    type = 'subject', 
    name = '', 
    createdBy = '', 
    schoolYear = '', 
    requiresEnrollmentKey = '', 
    grade = '', 
    description = '',
    subjectId,
    sectionId
  } = useLocalSearchParams();

  const accentColor = useMemo(() => typeToAccent[type] || typeToAccent.subject, [type]);
  const iconName = useMemo(() => typeToIcon[type] || 'book', [type]);

  const bannerHeight = Math.round(Dimensions.get('window').height * 0.2);

  const parseTitleAndGrade = (rawName, rawGrade) => {
    if (rawGrade) return { title: String(rawName), grade: String(rawGrade) };
    const m = String(rawName).match(/^(.*)\s+(Grade\s*\d+|G\s*\d+)$/i);
    if (m) {
      let g = m[2].trim();
      g = g.replace(/^G\s*(\d+)$/i, 'Grade $1');
      return { title: m[1].trim(), grade: g };
    }
    return { title: String(rawName), grade: '' };
  };

  const { title: parsedTitle, grade: parsedGrade } = useMemo(
    () => parseTitleAndGrade(name, grade),
    [name, grade]
  );

  const navigateToSubjectPage = () => {
    router.push({
      pathname: '/subject_page',
      params: {
        name: parsedTitle,
        grade: parsedGrade,
        progress: 78,
      },
    });
  };

  const [showEnroll, setShowEnroll] = useState(false);

  // ✅ NEW: Handle enrollment based on type
  const handlePressEnroll = async () => {
    if (!user?.server_id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      if (type === 'subject') {
        // Enroll in subject (always public, no key needed)
        await enrollInSubject(user.server_id, parseInt(subjectId));
        navigateToSubjectPage();
      } else if (type === 'section') {
        // Check if section requires enrollment key
        const requiresKey = await checkSectionRequiresKey(parseInt(sectionId));
        
        if (requiresKey) {
          // Show enrollment key modal
          setShowEnroll(true);
        } else {
          // Enroll directly (no key needed)
          await enrollInSectionWithoutKey(user.server_id, parseInt(sectionId));
          navigateToSubjectPage();
        }
      }
    } catch (error) {
      Alert.alert('Enrollment Failed', error.message || 'Please try again');
    }
  };

  const handleConfirmEnroll = async (keyValue) => {
    if (!user?.server_id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      await enrollInSectionWithKey(user.server_id, parseInt(sectionId), keyValue);
      setShowEnroll(false);
      navigateToSubjectPage();
    } catch (error) {
      Alert.alert('Enrollment Failed', error.message || 'Invalid key');
    }
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <View style={[styles.banner, { backgroundColor: accentColor, height: bannerHeight }]}>
        <Ionicons name={iconName} size={56} color="#fff" />
      </View>

      <Spacer height={12} />

      <View
        style={[
          styles.details,
          {
            marginTop: -Math.round(bannerHeight * 0.18),
            borderRadius: 12,
            backgroundColor: theme.background,
            paddingTop: 16,
            paddingBottom: 16,
            shadowRadius: 8,
            overflow: 'hidden',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ThemedText style={styles.title}>{String(name)}</ThemedText>
          {(type === 'section' && requiresEnrollmentKey === 'true') && (
            <Ionicons
              name="key"
              size={18}
              color={theme.notifColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        <Spacer height={8} />
        
        <View style={styles.metaGroup}>
          <View style={styles.metaItem}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary || theme.text }]}>
              {type === 'section' ? 'School Year:' : 'Created at:'}
            </ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {type === 'section' 
                ? String(schoolYear) || '—' 
                : (schoolYear ? schoolYear.split('-')[0] : '—')
              }
            </ThemedText>
          </View>

          <View style={styles.metaItem}>
            <ThemedText style={[styles.metaLabel, { color: theme.textSecondary || theme.text }]}>
              {type === 'section' ? 'Adviser:' : 'Created by:'}
            </ThemedText>
            <ThemedText style={[styles.metaValue, { color: theme.text }]}>
              {String(createdBy) || '—'}
            </ThemedText>
          </View>

          {description ? (
            <View style={styles.metaItem}>
              <ThemedText style={[styles.metaLabel, { color: theme.textSecondary || theme.text }]}>
                Overview:
              </ThemedText>
              <ThemedText style={[styles.metaValue, { color: theme.text }]}>
                {String(description)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      
      <View style={styles.details}>
        <ThemedButton 
          onPress={handlePressEnroll}
          disabled={enrolling}
        >
          {enrolling ? 'Processing...' : 'Enroll Me'}
        </ThemedButton>
      </View>

      <SelfEnrollmentAlert
        visible={showEnroll}
        onClose={() => setShowEnroll(false)}
        onEnroll={handleConfirmEnroll}
      />
      
      <Spacer height={20} />
    </ThemedView>
  );
};

export default SubjectDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  backButton: {
    padding: 6,
    borderRadius: 999,
  },
  banner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    width: '100%',
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 16,
    marginTop: 2,
  },
  metaGroup: {
    gap: 12,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  metaLabel: {
    fontSize: 15,
    fontWeight: '600',
    minWidth: 90,
  },
  metaValue: {
    fontSize: 15,
    flex: 1,
    flexShrink: 1,
  },  
});