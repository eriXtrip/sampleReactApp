import { StyleSheet, Text, View, Image } from 'react-native'
import Logo from '../assets/img/MQuest_light_logo.png'
import {Link} from 'expo-router'
import ThemedView from '../components/ThemedView'

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      <Image source={Logo} style={styles.img}/>
      <Text style={styles.title}>The number one</Text>
      <Text>Reading list App</Text>

      <View style={styles.card}>
        <Text>This is card</Text>
      </View>

      <Link href="/about" style={styles.link}>About</Link>
      <Link href="/contact" style={styles.link}>Contact</Link>
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

  img: {
    width: 100,
    height: 100,
  },

  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  }
})