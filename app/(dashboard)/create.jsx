import { StyleSheet } from 'react-native'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'

const create = () => {
  return (
    <ThemedView style={styles.container}>
        <ThemedText title={true} style={styles.heading}>
            Settings
        </ThemedText>
        <Spacer/>

    </ThemedView>
  )
}

export default create

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