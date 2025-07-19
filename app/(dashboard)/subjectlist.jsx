import { StyleSheet, View, Image, FlatList, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';

import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const SUBJECTS = [
  { id: '1', icon: require('../../assets/icons/english_.png'), title: 'English', grade: 'Grade 4', downloaded: false },
  { id: '2', icon: require('../../assets/icons/filipino_.png'), title: 'Filipino', grade: 'Grade 4', downloaded: true },
  { id: '3', icon: require('../../assets/icons/math_.png'), title: 'Math', grade: 'Grade 4', downloaded: false },
  { id: '4', icon: require('../../assets/icons/saturn_.png'), title: 'Science', grade: 'Grade 4', downloaded: true },
];

const SubjectList = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const renderItem = ({ item }) => (
    <TouchableOpacity>
      <View style={[styles.subjectBox, { backgroundColor: theme.background, borderColor: theme.cardBorder }]}>
        <Image source={item.icon} style={styles.icon} />
        <View style={styles.textContainer}>
          <ThemedText style={[styles.subjectTitle, { color: theme.text }]}>{item.title}</ThemedText>
          <ThemedText style={[styles.subjectGrade, { color: theme.text }]}>{item.grade}</ThemedText>
        </View>
        <Ionicons
          name={item.downloaded ? 'checkmark-circle-outline' : 'arrow-down-circle-outline'}
          size={40}
          color={item.downloaded ? 'green' : theme.text}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container} safe={true}>
      <Spacer height={20} />
      <FlatList
        data={SUBJECTS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

export default SubjectList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  subjectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 16,
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1, // Pushes icon to the right
  },
  subjectTitle: {
    fontSize: 25,
    fontWeight: 'bold',
  },
  subjectGrade: {
    fontSize: 14,
    opacity: 0.6,
  },
});
