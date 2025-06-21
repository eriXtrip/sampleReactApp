import { StyleSheet, useColorScheme, Image } from 'react-native'

import LightLogo from '../assets/img/MQuest_light_logo.png'
import DarkLogo from '../assets/img/MQuest_dark_logo.png'

const ThemedLogo = ({ ...props }) => {
  const colorScheme = useColorScheme()
  const logo = colorScheme === 'dark' ? DarkLogo : LightLogo  

  return (
    <Image source={logo} {...props} style={styles.img}/>
  )
}

export default ThemedLogo

const styles = StyleSheet.create({
    img: {
        width: 100,
        height: 100,
    },

})