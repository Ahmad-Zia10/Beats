import React from "react";
import { View, Text, StyleSheet} from "react-native";
import { COLORS, FONTS } from "../themes";

export const SettingsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>SettingsScreen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex : 1,
        backgroundColor: COLORS.background,
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    text: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: FONTS.bold,
    }
})