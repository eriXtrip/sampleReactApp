import { StyleSheet, View, FlatList } from 'react-native';
import { useColorScheme } from 'react-native';
import { useContext } from 'react';
import { Ionicons } from '@expo/vector-icons';
import ThemedView from '../../components/ThemedView';
import Spacer from '../../components/Spacer';
import ThemedText from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { ProfileContext } from '../../contexts/ProfileContext';

const notifications = [
  {
    id: '1',
    title: 'Welcome Aboard!',
    message: 'Thanks for joining MQuest!',
    icon: 'hand-left',
    color: '#06d6a0',
  },
  {
    id: '2',
    title: 'Early Bird',
    message: 'You logged in before 7AM!',
    icon: 'alarm',
    color: '#90be6d', // Green
  },
  {
    id: '3',
    title: 'Finished Activity',
    message: 'You completed the Reading Quiz.',
    icon: 'checkmark-done-circle',
    color: '#adb5bd', // Gray
  },
  {
    id: '4',
    title: 'Top Performer',
    message: 'You ranked #1 in Math!',
    icon: 'trophy',
    color: '#f9c74f', // Yellow
  },
  {
    id: '5',
    title: 'Passed Test',
    message: 'You passed your English test!',
    icon: 'flask',
    color: '#9d4edd', // Purple
  },
  {
    id: '6',
    title: 'Profile Updated',
    message: 'Your profile was successfully updated.',
    icon: 'person-circle-outline',
    color: '#4cc9f0',
  },
  {
    id: '7',
    title: 'New Badge Earned',
    message: 'You unlocked the “Fast Learner” badge!',
    icon: 'ribbon',
    color: '#ffb703',
  },
  {
    id: '8',
    title: 'Level Up!',
    message: 'You reached Level 5. Great job!',
    icon: 'rocket',
    color: '#3a86ff',
  },
  {
    id: '9',
    title: 'Homework Reminder',
    message: 'Don’t forget your assignment due tomorrow.',
    icon: 'calendar',
    color: '#ef476f',
  },
  {
    id: '10',
    title: 'Enrolled to Subject',
    message: 'You enrolled in Science Grade 4.',
    icon: 'book',
    color: '#48cae4', // Blue
  },
];

const Notification = () => {
  const colorScheme = useColorScheme();
  const { themeColors } = useContext(ProfileContext);
  const theme = Colors[themeColors === 'system' ? (colorScheme === 'dark' ? 'dark' : 'light') : themeColors];

  const renderItem = ({ item }) => (
    <View style={[styles.card, { 
      borderTopColor: item.color, 
      borderTopWidth: 6, 
      borderLeftColor: theme.navBackground,
      borderLeftWidth: 5,
      borderRightColor: theme.navBackground,
      borderRightWidth: 5,
      borderBottomWidth: 0,
      backgroundColor: theme.navBackground,
      shadowColor: theme.tint,
    }]}>
      <Ionicons name={item.icon} size={30} style={[styles.icon, {color: theme.notifColor}]} />
      <View style={styles.textContainer}>
        <ThemedText style={styles.cardTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.cardMessage}>{item.message}</ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container} safe={true}>
      <Spacer height={20} />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
      <Spacer height={100} />
    </ThemedView>
    
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingVertical: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
    elevation: 10,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  icon: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardMessage: {
    fontSize: 14,
    marginTop: 4,
  },
});
