import React from "react";
import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";

export default function AssistantScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>AI Assistant</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="sparkles" size={48} color={Brand.primary} />
        </View>
        <Text style={s.title}>Snowball AI</Text>
        <Text style={s.desc}>
          Use the AI tab at the bottom to chat with the Snowball assistant about
          campaigns, escrow protection, LI.FI routes, and more.
        </Text>
        <TouchableOpacity style={s.btn} onPress={() => router.replace("/(tabs)/ai")} activeOpacity={0.85}>
          <Ionicons name="chatbubbles-outline" size={20} color={Dark.textInverse} />
          <Text style={s.btnText}>Open AI Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: Spacing.xxl },
  iconWrap: { width: 80, height: 80, borderRadius: Radius.full, backgroundColor: "rgba(0,229,160,0.1)", justifyContent: "center", alignItems: "center", marginBottom: Spacing.xl },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.md },
  desc: { fontSize: Typography.bodySmall, color: Dark.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xxl },
  btn: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, borderRadius: Radius.md },
  btnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
});
