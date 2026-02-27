import React from "react";
import { View, Text, StyleSheet} from "react-native";
import { COLORS, FONTS } from "../themes";

export const PlaylistsScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>PlaylistScreen</Text>
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