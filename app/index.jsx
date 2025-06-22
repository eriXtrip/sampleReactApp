import { StyleSheet, Text, View, Image } from 'react-native'
import { Link } from 'expo-router'
import ThemedView from '../components/ThemedView'
import ThemedLogo from '../components/ThemedLogo'
import Spacer from '../components/Spacer'
import ThemedText from '../components/ThemedText'

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedLogo />

      <Spacer />
      <ThemedText style={styles.title} title={true}>The number one</ThemedText>

      <Spacer/>
      <ThemedText>Reading list App</ThemedText>

      <View style={styles.card}>
        <Text>This is card</Text>
      </View>

      <Link href="/login" style={styles.link}>
        <ThemedText>Login</ThemedText>
      </Link>
      <Link href="/register" style={styles.link}>
        <ThemedText>Register</ThemedText>
      </Link>
      <Link href="/home" style={styles.link}>
        <ThemedText>Home</ThemedText>
      </Link>
    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontWeight: 'bold',
    fontSize:18,
  },

  card: {
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 5,
    boxShadow: '4px 4px rgba(0,0,0,0.1)',
  },
  
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  }
})