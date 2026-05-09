import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { getExplorerAddressUrl, getExplorerTxUrl } from "@/constants/config";

export default function SuccessScreen() {
  const { txHash, type, campaignTitle, amount, token, escrowPda, buyerWallet, status } = useLocalSearchParams<{
    txHash: string;
    type: string;
    campaignTitle: string;
    amount?: string;
    token?: string;
    escrowPda?: string;
    buyerWallet?: string;
    status?: string;
  }>();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!txHash) return;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(txHash);
      } else if (Platform.OS !== "web") {
        return;
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isDelivery = type === "delivery";
  const isDispute = type === "dispute";
  const isRefund = type === "refund";
  const isDemoTx =
    typeof txHash === "string" &&
    (txHash.startsWith("demo-") || isDispute || isRefund);
  const title = isDispute
    ? "Dispute Raised"
    : isRefund
      ? "Refund Recorded"
      : isDelivery
        ? "Delivery Confirmed!"
        : "Deposit Successful!";
  const message = isDispute
    ? "Seller release is now blocked while the dispute is reviewed. The demo refund path is visible from seller controls."
    : isRefund
      ? "A buyer refund was recorded and the disputed release path is closed."
      : isDelivery
    ? "You confirmed delivery for this campaign. When enough buyers confirm, funds will be released to the seller."
    : "You joined the group buy. Your funds are now locked in Solana escrow until delivery confirmation.";
  const iconName = isDispute
    ? "alert-circle"
    : isRefund
      ? "return-down-back"
      : "checkmark-circle";
  const iconColor = isDispute || isRefund ? Brand.danger : Brand.success;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={s.iconWrap}>
          <View style={[s.iconCircle, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={iconName as any} size={64} color={iconColor} />
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

        <View style={s.proofCard}>
          <View style={s.proofHeader}>
            <View>
              <Text style={s.txLabel}>TRANSACTION RECEIPT</Text>
              <Text style={s.proofTitle}>Escrow proof card</Text>
            </View>
            <Ionicons name="receipt-outline" size={22} color={Brand.primary} />
          </View>
          <ReceiptRow label="Amount" value={amount && token ? `${amount} ${token}` : "Not provided"} />
          <ReceiptRow
            label="Escrow PDA"
            value={escrowPda || (isDemoTx ? "Not available for this demo event" : "Pending backend sync")}
            mono={!!escrowPda}
          />
          <ReceiptRow label="Buyer wallet" value={buyerWallet || "Demo buyer"} mono />
          <ReceiptRow label="Status" value={status || (isDelivery ? "DELIVERY_REVIEW" : "LOCKED")} />
          {escrowPda ? (
            <TouchableOpacity
              style={s.addressExplorerBtn}
              onPress={() => Linking.openURL(getExplorerAddressUrl(escrowPda))}
              activeOpacity={0.85}
            >
              <Ionicons name="open-outline" size={15} color={Brand.solana} />
              <Text style={s.explorerText}>Open Escrow PDA</Text>
            </TouchableOpacity>
          ) : null}
        </View>

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
              <View style={s.demoBadge}>
                <Ionicons name="desktop-outline" size={14} color={Brand.warning} />
                <Text style={s.demoTxNote}>Local demo event, not on-chain.</Text>
              </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const display =
    mono && value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-8)}` : value;

  return (
    <View style={s.receiptRow}>
      <Text style={s.receiptLabel}>{label}</Text>
      <Text style={[s.receiptValue, mono && s.receiptMono]} numberOfLines={1}>
        {display}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  content: { flexGrow: 1, justifyContent: "center", padding: Spacing.xxl },
  iconWrap: { alignItems: "center", marginBottom: Spacing.xl },
  iconCircle: { width: 100, height: 100, borderRadius: Radius.full, backgroundColor: "rgba(91, 181, 162,0.1)", justifyContent: "center", alignItems: "center" },
  title: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Dark.text, textAlign: "center", marginBottom: Spacing.md },
  message: { fontSize: Typography.bodySmall, color: Dark.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: Spacing.xl },
  campaignBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Dark.bgCard, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignSelf: "center", borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  campaignName: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  proofCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: `${Brand.primary}30`, marginBottom: Spacing.lg },
  proofHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: Spacing.md, marginBottom: Spacing.md },
  proofTitle: { color: Dark.text, fontSize: Typography.body, fontWeight: Typography.semiBold, marginTop: 4 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Dark.border },
  receiptLabel: { color: Dark.textMuted, fontSize: Typography.caption },
  receiptValue: { flex: 1, textAlign: "right", color: Dark.text, fontSize: Typography.caption, fontWeight: Typography.semiBold },
  receiptMono: { fontFamily: "monospace" },
  addressExplorerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: "rgba(168, 124, 219,0.08)", borderWidth: 1, borderColor: "rgba(168, 124, 219,0.24)", borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  txCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  txHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  txLabel: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8 },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  copyText: { fontSize: Typography.tiny, color: Dark.textSecondary, fontWeight: Typography.semiBold, letterSpacing: 0.5 },
  txHash: { fontSize: Typography.caption, color: Dark.text, fontFamily: "monospace", marginBottom: Spacing.md },
  explorerBtn: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  explorerText: { fontSize: Typography.bodySmall, color: Brand.solana, fontWeight: Typography.medium },
  demoTxNote: { fontSize: Typography.caption, color: Dark.textMuted, lineHeight: 18 },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, backgroundColor: `${Brand.warning}12`, borderWidth: 1, borderColor: `${Brand.warning}35`, borderRadius: Radius.md, padding: Spacing.sm },
  actions: { gap: Spacing.md },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md },
  primaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
});
