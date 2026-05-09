import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Brand, Dark, Radius, Spacing, StatusColors, Typography } from "@/constants/theme";
import { getConfirmationThreshold, mockRefundBuyer } from "@/services/mock-data";
import { useCampaigns } from "@/hooks/use-mock-store";
import type { Campaign } from "@/types";
import { getSellerReputation } from "@/constants/sellers";

function releaseState(campaign: Campaign): {
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
} {
  const threshold = getConfirmationThreshold(campaign.targetParticipants);
  const missingBuyers = Math.max(0, campaign.targetParticipants - campaign.currentParticipants);
  const missingConfirmations = Math.max(0, threshold - campaign.confirmationsCount);

  if (campaign.status === "DISPUTED" || campaign.disputesCount > 0) {
    return {
      label: "Release blocked",
      detail: "Buyer dispute is open. Seller payout is blocked until refund or resolution.",
      icon: "alert-circle-outline",
      color: Brand.danger,
    };
  }

  if (campaign.status === "REFUNDED") {
    return {
      label: "Refunded",
      detail: "Buyer refund path completed; this escrow is closed for demo.",
      icon: "return-down-back-outline",
      color: Brand.danger,
    };
  }

  if (campaign.status === "RELEASED") {
    return {
      label: "Paid out",
      detail: "Escrow release is complete.",
      icon: "checkmark-circle-outline",
      color: Brand.success,
    };
  }

  if (missingBuyers > 0) {
    return {
      label: "Funding",
      detail: `${missingBuyers} more buyer${missingBuyers === 1 ? "" : "s"} needed before shipment.`,
      icon: "people-outline",
      color: Brand.primary,
    };
  }

  if (campaign.status === "FUNDED") {
    return {
      label: "Ready to ship",
      detail: "Buyer funds are locked. Mark shipment when the order leaves the seller.",
      icon: "cube-outline",
      color: Brand.warning,
    };
  }

  if (missingConfirmations > 0) {
    return {
      label: "Awaiting confirmations",
      detail: `${missingConfirmations} more delivery confirmation${missingConfirmations === 1 ? "" : "s"} before release.`,
      icon: "time-outline",
      color: Brand.secondary,
    };
  }

  return {
    label: "Release ready",
    detail: "Confirmation threshold is met. Funds can be released.",
    icon: "send-outline",
    color: Brand.success,
  };
}

