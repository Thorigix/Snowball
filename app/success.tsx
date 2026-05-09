import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { getExplorerTxUrl } from "@/constants/config";

export default function SuccessScreen() {
  const { txHash, type, campaignTitle } = useLocalSearchParams<{
    txHash: string;
    type: string;
    campaignTitle: string;
  }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!txHash) return;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(txHash);
      } else {
        const Clipboard = require("react-native").Clipboard;
        Clipboard?.setString?.(txHash);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isDelivery = type === "delivery";
  const isDemoTx = typeof txHash === "string" && txHash.startsWith("demo-");
  const title = isDelivery ? "Delivery Confirmed!" : "Deposit Successful!";
  const message = isDelivery
    ? "You confirmed delivery for this campaign. When enough buyers confirm, funds will be released to the seller."
    : "You joined the group buy. Your funds are now locked in Solana escrow until delivery confirmation.";

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.content}>
        {/* Success Icon */}
        <View style={s.iconWrap}>
          <View style={s.iconCircle}>
            <Ionicons name="checkmark-circle" size={64} color={Brand.success} />
          </View>
        </View>

        <Text style={s.title}>{title}</Text>
        <Text style={s.message}>{message}</Text>

        {campaignTitle && (
          <View style={s.campaignBadge}>
            <Ionicons name="layers-outline" size={16} color={Brand.primary} />
            <Text style={s.campaignName}>{campaignTitle}</Text>
          </View>
        )}

        {/* Transaction Info */}
        {txHash && (
          <View style={s.txCard}>
            <View style={s.txHeaderRow}>
              <Text style={s.txLabel}>
                {isDemoTx ? "DEMO BACKEND EVENT ID" : "TRANSACTION HASH"}
              </Text>
              <TouchableOpacity onPress={handleCopy} activeOpacity={0.7} style={s.copyBtn}>
                <Ionicons
                  name={copied ? "checkmark-outline" : "copy-outline"}
                  size={14}
                  color={copied ? Brand.success : Dark.textSecondary}
                />
                <Text style={[s.copyText, copied && { color: Brand.success }]}>
                  {copied ? "Copied" : "Copy"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={s.txHash} numberOfLines={1}>{txHash}</Text>
            {isDemoTx ? (
              <Text style={s.demoTxNote}>
                Demo mode uses backend campaign state. On-chain signing is the next integration step.
              </Text>
            ) : (
              <TouchableOpacity
                style={s.explorerBtn}
                onPress={() => Linking.openURL(getExplorerTxUrl(txHash ?? ""))}
                activeOpacity={0.85}
              >
                <Ionicons name="open-outline" size={16} color={Brand.solana} />
                <Text style={s.explorerText}>View on Solana Explorer</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.replace("/(tabs)")} activeOpacity={0.85}>
            <Ionicons name="home-outline" size={20} color={Dark.textInverse} />
            <Text style={s.primaryBtnText}>Back to Campaigns</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  content: { flex: 1, justifyContent: "center", padding: Spacing.xxl },
  iconWrap: { alignItems: "center", marginBottom: Spacing.xl },
  iconCircle: { width: 100, height: 100, borderRadius: Radius.full, backgroundColor: "rgba(91, 181, 162,0.1)", justifyContent: "center", alignItems: "center" },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Dark.text, textAlign: "center", marginBottom: Spacing.md },
  message: { fontSize: Typography.bodySmall, color: Dark.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xl },
  campaignBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Dark.bgCard, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignSelf: "center", borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  campaignName: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  txCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  txHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  txLabel: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { fontSize: Typography.tiny, color: Dark.textSecondary, fontWeight: Typography.semiBold, letterSpacing: 0.5 },
  txHash: { fontSize: Typography.caption, color: Dark.text, fontFamily: "monospace", marginBottom: Spacing.md },
  explorerBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  explorerText: { fontSize: Typography.bodySmall, color: Brand.solana, fontWeight: Typography.medium },
  demoTxNote: { fontSize: Typography.caption, color: Dark.textMuted, lineHeight: 18 },
  actions: { gap: Spacing.md },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md },
  primaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
});
