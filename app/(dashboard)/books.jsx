import { StyleSheet } from 'react-native'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'

const books = () => {
  return (
    <ThemedView style={styles.container}>
        
        <Spacer/>
        <ThemedText title={true} style={styles.heading}>
            Subject List
        </ThemedText>
    </ThemedView>
  )
}

export default books

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