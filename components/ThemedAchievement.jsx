// components/ThemedAchievement.jsx
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import ThemedText from './ThemedText';

const ThemedAchievement = ({
  iconName = 'trophy',
  iconLibrary = 'FontAwesome',
  iconSize = 32,
  iconColor = '#FFD700',
  title = 'Achievement',
  subtext = 'You earned this!',
  cardStyle,
  badgeStyle,
  titleStyle,
  subtextStyle,
  showConfetti = true,
  IconComponent, 
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;
  const Icon = IconComponent || require('@expo/vector-icons')[iconLibrary];

  return (
    <View style={[styles.achievementCard, cardStyle]}>
      <View style={[styles.achievementBadge, badgeStyle, { borderColor: iconColor }]}>
        <Icon name={iconName} size={iconSize} color={iconColor} />
      </View>
      <ThemedText style={[styles.achievementTitle, titleStyle]}>{title}</ThemedText>
      <ThemedText style={[styles.achievementSubtext, subtextStyle]}>{subtext}</ThemedText>
      {showConfetti && <View style={styles.confettiEffect} />}
    </View>
  );
};

export default ThemedAchievement;

const styles = StyleSheet.create({
  achievementCard: {
    width: '100%',
    maxWidth: 350,
    height: 200,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  achievementBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },
  achievementSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  confettiEffect: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
  },
});