export default function SellerDashboardScreen() {
  const [busyRefundId, setBusyRefundId] = useState<string | null>(null);
  const campaigns = useCampaigns();
  const sellerCampaigns = campaigns.filter((campaign) => campaign.sellerName);
  const totalLocked = sellerCampaigns.reduce(
    (sum, campaign) => sum + parseFloat(campaign.totalDeposited || "0"),
    0
  );
  const readyCount = sellerCampaigns.filter((campaign) => {
    const threshold = getConfirmationThreshold(campaign.targetParticipants);
    return (
      campaign.status !== "RELEASED" &&
      campaign.currentParticipants >= campaign.targetParticipants &&
      campaign.confirmationsCount >= threshold
    );
  }).length;
  const shippedCount = sellerCampaigns.filter((campaign) =>
    ["SHIPPED", "DELIVERY_REVIEW", "RELEASED"].includes(campaign.status)
  ).length;

  const handleRefund = (campaign: Campaign) => {
    if (busyRefundId) return;
    Alert.alert(
      "Refund buyer?",
      "This completes the demo dispute path and keeps seller release blocked.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Refund",
          style: "destructive",
          onPress: async () => {
            setBusyRefundId(campaign.id);
            const result = await mockRefundBuyer(campaign.id);
            setBusyRefundId(null);
            if (!result.success) {
              Alert.alert("Refund failed", result.error ?? "Unknown error");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.kicker}>Seller Dashboard</Text>
            <Text style={s.title}>Escrow operations</Text>
            <Text style={s.subtitle}>
              Shipment state, locked value, buyer confirmations, and release readiness.
            </Text>
          </View>
          <View style={s.headerIcon}>
            <Ionicons name="storefront-outline" size={24} color={Brand.primary} />
          </View>
        </View>

        <View style={s.summaryGrid}>
          <SummaryCard label="Locked escrow" value={`${totalLocked.toFixed(2)} SOL`} icon="lock-closed-outline" />
          <SummaryCard label="Release ready" value={`${readyCount}`} icon="send-outline" />
          <SummaryCard label="Campaigns" value={`${sellerCampaigns.length}`} icon="layers-outline" />
          <SummaryCard label="Shipped" value={`${shippedCount}`} icon="cube-outline" />
        </View>

        <Text style={s.sectionTitle}>Seller queue</Text>
        <View style={s.queue}>
          {sellerCampaigns.map((campaign) => {
            const status = StatusColors[campaign.status] ?? StatusColors.OPEN;
            const release = releaseState(campaign);
            const threshold = getConfirmationThreshold(campaign.targetParticipants);
            const sellerRep = getSellerReputation(campaign.sellerName);
            const progress =
              campaign.targetParticipants > 0
                ? campaign.currentParticipants / campaign.targetParticipants
                : 0;
            const confirmProgress =
              threshold > 0 ? campaign.confirmationsCount / threshold : 0;

            return (
              <View key={campaign.id} style={s.campaignCard}>
                <View style={s.cardTop}>
                  <View style={s.cardTitleBlock}>
                    <Text style={s.campaignTitle}>{campaign.title}</Text>
                    <View style={s.sellerLine}>
                      <Text style={s.sellerName}>{campaign.sellerName}</Text>
                      {sellerRep.verified ? (
                        <View style={s.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={11} color={Brand.success} />
                          <Text style={s.verifiedText}>Verified</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: status.bg }]}>
                    <Text style={[s.statusText, { color: status.text }]}>{campaign.status}</Text>
                  </View>
                </View>

                <View style={s.metricRow}>
                  <QueueMetric label="Escrow total" value={`${campaign.totalDeposited} ${campaign.tokenSymbol}`} />
                  <QueueMetric label="Buyers" value={`${campaign.currentParticipants}/${campaign.targetParticipants}`} />
                  <QueueMetric label="Confirms" value={`${campaign.confirmationsCount}/${threshold}`} />
                </View>
                <View style={s.reputationStrip}>
                  <Text style={s.repText}>{sellerRep.fulfilledOrders} fulfilled</Text>
                  <Text style={s.repSep}>|</Text>
                  <Text style={s.repText}>{sellerRep.disputeRate} dispute rate</Text>
                  <Text style={s.repSep}>|</Text>
                  <Text style={s.repText}>{sellerRep.deliverySla} SLA</Text>
                </View>

                <ProgressLine label="Funding" value={Math.min(1, progress)} />
                <ProgressLine label="Release threshold" value={Math.min(1, confirmProgress)} />

                <View style={[s.releaseBox, { borderColor: `${release.color}44` }]}>
                  <View style={[s.releaseIcon, { backgroundColor: `${release.color}18` }]}>
                    <Ionicons name={release.icon} size={16} color={release.color} />
                  </View>
                  <View style={s.releaseCopy}>
                    <Text style={[s.releaseLabel, { color: release.color }]}>{release.label}</Text>
                    <Text style={s.releaseDetail}>{release.detail}</Text>
                  </View>
                </View>
                {campaign.status === "DISPUTED" ? (
                  <TouchableOpacity
                    style={s.refundBtn}
                    onPress={() => handleRefund(campaign)}
                    activeOpacity={0.85}
                    disabled={busyRefundId === campaign.id}
                  >
                    {busyRefundId === campaign.id ? (
                      <ActivityIndicator color={Brand.danger} />
                    ) : (
                      <>
                        <Ionicons name="return-down-back-outline" size={16} color={Brand.danger} />
                        <Text style={s.refundText}>Refund Buyer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={{ height: 92 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={s.summaryCard}>
      <Ionicons name={icon} size={16} color={Brand.primary} />
      <Text style={s.summaryValue}>{value}</Text>
      <Text style={s.summaryLabel}>{label}</Text>
    </View>
  );
}

function QueueMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.queueMetric}>
      <Text style={s.queueMetricLabel}>{label}</Text>
      <Text style={s.queueMetricValue}>{value}</Text>
    </View>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.progressBlock}>
      <View style={s.progressHeader}>
        <Text style={s.progressLabel}>{label}</Text>
        <Text style={s.progressPercent}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={s.progressTrack}>
        <View style={[s.progressFill, { width: `${value * 100}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  kicker: {
    color: Brand.primary,
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  title: { color: Dark.text, fontSize: Typography.h2, fontWeight: Typography.bold },
  subtitle: {
    color: Dark.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 18,
    maxWidth: 300,
    marginTop: 6,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: `${Brand.primary}14`,
    borderWidth: 1,
    borderColor: `${Brand.primary}30`,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  summaryCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minHeight: 98,
    backgroundColor: Dark.bgCard,
    borderColor: Dark.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: "center",
  },
  summaryValue: {
    color: Dark.text,
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    marginTop: Spacing.sm,
  },
  summaryLabel: {
    color: Dark.textMuted,
    fontSize: Typography.caption,
    marginTop: 4,
  },
  sectionTitle: {
    color: Dark.text,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  queue: { gap: Spacing.md },
  campaignCard: {
    backgroundColor: Dark.bgCard,
    borderColor: Dark.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cardTitleBlock: { flex: 1 },
  campaignTitle: {
    color: Dark.text,
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    lineHeight: 21,
  },
  sellerName: { color: Dark.textMuted, fontSize: Typography.caption, marginTop: 3 },
  sellerLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: Spacing.sm, marginTop: 3 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: `${Brand.success}14`, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  verifiedText: { color: Brand.success, fontSize: Typography.tiny, fontWeight: Typography.semiBold },
  statusPill: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    minWidth: 78,
    alignItems: "center",
  },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.bold },
  metricRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  queueMetric: {
    flex: 1,
    backgroundColor: Dark.surface,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    minHeight: 58,
    justifyContent: "center",
  },
  queueMetricLabel: { color: Dark.textMuted, fontSize: Typography.tiny, marginBottom: 4 },
  queueMetricValue: { color: Dark.text, fontSize: Typography.caption, fontWeight: Typography.bold },
  reputationStrip: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, alignItems: "center", marginTop: -Spacing.sm, marginBottom: Spacing.md },
  repText: { color: Dark.textMuted, fontSize: Typography.tiny },
  repSep: { color: Dark.border, fontSize: Typography.tiny },
  progressBlock: { marginBottom: Spacing.md },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressLabel: { color: Dark.textSecondary, fontSize: Typography.caption },
  progressPercent: { color: Dark.textMuted, fontSize: Typography.tiny },
  progressTrack: {
    height: 5,
    backgroundColor: Dark.surfaceLight,
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: Brand.primary },
  releaseBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.sm,
    backgroundColor: Dark.surface,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  releaseIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  releaseCopy: { flex: 1 },
  releaseLabel: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    marginBottom: 3,
  },
  releaseDetail: { color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  refundBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: "rgba(212, 104, 122,0.08)", borderWidth: 1, borderColor: "rgba(212, 104, 122,0.3)", borderRadius: Radius.md, paddingVertical: Spacing.md, marginTop: Spacing.md },
  refundText: { color: Brand.danger, fontSize: Typography.bodySmall, fontWeight: Typography.semiBold },
});
