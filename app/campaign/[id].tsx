import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius, Shadows, StatusColors } from "@/constants/theme";
import { useCampaign } from "@/hooks/use-mock-store";
import DemoControls from "@/components/DemoControls";
import { goBackOrHome } from "@/hooks/use-safe-back";
import { getConfirmationThreshold, mockRaiseDispute } from "@/services/mock-data";
import type { Campaign } from "@/types";
import { getSellerReputation } from "@/constants/sellers";

function buildAiRiskReport(campaign: Campaign) {
  const threshold = getConfirmationThreshold(campaign.targetParticipants);
  const missingBuyers = Math.max(0, campaign.targetParticipants - campaign.currentParticipants);
  const neededConfirmations = Math.max(0, threshold - campaign.confirmationsCount);
  const fundedRatio =
    campaign.targetParticipants > 0
      ? campaign.currentParticipants / campaign.targetParticipants
      : 0;
  const hasEscrow = !!campaign.campaignPda;
  const hasDisputes = campaign.disputesCount > 0;

  let score = 70 + Math.round(fundedRatio * 12);
  if (hasEscrow) score += 6;
  if (missingBuyers === 0) score += 4;
  if (campaign.status === "RELEASED") score += 8;
  if (hasDisputes) score -= 18;
  score = Math.max(35, Math.min(96, score));

  let summary: string;
  if (hasDisputes) {
    summary = `${campaign.disputesCount} dispute signal detected. Keep funds locked until the seller and buyers resolve delivery evidence.`;
  } else if (campaign.status === "OPEN") {
    summary = `${campaign.currentParticipants}/${campaign.targetParticipants} buyers funded, seller cannot withdraw, ${missingBuyers} more deposit${missingBuyers === 1 ? "" : "s"} needed.`;
  } else if (campaign.status === "FUNDED") {
    summary = `The group is fully funded with ${campaign.totalDeposited} ${campaign.tokenSymbol} locked. Seller can ship, but cannot withdraw before buyer confirmations.`;
  } else if (campaign.status === "SHIPPED" || campaign.status === "DELIVERY_REVIEW") {
    summary =
      neededConfirmations === 0
        ? `${campaign.confirmationsCount}/${threshold} confirmations received. Escrow is release-ready.`
        : `Shipment is marked. ${campaign.confirmationsCount}/${threshold} confirmations received, ${neededConfirmations} more needed before seller release.`;
  } else if (campaign.status === "RELEASED") {
    summary = `Funds were released after the confirmation threshold. This campaign is complete and auditable.`;
  } else if (campaign.status === "REFUNDED") {
    summary = `A buyer refund was recorded. Seller release stayed blocked until the dispute path completed.`;
  } else {
    summary = `Escrow state is ${campaign.status}. Buyers should follow the release rule before seller payment.`;
  }

  return {
    score,
    tone: score >= 85 ? Brand.success : score >= 65 ? Brand.warning : Brand.danger,
    summary,
    missingBuyers,
    neededConfirmations,
    threshold,
  };
}

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const campaign = useCampaign(id);
  const [disputing, setDisputing] = useState(false);

  if (!campaign) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><Text style={s.errText}>Campaign not found</Text></View>
    </SafeAreaView>
  );

  const prog = campaign.targetParticipants > 0 ? campaign.currentParticipants / campaign.targetParticipants : 0;
  const diff = new Date(campaign.deadline).getTime() - Date.now();
  const timeLeft = diff <= 0 ? "Expired" : `${Math.floor(diff/86400000)}d ${Math.floor((diff%86400000)/3600000)}h left`;
  const sc = StatusColors[campaign.status] ?? StatusColors.OPEN;
  const risk = buildAiRiskReport(campaign);
  const sellerRep = getSellerReputation(campaign.sellerName);

  const handleRaiseDispute = () => {
    if (disputing) return;
    Alert.alert(
      "Raise dispute?",
      "This blocks seller release and opens the refund path in demo state.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Raise Dispute",
          style: "destructive",
          onPress: async () => {
            setDisputing(true);
            const result = await mockRaiseDispute(campaign.id);
            setDisputing(false);
            if (result.success) {
              router.replace({
                pathname: "/success",
                params: {
                  txHash: result.txHash,
                  type: "dispute",
                  campaignTitle: campaign.title,
                  amount: campaign.pricePerUser,
                  token: campaign.tokenSymbol,
                  escrowPda: campaign.campaignPda ?? "",
                  status: "DISPUTED",
                },
              });
            } else {
              Alert.alert("Cannot dispute", result.error ?? "Unknown error");
            }
          },
        },
      ]
    );
  };

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
          <View style={s.heroIconRow}>
            <View style={s.heroImg}>
              <Ionicons name="hardware-chip" size={34} color={Brand.primary} />
            </View>
            <View style={s.heroMetaBlock}>
              <Text style={s.heroEyebrow}>LIVE GROUP BUY</Text>
              <Text style={s.heroMetaText}>Protected by Solana escrow</Text>
            </View>
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
            {sellerRep.verified ? (
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color={Brand.success} />
                <Text style={s.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Text style={s.desc}>{campaign.description}</Text>

        <View style={s.reputationCard}>
          <View style={s.reputationTop}>
            <View>
              <Text style={s.label}>SELLER REPUTATION</Text>
              <Text style={s.reputationTitle}>{sellerRep.verification}</Text>
            </View>
            <Ionicons name="shield-checkmark-outline" size={22} color={Brand.success} />
          </View>
          <View style={s.reputationGrid}>
            <MiniMetric label="Fulfilled" value={`${sellerRep.fulfilledOrders}`} />
            <MiniMetric label="Dispute rate" value={sellerRep.disputeRate} />
            <MiniMetric label="Delivery SLA" value={sellerRep.deliverySla} />
          </View>
        </View>

        {/* Progress */}
        <View style={s.card}>
          <View style={s.progressHeader}>
            <View>
              <Text style={s.label}>FUNDING PROGRESS</Text>
              <Text style={s.progressTitle}>{Math.round(prog * 100)}% funded</Text>
            </View>
            <Text style={s.timeText}>{timeLeft}</Text>
          </View>
          <View style={s.progBar}><View style={[s.progFill, { width: `${prog*100}%` }]} /></View>
          <View style={s.progRow}>
            <Text style={s.progText}><Text style={s.progHi}>{campaign.currentParticipants}</Text> / {campaign.targetParticipants} buyers</Text>
            <Text style={s.progText}>{campaign.totalDeposited} {campaign.tokenSymbol} locked</Text>
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
          <View style={s.trustIcon}>
            <Ionicons name="shield-checkmark" size={22} color={Brand.primary} />
          </View>
          <View style={s.trustCopy}>
            <Text style={s.trustTitle}>Escrow Protection</Text>
            <Text style={s.trustDesc}>
              Your funds are locked in a Solana escrow program. The seller cannot withdraw until {risk.threshold} of {campaign.targetParticipants} buyers confirm delivery.
            </Text>
          </View>
        </View>

        <View style={s.usdcCard}>
          <View style={s.usdcIcon}>
            <Ionicons name="cash-outline" size={20} color={Brand.solana} />
          </View>
          <View style={s.usdcCopy}>
            <Text style={s.usdcTitle}>Production asset: USDC vault</Text>
            <Text style={s.usdcDesc}>
              Demo uses devnet SOL for speed. Production milestone is an SPL USDC vault with token-account accounting and refund-safe settlement.
            </Text>
          </View>
        </View>

        <View style={s.riskCard}>
          <View style={s.riskHeader}>
            <View>
              <Text style={s.label}>AI RISK REPORT</Text>
              <Text style={s.riskTitle}>Buyer safety score</Text>
            </View>
            <View style={[s.riskScore, { borderColor: risk.tone }]}>
              <Text style={[s.riskScoreText, { color: risk.tone }]}>{risk.score}</Text>
            </View>
          </View>
          <View style={s.riskNarrative}>
            <Ionicons name="sparkles-outline" size={16} color={Brand.primary} />
            <Text style={s.riskNarrativeText}>{risk.summary}</Text>
          </View>
          <View style={s.riskRows}>
            <RiskRow
              icon="people-outline"
              label="Group readiness"
              value={risk.missingBuyers === 0 ? "Target filled" : `${risk.missingBuyers} buyer(s) still needed`}
            />
            <RiskRow
              icon="storefront-outline"
              label="Seller release risk"
              value={risk.neededConfirmations === 0 ? "Release threshold met" : `${risk.neededConfirmations} confirmation(s) before release`}
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
            <>
              <TouchableOpacity style={s.primaryBtn} onPress={() => router.push(`/delivery/${campaign.id}`)} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle" size={20} color={Dark.textInverse} />
                <Text style={s.primaryBtnText}>Confirm Delivery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.disputeBtn}
                onPress={handleRaiseDispute}
                activeOpacity={0.85}
                disabled={disputing}
              >
                {disputing ? (
                  <ActivityIndicator color={Brand.danger} />
                ) : (
                  <>
                    <Ionicons name="alert-circle-outline" size={20} color={Brand.danger} />
                    <Text style={s.disputeBtnText}>Raise Dispute</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.miniMetric}>
      <Text style={s.miniMetricValue}>{value}</Text>
      <Text style={s.miniMetricLabel}>{label}</Text>
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
  heroCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg, ...Shadows.card },
  heroIconRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.lg },
  heroImg: { width: 58, height: 58, borderRadius: Radius.md, backgroundColor: "rgba(91, 181, 162,0.10)", justifyContent: "center", alignItems: "center" },
  heroMetaBlock: { flex: 1 },
  heroEyebrow: { fontSize: Typography.tiny, color: Brand.primary, fontWeight: Typography.bold, letterSpacing: 0.8, marginBottom: 4 },
  heroMetaText: { fontSize: Typography.caption, color: Dark.textSecondary },
  heroTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: Spacing.sm },
  heroTitle: { fontSize: Typography.h2, fontWeight: Typography.bold, color: Dark.text, flex: 1, marginRight: Spacing.md, lineHeight: 30 },
  badgeStack: { alignItems: "flex-end", gap: Spacing.xs },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.sm },
  badgeText: { fontSize: Typography.tiny, fontWeight: Typography.semiBold, textTransform: "uppercase", letterSpacing: 0.5 },
  joinedBadge: { backgroundColor: "rgba(91, 181, 162,0.15)" },
  joinedBadgeText: { color: Brand.success },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sellerName: { fontSize: Typography.bodySmall, color: Dark.textSecondary },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${Brand.success}14`, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  verifiedText: { color: Brand.success, fontSize: Typography.tiny, fontWeight: Typography.semiBold },
  desc: { fontSize: Typography.bodySmall, color: Dark.textSecondary, lineHeight: 23, marginBottom: Spacing.lg },
  reputationCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  reputationTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: Spacing.md, marginBottom: Spacing.md },
  reputationTitle: { color: Dark.text, fontSize: Typography.body, fontWeight: Typography.semiBold },
  reputationGrid: { flexDirection: "row", gap: Spacing.sm },
  miniMetric: { flex: 1, backgroundColor: Dark.surface, borderRadius: Radius.sm, padding: Spacing.sm, minHeight: 58, justifyContent: "center" },
  miniMetricValue: { color: Dark.text, fontSize: Typography.bodySmall, fontWeight: Typography.bold },
  miniMetricLabel: { color: Dark.textMuted, fontSize: Typography.tiny, marginTop: 4 },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  label: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8, marginBottom: Spacing.xs },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: Spacing.md, marginBottom: Spacing.md },
  progressTitle: { fontSize: Typography.h4, color: Dark.text, fontWeight: Typography.bold },
  progBar: { height: 8, backgroundColor: Dark.surface, borderRadius: Radius.full, overflow: "hidden", marginBottom: Spacing.sm },
  progFill: { height: "100%", backgroundColor: Brand.primary, borderRadius: Radius.full },
  progRow: { flexDirection: "row", justifyContent: "space-between" },
  progText: { fontSize: Typography.caption, color: Dark.textSecondary },
  progHi: { color: Brand.primary, fontWeight: Typography.semiBold },
  timeText: { fontSize: Typography.caption, color: Dark.textSecondary, marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.lg },
  statCard: { flexGrow: 1, flexBasis: "45%", backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, minHeight: 84, justifyContent: "center" },
  statLabel: { fontSize: Typography.tiny, color: Dark.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.xs },
  statValue: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Dark.text },
  trustCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, backgroundColor: "rgba(91, 181, 162,0.07)", borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.18)", marginBottom: Spacing.xl },
  trustIcon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: "rgba(91, 181, 162,0.12)", alignItems: "center", justifyContent: "center" },
  trustCopy: { flex: 1 },
  trustTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.primary, marginBottom: Spacing.xs },
  trustDesc: { fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 19 },
  usdcCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, backgroundColor: "rgba(168, 124, 219,0.08)", borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: "rgba(168, 124, 219,0.22)", marginTop: -Spacing.md, marginBottom: Spacing.xl },
  usdcIcon: { width: 40, height: 40, borderRadius: Radius.full, backgroundColor: "rgba(168, 124, 219,0.14)", alignItems: "center", justifyContent: "center" },
  usdcCopy: { flex: 1 },
  usdcTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.solana, marginBottom: Spacing.xs },
  usdcDesc: { fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 19 },
  riskCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.xl },
  riskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.md },
  riskTitle: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  riskScore: { width: 52, height: 52, borderRadius: Radius.full, borderWidth: 2, alignItems: "center", justifyContent: "center", backgroundColor: Dark.surface },
  riskScoreText: { fontSize: Typography.h3, fontWeight: Typography.bold },
  riskNarrative: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, backgroundColor: `${Brand.primary}10`, borderRadius: Radius.sm, borderWidth: 1, borderColor: `${Brand.primary}24`, padding: Spacing.md, marginBottom: Spacing.md },
  riskNarrativeText: { flex: 1, color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  riskRows: { gap: Spacing.sm },
  riskRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Dark.border },
  riskRowLabel: { fontSize: Typography.caption, color: Dark.textMuted, marginBottom: 2 },
  riskRowValue: { fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 18 },
  actions: { gap: Spacing.md },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md },
  primaryBtnDisabled: { backgroundColor: Dark.bgCard, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.25)" },
  primaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  primaryBtnTextDisabled: { color: Brand.success },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: "rgba(155, 127, 204,0.1)", paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: "rgba(155, 127, 204,0.25)" },
  secondaryBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.lifi },
  disputeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: "rgba(212, 104, 122,0.08)", paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: "rgba(212, 104, 122,0.3)" },
  disputeBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Brand.danger },
  aiBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Dark.bgCard, paddingVertical: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Dark.border },
  aiBtnText: { fontSize: Typography.body, fontWeight: Typography.medium, color: Dark.text },
});
