import { StyleSheet, View, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedText from './ThemedText';

const urlRegex = /(https?:\/\/[^\s]+)/g;

const MessageWithLinks = ({ message, theme }) => {
  const parts = message.split(urlRegex);

  return (
    <Text style={[styles.cardMessage, { color: theme.textColor }]}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <Text
              key={index}
              style={styles.link}
              onPress={() => Linking.openURL(part)}
            >
              {part}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

const card_notif = ({ color, icon, title, message, theme }) => {
  return (
    <View
      style={[
        styles.card,
        {
          borderTopColor: color,
          borderTopWidth: 6,
          borderLeftColor: theme.navBackground,
          borderLeftWidth: 5,
          borderRightColor: theme.navBackground,
          borderRightWidth: 5,
          borderBottomWidth: 0,
          backgroundColor: theme.navBackground,
          shadowColor: theme.tint,
        },
      ]}
    >
      <Ionicons name={icon} size={30} style={[styles.icon, { color: theme.notifColor }]} />
      <View style={styles.textContainer}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>

        {/* Replace plain message with link-detecting text */}
        <MessageWithLinks message={message} theme={theme} />
      </View>
    </View>
  );
};

export default card_notif;

const styles = StyleSheet.create({
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

  link: {
    color: '#2e89ff',
    textDecorationLine: 'underline',
  },
});
