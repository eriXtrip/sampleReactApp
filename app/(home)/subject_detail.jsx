import React, { useContext, useLayoutEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

import ThemedView from '../../components/ThemedView';
import ThemedText from '../../components/ThemedText';
import ThemedButton from '../../components/ThemedButton';
import SelfEnrollmentAlert from '../../components/SelfEnrollmentAlert';
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

  const navigation = useNavigation();
  const router = useRouter();
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: true });
  }, [navigation]);

  const { type = 'subject', name = '', createdBy = '', schoolYear = '', requiresEnrollmentKey = '' } = useLocalSearchParams();
  const accentColor = useMemo(() => typeToAccent[type] || typeToAccent.subject, [type]);
  const iconName = useMemo(() => typeToIcon[type] || 'book', [type]);

  const bannerHeight = Math.round(Dimensions.get('window').height * 0.2);

  const [showEnroll, setShowEnroll] = useState(false);

  const handlePressEnroll = () => {
    if (type === 'section') {
      router.push({
        pathname: '/section_page',
        params: {
          name: String(name),
          createdBy: String(createdBy),
          schoolYear: String(schoolYear),
        },
      });
      return;
    }

    if (requiresEnrollmentKey === true || String(requiresEnrollmentKey) === 'true') {
      setShowEnroll(true);
    } else {
      // proceed with enroll flow when no key is required
    }
  };

  const handleConfirmEnroll = (keyValue) => {
    // TODO: validate and submit the key
    setShowEnroll(false);
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      
      {/* Accent banner with centered icon */}
      <View style={[styles.banner, { backgroundColor: accentColor, height: bannerHeight }]}>
        <Ionicons name={iconName} size={56} color="#fff" />
      </View>

      <Spacer height={12} />

      {/* Details */}
        <View
          style={[
            styles.details,
            {
          // pull up to overlap the accent banner
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
            {(requiresEnrollmentKey === 'true' || requiresEnrollmentKey === true) && (
              <Ionicons
              name="key"
              size={18}
              color={theme.notifColor}
              style={{ marginLeft: 8 }}
              />
            )}
            </View>
            <Spacer height={8} />
            <ThemedText style={styles.meta}>School Yr: {String(schoolYear)}</ThemedText>
            <ThemedText style={styles.meta}>Teacher: {String(createdBy)}</ThemedText>
          </View>
          <View style={styles.details}>
        <ThemedButton onPress={handlePressEnroll}>
          Enroll Me
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
});
