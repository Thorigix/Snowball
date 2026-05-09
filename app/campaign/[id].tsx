import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius, Shadows, StatusColors } from "@/constants/theme";
import { useCampaign } from "@/hooks/use-mock-store";
import DemoControls from "@/components/DemoControls";
import { goBackOrHome } from "@/hooks/use-safe-back";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const campaign = useCampaign(id);

  if (!campaign) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><Text style={s.errText}>Campaign not found</Text></View>
    </SafeAreaView>
  );

  const prog = campaign.targetParticipants > 0 ? campaign.currentParticipants / campaign.targetParticipants : 0;
  const diff = new Date(campaign.deadline).getTime() - Date.now();
  const timeLeft = diff <= 0 ? "Expired" : `${Math.floor(diff/86400000)}d ${Math.floor((diff%86400000)/3600000)}h left`;
  const sc = StatusColors[campaign.status] ?? StatusColors.OPEN;
  const riskScore = campaign.status === "OPEN" ? 72 : campaign.status === "RELEASED" ? 94 : 84;
  const riskTone = riskScore >= 85 ? Brand.success : Brand.warning;
  const missingBuyers = Math.max(0, campaign.targetParticipants - campaign.currentParticipants);
  const neededConfirmations = Math.max(
    0,
    Math.ceil(campaign.targetParticipants * 0.66) - campaign.confirmationsCount
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => goBackOrHome(router)}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Campaign Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroImg}>
            <Ionicons name="hardware-chip" size={48} color={Brand.primary} />
          </View>
          <View style={s.heroTitleRow}>
            <Text style={s.heroTitle}>{campaign.title}</Text>
            <View style={s.badgeStack}>
              {campaign.userJoined ? (
                <View style={[s.badge, s.joinedBadge]}>
                  <Text style={[s.badgeText, s.joinedBadgeText]}>JOINED</Text>
                </View>
              ) : null}
              <View style={[s.badge, { backgroundColor: sc.bg }]}>
                <Text style={[s.badgeText, { color: sc.text }]}>{campaign.status}</Text>
              </View>
            </View>
          </View>
          <View style={s.sellerRow}>
            <Ionicons name="storefront-outline" size={14} color={Dark.textSecondary} />
            <Text style={s.sellerName}>{campaign.sellerName}</Text>
          </View>
        </View>

        <Text style={s.desc}>{campaign.description}</Text>

        {/* Progress */}
        <View style={s.card}>
          <Text style={s.label}>FUNDING PROGRESS</Text>
          <View style={s.progBar}><View style={[s.progFill, { width: `${prog*100}%` }]} /></View>
          <View style={s.progRow}>
            <Text style={s.progText}><Text style={s.progHi}>{campaign.currentParticipants}</Text> / {campaign.targetParticipants} buyers</Text>
            <Text style={s.timeText}>{timeLeft}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          {[
            { l: "Per Buyer", v: `${campaign.pricePerUser} ${campaign.tokenSymbol}` },
            { l: "Total Target", v: `${campaign.totalRequiredAmount} ${campaign.tokenSymbol}` },
            { l: "Deposited", v: `${campaign.totalDeposited} ${campaign.tokenSymbol}` },
            { l: "Confirmations", v: `${campaign.confirmationsCount}/${campaign.targetParticipants}` },
          ].map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statLabel}>{st.l}</Text>
              <Text style={s.statValue}>{st.v}</Text>
            </View>
          ))}
        </View>

        {/* Trust */}
        <View style={s.trustCard}>
          <Ionicons name="shield-checkmark" size={24} color={Brand.primary} />
          <Text style={s.trustTitle}>Escrow Protection</Text>
          <Text style={s.trustDesc}>
            Your funds are locked in a Solana escrow program. The seller cannot withdraw until {Math.ceil(campaign.targetParticipants*0.66)} of {campaign.targetParticipants} buyers confirm delivery.
          </Text>
        </View>

        <View style={s.riskCard}>
          <View style={s.riskHeader}>
            <View>
              <Text style={s.label}>AI RISK REPORT</Text>
              <Text style={s.riskTitle}>Buyer safety score</Text>
            </View>
            <View style={[s.riskScore, { borderColor: riskTone }]}>
              <Text style={[s.riskScoreText, { color: riskTone }]}>{riskScore}</Text>
            </View>
          </View>
          <View style={s.riskRows}>
            <RiskRow
              icon="people-outline"
              label="Group readiness"
              value={missingBuyers === 0 ? "Target filled" : `${missingBuyers} buyer(s) still needed`}
            />
            <RiskRow
              icon="storefront-outline"
              label="Seller release risk"
              value={neededConfirmations === 0 ? "Release threshold met" : `${neededConfirmations} confirmation(s) before release`}
            />
            <RiskRow
              icon="lock-closed-outline"
              label="Fund custody"
              value={campaign.campaignPda ? "On-chain escrow PDA available" : "Escrow PDA pending backend sync"}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {campaign.status === "OPEN" && (
            <>
              <TouchableOpacity
                style={[s.primaryBtn, campaign.userJoined && s.primaryBtnDisabled]}
                onPress={() => router.push(`/join/${campaign.id}`)}
                activeOpacity={0.85}
                disabled={campaign.userJoined}
              >
                <Ionicons
                  name={campaign.userJoined ? "checkmark-circle" : "flash"}
                  size={20}
                  color={campaign.userJoined ? Brand.success : Dark.textInverse}
                />
                <Text
                  style={[
                    s.primaryBtnText,
                    campaign.userJoined && s.primaryBtnTextDisabled,
                  ]}
                >
                  {campaign.userJoined ? "Already Joined" : "Join Campaign"}
                </Text>
              </TouchableOpacity>
              {!campaign.userJoined ? (
                <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push(`/funding/${campaign.id}`)} activeOpacity={0.85}>
                  <Ionicons name="swap-horizontal" size={20} color={Brand.lifi} />
                  <Text style={s.secondaryBtnText}>Fund from Another Chain</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
          {(campaign.status === "SHIPPED" || campaign.status === "DELIVERY_REVIEW") && (
            <TouchableOpacity style={s.primaryBtn} onPress={() => router.push(`/delivery/${campaign.id}`)} activeOpacity={0.85}>
              <Ionicons name="checkmark-circle" size={20} color={Dark.textInverse} />
              <Text style={s.primaryBtnText}>Confirm Delivery</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.aiBtn} onPress={() => router.push({ pathname: "/(tabs)/ai", params: { campaignId: campaign.id } })} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={20} color={Brand.primary} />
            <Text style={s.aiBtnText}>Ask AI Assistant</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
      <DemoControls focusCampaignId={campaign.id} />
    </SafeAreaView>
  );
}

function RiskRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={s.riskRow}>
      <Ionicons name={icon} size={15} color={Brand.primary} />
      <View style={{ flex: 1 }}>
        <Text style={s.riskRowLabel}>{label}</Text>
        <Text style={s.riskRowValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errText: { color: Dark.textSecondary, fontSize: Typography.body },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { padding: Spacing.xl },
  heroCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg, ...Shadows.card },
  heroImg: { width: "100%", height: 120, borderRadius: Radius.lg, backgroundColor: "rgba(91, 181, 162,0.06)", justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg },
  heroTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  heroTitle: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Dark.text, flex: 1, marginRight: Spacing.md },
  badgeStack: { alignItems: "flex-end", gap: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  badgeText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, textTransform: "uppercase", letterSpacing: 0.5 },
  joinedBadge: { backgroundColor: "rgba(91, 181, 162,0.15)" },
  joinedBadgeText: { color: Brand.success },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sellerName: { fontSize: Typography.bodySmall, color: Dark.textSecondary },
  desc: { fontSize: Typography.bodySmall, color: Dark.textSecondary, lineHeight: 22, marginBottom: Spacing.lg },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  label: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8, marginBottom: Spacing.md },
  progBar: { height: 8, backgroundColor: Dark.surface, borderRadius: Radius.full, overflow: "hidden", marginBottom: Spacing.sm },
  progFill: { height: "100%", backgroundColor: Brand.primary, borderRadius: Radius.full },
  progRow: { flexDirection: "row", justifyContent: "space-between" },
  progText: { fontSize: Typography.caption, color: Dark.textSecondary },
  progHi: { color: Brand.primary, fontWeight: Typography.semiBold },
  timeText: { fontSize: Typography.caption, color: Dark.textMuted },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { width: "47%", backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border },
  statLabel: { fontSize: Typography.tiny, color: Dark.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.xs },
  statValue: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Dark.text },
  trustCard: { backgroundColor: "rgba(91, 181, 162,0.06)", borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.15)", alignItems: "center", marginBottom: Spacing.xl },
  trustTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.primary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  trustDesc: { fontSize: Typography.caption, color: Dark.textSecondary, textAlign: "center", lineHeight: 18 },
  riskCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  riskTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  riskScore: { width: 52, height: 52, borderRadius: Radius.full, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: Dark.surface },
  riskScoreText: { fontSize: Typography.h3, fontWeight: Typography.bold },
  riskRows: { gap: Spacing.sm },
  riskRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Dark.border },
  riskRowLabel: { fontSize: Typography.caption, color: Dark.textMuted, marginBottom: 2 },
  riskRowValue: { fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 17 },
  actions: { gap: Spacing.md },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md },
  primaryBtnDisabled: { backgroundColor: Dark.bgCard, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.25)" },
  primaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  primaryBtnTextDisabled: { color: Brand.success },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: "rgba(155, 127, 204,0.1)", paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: "rgba(155, 127, 204,0.25)" },
  secondaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.lifi },
  aiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Dark.bgCard, paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Dark.border },
  aiBtnText: { fontSize: Typography.body, fontWeight: Typography.medium, color: Dark.text },
});
