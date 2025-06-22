import { StyleSheet } from 'react-native'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'

const settings = () => {
  return (
    <ThemedView style={styles.container} safe={true}>
        <ThemedText title={true} style={styles.heading}>
            Settings
        </ThemedText>
        <Spacer/>

    </ThemedView>
  )
}

export default settings

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