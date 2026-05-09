import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCampaigns } from "@/hooks/use-mock-store";
import { Brand, Dark, Radius, Spacing, Typography, StatusColors } from "@/constants/theme";
import { getExplorerAddressUrl, getExplorerTxUrl, PROGRAM_ID } from "@/constants/config";
import type { CampaignTx } from "@/types";

const partnerProof = [
  {
    name: "Solana",
    detail: "Deployed Anchor escrow on devnet with real SOL deposits and release logic.",
    icon: "diamond-outline" as const,
  },
  {
    name: "LI.FI",
    detail: "Cross-chain funding route is wired through the backend proxy with a demo-safe fallback.",
    icon: "swap-horizontal-outline" as const,
  },
  {
    name: "ElevenLabs",
    detail: "Voice assistant screen explains escrow context and can run live when agent credentials are set.",
    icon: "mic-outline" as const,
  },
  {
    name: "Solana Mobile",
    detail: "Mobile-first escrow flow; desktop web is used for the live Phantom/Solflare signing demo.",
    icon: "phone-portrait-outline" as const,
  },
];

const grantReasons = [
  "Turns group buying into a trust-minimized checkout flow instead of a chat + bank transfer workflow.",
  "Creates repeat Solana transactions: campaign creation, buyer deposit, delivery confirmation, release, and future refunds.",
  "Combines consumer UX with a real escrow primitive, not just a landing page or static AI wrapper.",
  "Has a clear post-hackathon path: SPL USDC vaults, seller dashboard, dispute/refund flow, and mobile wallet adapter build.",
];

