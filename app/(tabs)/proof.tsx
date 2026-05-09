import React, { useEffect, useState } from "react";
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
import { fetchDemoPreflight } from "@/services/backend";
import type { CampaignTx, DemoPreflight } from "@/types";

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
  "Single thesis: consumer group-buying UX on a reusable Solana escrow primitive, with AI explaining trust and risk to non-crypto users.",
  "Turns group buying into a trust-minimized checkout flow instead of a chat + bank transfer workflow.",
  "Creates repeat Solana transactions: campaign creation, buyer deposit, delivery confirmation, release, and future refunds.",
  "Combines consumer UX with a real escrow primitive, not just a landing page or static AI wrapper.",
];

const nextMilestones = [
  "SPL USDC vaults and production-grade token accounting.",
  "Seller dashboard actions for shipment evidence, refunds, and dispute response.",
  "Reusable escrow SDK/API so other group-buying apps can launch campaigns.",
  "Mobile wallet adapter polish and partner pilots with small sellers.",
];

const usdcVaultInterfaces = [
  "Vault mint: SPL USDC",
  "Buyer ATA deposits",
  "Program-owned vault PDA",
  "Refund and release instructions",
];

const localImpact = [
  "Hardware clubs can pool deposits for GPUs, dev kits, and lab parts without one treasurer holding everyone funds.",
  "Book and course groups can coordinate bulk orders with refund and delivery-confirmation paths.",
  "Student trips and global hub meetups can collect deposits while keeping seller release rule-based and auditable.",
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

function isRealSolanaTx(tx: CampaignTx): boolean {
  if (tx.id.startsWith("demo-")) return false;
  return tx.type !== "raise_dispute" && tx.type !== "refund_buyer";
}

export default function ProofScreen() {
  const campaigns = useCampaigns();
  const liveCampaign = campaigns.find((c) => c.id === "campaign-rtx-5080-demo") ?? campaigns[0];
  const txs = liveCampaign?.txHistory ?? [];
  const statusColor = liveCampaign
    ? StatusColors[liveCampaign.status] ?? StatusColors.OPEN
    : StatusColors.OPEN;
  const [preflight, setPreflight] = useState<DemoPreflight | null>(null);

  useEffect(() => {
    fetchDemoPreflight()
      .then(setPreflight)
      .catch(() => {
        setPreflight({
          backendOk: false,
          programId: PROGRAM_ID,
          rpcUrl: "https://api.devnet.solana.com",
          providerBalanceSol: null,
          campaignReachable: false,
          lifiMode: "fallback",
          elevenLabsMode: "missing_env",
          warnings: ["Backend preflight unavailable"],
        });
      });
  }, []);

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.kicker}>Judge Proof</Text>
            <Text style={s.title}>Grant-ready evidence</Text>
            <Text style={s.headerSub}>
              Live devnet state, sponsor fit, and grant narrative in one place.
            </Text>
          </View>
          <View style={s.checkBadge}>
            <Ionicons name="checkmark-done-outline" size={18} color={Brand.primary} />
            <Text style={s.checkBadgeText}>Checklist</Text>
          </View>
        </View>

        <SectionTitle title="Demo Preflight" subtitle="Non-mutating backend check before a judged run." />
        <View style={s.preflightGrid}>
          <ModeCard label="Backend" mode={preflight?.backendOk ? "Live" : "Offline"} tone={preflight?.backendOk ? "good" : "bad"} />
          <ModeCard label="Campaign" mode={preflight?.campaignReachable ? "Reachable" : "Not initialized"} tone={preflight?.campaignReachable ? "good" : "warn"} />
          <ModeCard label="Provider SOL" mode={preflight?.providerBalanceSol == null ? "Unknown" : `${preflight.providerBalanceSol} SOL`} tone={(preflight?.providerBalanceSol ?? 0) >= 0.5 ? "good" : "warn"} />
          <ModeCard label="RPC" mode="Devnet" tone="good" />
        </View>
        {preflight?.warnings.length ? (
          <View style={s.warningPanel}>
            {preflight.warnings.slice(0, 3).map((warning) => (
              <Text key={warning} style={s.warningText}>{warning}</Text>
            ))}
          </View>
        ) : null}

        <View style={s.heroPanel}>
          <View style={s.heroTop}>
            <View style={s.heroTitleBlock}>
              <Text style={s.panelLabel}>LIVE DEVNET CAMPAIGN</Text>
              <Text style={s.campaignTitle}>{liveCampaign?.title ?? "Snowball escrow"}</Text>
            </View>
            <View style={[s.statusPill, { backgroundColor: statusColor.bg }]}>
              <Text style={[s.statusText, { color: statusColor.text }]}>
                {liveCampaign?.status ?? "OPEN"}
              </Text>
            </View>
          </View>
          <View style={s.statusRail}>
            <View style={s.statusStepActive} />
            <View style={s.statusStepActive} />
            <View style={liveCampaign?.status === "OPEN" ? s.statusStep : s.statusStepActive} />
            <View style={liveCampaign?.status === "RELEASED" ? s.statusStepActive : s.statusStep} />
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

        <SectionTitle title="Why Snowball Deserves Grant" subtitle="Problem, working proof, partner fit, and the next build path." />
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

        <SectionTitle title="Local Impact" subtitle="A student-club wedge that makes the consumer escrow use case concrete." />
        <View style={s.impactPanel}>
          <View style={s.impactTop}>
            <Ionicons name="school-outline" size={20} color={Brand.primary} />
            <Text style={s.impactTitle}>Student clubs buy together, safely</Text>
          </View>
          {localImpact.map((item) => (
            <View key={item} style={s.impactRow}>
              <View style={s.impactDot} />
              <Text style={s.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        <SectionTitle title="Next Milestones" subtitle="A focused path from hackathon proof to reusable primitive." />
        <View style={s.milestoneGrid}>
          {nextMilestones.map((milestone) => (
            <View key={milestone} style={s.milestoneCard}>
              <Ionicons name="flag-outline" size={15} color={Brand.warning} />
              <Text style={s.milestoneText}>{milestone}</Text>
            </View>
          ))}
        </View>

        <View style={s.usdcPanel}>
          <View style={s.usdcTop}>
            <View>
              <Text style={s.panelLabel}>PRODUCTION ASSET</Text>
              <Text style={s.usdcTitle}>SPL USDC vault interface stub</Text>
            </View>
            <Ionicons name="cash-outline" size={22} color={Brand.solana} />
          </View>
          <Text style={s.usdcDesc}>
            Devnet SOL keeps the live demo fast. Production moves the same escrow lifecycle into USDC vault accounts for stable pricing, refunds, and seller settlement.
          </Text>
          <View style={s.usdcChips}>
            {usdcVaultInterfaces.map((item) => (
              <View key={item} style={s.usdcChip}>
                <Text style={s.usdcChipText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionTitle title="Partner Fit" subtitle="Each integration maps to a Dev3pack sponsor surface." />
        <View style={s.modeGrid}>
          <ModeCard label="Solana escrow" mode="Live devnet" tone="good" />
          <ModeCard label="Wallet deposit" mode="Live web wallet" tone="good" />
          <ModeCard label="LI.FI" mode={preflight?.lifiMode === "live" ? "Live quote" : "Fallback route"} tone={preflight?.lifiMode === "live" ? "good" : "warn"} />
          <ModeCard label="ElevenLabs" mode={preflight?.elevenLabsMode === "live" ? "Live agent" : "Fallback/missing env"} tone={preflight?.elevenLabsMode === "live" ? "good" : "warn"} />
          <ModeCard label="Dispute/refund" mode="Demo-only state" tone="demo" />
          <ModeCard label="USDC vault" mode="Roadmap stub" tone="demo" />
        </View>
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

        <SectionTitle title="Transaction Trail" subtitle="Only real Solana signatures link to Explorer; demo events stay local." />
        <View style={s.txList}>
          {txs.length === 0 ? (
            <View style={s.emptyTx}>
              <Ionicons name="cloud-offline-outline" size={18} color={Dark.textMuted} />
              <Text style={s.emptyText}>
                Start the backend and press Restart Demo to load devnet transaction proof.
              </Text>
            </View>
          ) : (
            txs.slice(0, 8).map((tx) => {
              const realTx = isRealSolanaTx(tx);
              return (
              <TouchableOpacity
                key={tx.id}
                style={[s.txRow, !realTx && s.txRowLocal]}
                onPress={() => realTx && Linking.openURL(getExplorerTxUrl(tx.id))}
                disabled={!realTx}
                activeOpacity={0.75}
              >
                <View style={s.txIcon}>
                  <Ionicons name={realTx ? "open-outline" : "desktop-outline"} size={14} color={realTx ? Brand.solana : Dark.textMuted} />
                </View>
                <View style={s.txBody}>
                  <Text style={s.txTitle}>{txLabel(tx.type)}</Text>
                  <Text style={s.txNote} numberOfLines={2}>{tx.note}</Text>
                </View>
                <Text style={s.txHash}>{realTx ? shortHash(tx.id) : "Local demo event"}</Text>
              </TouchableOpacity>
              );
            })
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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Text style={s.sectionSubtitle}>{subtitle}</Text>
    </View>
  );
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

function ModeCard({
  label,
  mode,
  tone,
}: {
  label: string;
  mode: string;
  tone: "good" | "warn" | "bad" | "demo";
}) {
  const color =
    tone === "good"
      ? Brand.success
      : tone === "bad"
        ? Brand.danger
        : tone === "demo"
          ? Brand.solana
          : Brand.warning;

  return (
    <View style={[s.modeCard, { borderColor: `${color}55` }]}>
      <Text style={s.modeLabel}>{label}</Text>
      <Text style={[s.modeValue, { color }]}>{mode}</Text>
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
    color: Brand.warning,
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  title: { color: Dark.text, fontSize: Typography.h2, fontWeight: Typography.bold },
  headerSub: {
    color: Dark.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 18,
    maxWidth: 280,
    marginTop: 6,
  },
  checkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: `${Brand.primary}14`,
    borderColor: `${Brand.primary}35`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 102,
    justifyContent: "center",
  },
  checkBadgeText: { color: Brand.primary, fontSize: Typography.caption, fontWeight: Typography.semiBold },
  preflightGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.md },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  modeCard: { width: "48%", backgroundColor: Dark.bgCard, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  modeLabel: { color: Dark.textMuted, fontSize: Typography.tiny, marginBottom: 4 },
  modeValue: { fontSize: Typography.caption, fontWeight: Typography.semiBold },
  warningPanel: { backgroundColor: `${Brand.warning}12`, borderColor: `${Brand.warning}35`, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, gap: 4 },
  warningText: { color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  heroPanel: {
    backgroundColor: Dark.bgCard,
    borderColor: Dark.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroTitleBlock: { flex: 1 },
  panelLabel: {
    color: Dark.textMuted,
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  campaignTitle: { color: Dark.text, fontSize: Typography.h3, fontWeight: Typography.bold, lineHeight: 26 },
  statusPill: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 6, minWidth: 76, alignItems: "center" },
  statusText: { fontSize: Typography.tiny, fontWeight: Typography.bold },
  statusRail: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  statusStep: {
    flex: 1,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Dark.surfaceLight,
  },
  statusStepActive: {
    flex: 1,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
  },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  metricCard: {
    flexGrow: 1,
    flexBasis: "45%",
    backgroundColor: Dark.surface,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    minHeight: 74,
    justifyContent: "center",
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
    borderRadius: Radius.sm,
    padding: Spacing.md,
    minHeight: 64,
    justifyContent: "center",
  },
  addressButtonDisabled: { opacity: 0.6 },
  addressLabel: { color: Dark.textMuted, fontSize: Typography.tiny, marginBottom: 6 },
  addressValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  addressValue: { color: Dark.text, fontSize: Typography.caption, fontFamily: "monospace" },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Dark.text,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: Dark.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 18,
  },
  reasonList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  reasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.sm,
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
  reasonText: { flex: 1, color: Dark.textSecondary, fontSize: Typography.bodySmall, lineHeight: 20 },
  impactPanel: {
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  impactTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  impactTitle: { color: Dark.text, fontSize: Typography.body, fontWeight: Typography.bold },
  impactRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
  },
  impactDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    marginTop: 6,
  },
  impactText: { flex: 1, color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  milestoneGrid: { gap: Spacing.sm, marginBottom: Spacing.xl },
  milestoneCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  milestoneText: { flex: 1, color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  usdcPanel: {
    backgroundColor: "rgba(168, 124, 219, 0.08)",
    borderColor: "rgba(168, 124, 219, 0.24)",
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  usdcTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  usdcTitle: { color: Dark.text, fontSize: Typography.body, fontWeight: Typography.bold },
  usdcDesc: { color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18, marginBottom: Spacing.md },
  usdcChips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  usdcChip: { backgroundColor: Dark.bgCard, borderColor: "rgba(168, 124, 219, 0.2)", borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5 },
  usdcChipText: { color: Brand.solana, fontSize: Typography.tiny, fontWeight: Typography.semiBold },
  partnerGrid: { gap: Spacing.md, marginBottom: Spacing.xl },
  partnerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.sm,
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
  },
  partnerName: { color: Dark.text, fontSize: Typography.bodySmall, fontWeight: Typography.bold, marginBottom: 5 },
  partnerDetail: { color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18 },
  txList: { gap: Spacing.sm },
  emptyTx: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.sm,
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
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Dark.border,
    padding: Spacing.md,
  },
  txRowLocal: {
    opacity: 0.82,
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
  txNote: { color: Dark.textSecondary, fontSize: Typography.caption, lineHeight: 18, marginTop: 2 },
  txHash: { color: Brand.solana, fontSize: Typography.tiny, fontFamily: "monospace" },
});
