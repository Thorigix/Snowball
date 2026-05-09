import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { mockConfirmDelivery, getCampaignById } from "@/services/mock-data";
import { useEffect } from "react";
import { Campaign } from "@/types";

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await getCampaignById(id ?? "");
      setCampaign(c ?? null);
    })();
  }, [id]);

  const handleScanQR = () => { setQrScanned(true); };

  const handleConfirm = async () => {
    if (!campaign) return;
    setConfirming(true);
    const result = await mockConfirmDelivery(campaign.id);
    setConfirming(false);
    if (result.success) {
      router.push({ pathname: "/success", params: { txHash: result.txHash, type: "delivery", campaignTitle: campaign.title } });
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Delivery Confirmation</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={s.statusCard}>
          <View style={s.statusIcon}>
            <Ionicons name={qrScanned ? "checkmark-circle" : "cube-outline"} size={40} color={qrScanned ? Brand.success : Brand.warning} />
          </View>
          <Text style={s.statusTitle}>{qrScanned ? "QR Verified" : "Awaiting Confirmation"}</Text>
          <Text style={s.statusDesc}>
            {qrScanned
              ? "Delivery code verified. You can now confirm delivery."
              : "Scan the delivery QR code or manually confirm that you received your item."
            }
          </Text>
        </View>

        {/* Campaign Info */}
        {campaign && (
          <View style={s.card}>
            <Text style={s.cardTitle}>{campaign.title}</Text>
            <View style={s.row}><Text style={s.rowLabel}>Seller</Text><Text style={s.rowValue}>{campaign.sellerName}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Your Deposit</Text><Text style={s.rowValue}>{campaign.pricePerUser} {campaign.tokenSymbol}</Text></View>
            <View style={s.row}><Text style={s.rowLabel}>Confirmations</Text><Text style={s.rowValue}>{campaign.confirmationsCount}/{campaign.targetParticipants}</Text></View>
          </View>
        )}

        {/* QR Scan */}
        {!qrScanned && (
          <TouchableOpacity style={s.scanBtn} onPress={handleScanQR} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={22} color={Dark.textInverse} />
            <Text style={s.scanBtnText}>Scan Delivery QR</Text>
          </TouchableOpacity>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[s.confirmBtn, !qrScanned && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          activeOpacity={0.85}
          disabled={!qrScanned || confirming}
        >
          {confirming ? <ActivityIndicator color={Dark.textInverse} /> : (
            <><Ionicons name="checkmark-done" size={20} color={qrScanned ? Dark.textInverse : Dark.textMuted} />
            <Text style={[s.confirmBtnText, !qrScanned && s.confirmBtnTextDisabled]}>Confirm Delivery</Text></>
          )}
        </TouchableOpacity>

        {/* Progress */}
        <View style={s.progressCard}>
          <Text style={s.progressTitle}>Confirmation Progress</Text>
          <View style={s.progBar}><View style={[s.progFill, { width: "33%" }]} /></View>
          <Text style={s.progressDesc}>
            When {campaign ? Math.ceil(campaign.targetParticipants * 0.66) : 2} of {campaign?.targetParticipants ?? 3} buyers confirm delivery, funds will be released to the seller.
          </Text>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Brand.primary} />
          <Text style={s.infoText}>
            If you did not receive your item, do not confirm delivery. Your funds remain safely locked in escrow.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { padding: Spacing.xl },
  statusCard: { alignItems: "center", backgroundColor: Dark.bgCard, borderRadius: Radius.xl, padding: Spacing.xxl, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  statusIcon: { width: 72, height: 72, borderRadius: Radius.full, backgroundColor: "rgba(91, 181, 162,0.08)", justifyContent: "center", alignItems: "center", marginBottom: Spacing.md },
  statusTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.sm },
  statusDesc: { fontSize: Typography.bodySmall, color: Dark.textSecondary, textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  cardTitle: { fontSize: Typography.h4, fontWeight: Typography.semiBold, color: Dark.text, marginBottom: Spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  rowLabel: { fontSize: Typography.bodySmall, color: Dark.textMuted },
  rowValue: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  scanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.secondary, paddingVertical: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.md },
  scanBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.xl },
  confirmBtnDisabled: { backgroundColor: Dark.surface },
  confirmBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  confirmBtnTextDisabled: { color: Dark.textMuted },
  progressCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  progressTitle: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Dark.text, marginBottom: Spacing.md },
  progBar: { height: 8, backgroundColor: Dark.surface, borderRadius: Radius.full, overflow: "hidden", marginBottom: Spacing.sm },
  progFill: { height: "100%", backgroundColor: Brand.primary, borderRadius: Radius.full },
  progressDesc: { fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 18 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.lg, backgroundColor: "rgba(91, 181, 162,0.06)", borderRadius: Radius.md, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.15)" },
  infoText: { flex: 1, fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 18 },
});