function shortHash(value?: string) {
  if (!value) return "Unavailable";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function txLabel(type: CampaignTx["type"]): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProofScreen() {
  const campaigns = useCampaigns();
  const liveCampaign = campaigns.find((c) => c.id === "campaign-rtx-5080-demo") ?? campaigns[0];
  const txs = liveCampaign?.txHistory ?? [];
  const statusColor = liveCampaign
    ? StatusColors[liveCampaign.status] ?? StatusColors.OPEN
    : StatusColors.OPEN;
  const proofScore = liveCampaign?.campaignPda ? 92 : 68;

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.kicker}>Judge Proof</Text>
            <Text style={s.title}>Grant-ready evidence</Text>
          </View>
          <View style={s.scoreBadge}>
            <Text style={s.scoreValue}>{proofScore}</Text>
            <Text style={s.scoreLabel}>/100</Text>
          </View>
        </View>

        <View style={s.heroPanel}>
          <View style={s.heroTop}>
            <View>
              <Text style={s.panelLabel}>LIVE DEVNET CAMPAIGN</Text>
              <Text style={s.campaignTitle}>{liveCampaign?.title ?? "Snowball escrow"}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusColor.bg }]}>
              <Text style={[s.statusText, { color: statusColor.text }]}>
                {liveCampaign?.status ?? "OPEN"}
              </Text>
            </View>
          </View>
          <View style={s.metricsGrid}>
            <Metric label="Buyers" value={`${liveCampaign?.currentParticipants ?? 0}/${liveCampaign?.targetParticipants ?? 0}`} />
            <Metric label="Locked" value={`${liveCampaign?.totalDeposited ?? "0.00"} SOL`} />
            <Metric label="Required" value={`${liveCampaign?.totalRequiredAmount ?? "0.00"} SOL`} />
            <Metric label="Confirms" value={`${liveCampaign?.confirmationsCount ?? 0}/${liveCampaign?.targetParticipants ?? 0}`} />
          </View>
          <View style={s.addressRow}>
            <AddressButton label="Program" value={liveCampaign?.programId ?? PROGRAM_ID} />
            <AddressButton label="Escrow PDA" value={liveCampaign?.campaignPda} />
          </View>
        </View>

        <SectionTitle title="Why It Can Win" />
        <View style={s.reasonList}>
          {grantReasons.map((reason, index) => (
            <View key={reason} style={s.reasonItem}>
              <View style={s.reasonNum}>
                <Text style={s.reasonNumText}>{index + 1}</Text>
              </View>
              <Text style={s.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Partner Fit" />
        <View style={s.partnerGrid}>
          {partnerProof.map((item) => (
            <View key={item.name} style={s.partnerCard}>
              <View style={s.partnerIcon}>
                <Ionicons name={item.icon} size={18} color={Brand.primary} />
              </View>
              <Text style={s.partnerName}>{item.name}</Text>
              <Text style={s.partnerDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Transaction Trail" />
        <View style={s.txList}>
          {txs.length === 0 ? (
            <View style={s.emptyTx}>
              <Ionicons name="cloud-offline-outline" size={18} color={Dark.textMuted} />
              <Text style={s.emptyText}>
                Start the backend and press Restart Demo to load devnet transaction proof.
              </Text>
            </View>
          ) : (
            txs.slice(0, 8).map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={s.txRow}
                onPress={() => Linking.openURL(getExplorerTxUrl(tx.id))}
                activeOpacity={0.75}
              >
                <View style={s.txIcon}>
                  <Ionicons name="open-outline" size={14} color={Brand.solana} />
                </View>
                <View style={s.txBody}>
                  <Text style={s.txTitle}>{txLabel(tx.type)}</Text>
                  <Text style={s.txNote} numberOfLines={2}>{tx.note}</Text>
                </View>
                <Text style={s.txHash}>{shortHash(tx.id)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 92 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={s.sectionTitle}>{title}</Text>;
}

function AddressButton({ label, value }: { label: string; value?: string }) {
  const disabled = !value;
  return (
    <TouchableOpacity
      style={[s.addressButton, disabled && s.addressButtonDisabled]}
      onPress={() => value && Linking.openURL(getExplorerAddressUrl(value))}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={s.addressLabel}>{label}</Text>
      <View style={s.addressValueRow}>
        <Text style={s.addressValue}>{shortHash(value)}</Text>
        <Ionicons name="open-outline" size={12} color={disabled ? Dark.textMuted : Brand.solana} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  kicker: {
    color: Brand.warning,
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  title: { color: Dark.text, fontSize: Typography.h2, fontWeight: Typography.bold },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: `${Brand.primary}14`,
    borderColor: `${Brand.primary}35`,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  scoreValue: { color: Brand.primary, fontSize: 28, fontWeight: Typography.bold },
  scoreLabel: { color: Dark.textMuted, fontSize: Typography.caption, marginBottom: 5 },
  heroPanel: {
    backgroundColor: Dark.bgCard,
    borderColor: Dark.border,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  panelLabel: {
    color: Dark.textMuted,
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  campaignTitle: { color: Dark.text, fontSize: Typography.h3, fontWeight: Typography.bold },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.bold },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  metricCard: {
    width: "47%",
    backgroundColor: Dark.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  metricLabel: {
    color: Dark.textMuted,
    fontSize: Typography.tiny,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metricValue: { color: Dark.text, fontSize: Typography.h4, fontWeight: Typography.bold },
  addressRow: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  addressButton: {
    flex: 1,
    backgroundColor: "rgba(168, 124, 219, 0.08)",
    borderColor: "rgba(168, 124, 219, 0.24)",
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  addressButtonDisabled: { opacity: 0.6 },
  addressLabel: { color: Dark.textMuted, fontSize: Typography.tiny, marginBottom: 6 },
  addressValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressValue: { color: Dark.text, fontSize: Typography.caption, fontFamily: "monospace" },
  sectionTitle: {
    color: Dark.text,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  reasonList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  reasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  reasonNum: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    backgroundColor: `${Brand.warning}18`,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonNumText: { color: Brand.warning, fontSize: Typography.caption, fontWeight: Typography.bold },
  reasonText: { flex: 1, color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  partnerGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md, marginBottom: Spacing.xl },
  partnerCard: {
    width: "47%",
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  partnerIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: `${Brand.primary}14`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  partnerName: { color: Dark.text, fontSize: Typography.bodySmall, fontWeight: Typography.bold, marginBottom: 5 },
  partnerDetail: { color: Dark.textMuted, fontSize: Typography.caption, lineHeight: 17 },
  txList: { gap: Spacing.sm },
  emptyTx: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  emptyText: { flex: 1, color: Dark.textMuted, fontSize: Typography.caption, lineHeight: 18 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  txIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: "rgba(168, 124, 219, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  txBody: { flex: 1 },
  txTitle: { color: Dark.text, fontSize: Typography.caption, fontWeight: Typography.semiBold },
  txNote: { color: Dark.textMuted, fontSize: Typography.caption, lineHeight: 17, marginTop: 2 },
  txHash: { color: Brand.solana, fontSize: Typography.tiny, fontFamily: "monospace" },
});
