import { StyleSheet } from 'react-native'

import ThemedView from '../../components/ThemedView'
import Spacer from '../../components/Spacer'
import ThemedText from '../../components/ThemedText'

const subjectlist = () => {
  return (
    <ThemedView style={styles.container} safe={true}>
        
        <Spacer/>
        <ThemedText title={true} style={styles.heading}>
            Subjects List
        </ThemedText>
    </ThemedView>
  )
}

export default subjectlist

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