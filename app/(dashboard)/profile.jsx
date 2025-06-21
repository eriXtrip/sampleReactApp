import { StyleSheet } from 'react-native'
import { Link } from 'expo-router'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'

const profile = () => {
  return (
    <ThemedView style={styles.container}>
        <ThemedText title={true} style={styles.heading}>
            Your Email
        </ThemedText>
        <Spacer/>

        <ThemedText>Time To Start Your Quest...</ThemedText>
        <Spacer/>

    </ThemedView>
  )
}

export default profile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    heading: {
        fontWeight: "bold",
        fontSize: 18,
        textAlign: "center",
    }
})