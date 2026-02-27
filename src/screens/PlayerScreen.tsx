import React from "react";
import { View, Text, StyleSheet, TouchableOpacity} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { COLORS, FONTS } from "../themes";

export const PlayerScreen = () => {
    const navigation = useNavigation();
    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.text}>PlayerScreen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: FONTS.bold,
  },
});