import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { getCampaignById, mockJoinCampaign } from "@/services/mock-data";
import { useEffect } from "react";
import { Campaign } from "@/types";

export default function JoinCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const c = await getCampaignById(id ?? "");
      setCampaign(c ?? null);
      setLoading(false);
    })();
  }, [id]);

  const handleJoin = async () => {
    if (!campaign) return;
    setJoining(true);
    const result = await mockJoinCampaign(campaign.id);
    setJoining(false);
    if (result.success) {
      router.push({ pathname: "/success", params: { txHash: result.txHash, type: "deposit", campaignTitle: campaign.title } });
    }
  };

  if (loading || !campaign) return (
    <SafeAreaView style={s.container}><View style={s.center}><ActivityIndicator size="large" color={Brand.primary} /></View></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Join Campaign</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Campaign Info */}
        <View style={s.card}>
          <Text style={s.campaignTitle}>{campaign.title}</Text>
          <View style={s.sellerRow}>
            <Ionicons name="storefront-outline" size={14} color={Dark.textSecondary} />
            <Text style={s.seller}>{campaign.sellerName}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={s.card}>
          <Text style={s.label}>DEPOSIT AMOUNT</Text>
          <Text style={s.amount}>{campaign.pricePerUser} <Text style={s.unit}>{campaign.tokenSymbol}</Text></Text>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Token</Text>
            <Text style={s.rowValue}>{campaign.tokenSymbol}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Network</Text>
            <Text style={s.rowValue}>Solana Devnet</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Destination</Text>
            <Text style={s.rowValue}>Escrow PDA</Text>
          </View>
        </View>

        {/* Escrow Info */}
        <View style={s.trustCard}>
          <Ionicons name="shield-checkmark" size={20} color={Brand.primary} />
          <Text style={s.trustText}>
            Your funds will be locked in a Solana escrow program. The seller cannot withdraw until delivery is confirmed.
          </Text>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity style={s.depositBtn} onPress={handleJoin} activeOpacity={0.85} disabled={joining}>
          {joining ? (
            <ActivityIndicator color={Dark.textInverse} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={Dark.textInverse} />
              <Text style={s.depositBtnText}>Deposit to Escrow</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          By depositing, you agree to the group buy terms. Funds will be released to the seller only after delivery confirmation by the majority of buyers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { padding: Spacing.xl },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  campaignTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.sm },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  seller: { fontSize: Typography.bodySmall, color: Dark.textSecondary },
  label: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  amount: { fontSize: 36, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.md },
  unit: { fontSize: Typography.h3, color: Brand.primary },
  divider: { height: 1, backgroundColor: Dark.border, marginVertical: Spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  rowLabel: { fontSize: Typography.bodySmall, color: Dark.textMuted },
  rowValue: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  trustCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, backgroundColor: "rgba(0,229,160,0.06)", borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: "rgba(0,229,160,0.15)", marginBottom: Spacing.xl },
  trustText: { flex: 1, fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 18 },
  depositBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.lg },
  depositBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  disclaimer: { fontSize: Typography.caption, color: Dark.textMuted, textAlign: "center", lineHeight: 18 },
});
