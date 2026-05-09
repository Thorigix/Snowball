import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius, StatusColors } from "@/constants/theme";
import { Campaign } from "@/types";
import { useCampaigns } from "@/hooks/use-mock-store";
import { resetDemoState } from "@/services/mock-data";
import DemoControls from "@/components/DemoControls";

const { width } = Dimensions.get("window");

export default function CampaignFeedScreen() {
  const router = useRouter();
  const campaigns = useCampaigns();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [resetting, setResetting] = useState(false);

  const handleRestart = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await resetDemoState();
    } catch (error) {
      Alert.alert(
        "Restart failed",
        error instanceof Error
          ? error.message
          : "Devnet reset failed. Check the backend terminal."
      );
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const getProgress = (c: Campaign) =>
    c.targetParticipants > 0 ? c.currentParticipants / c.targetParticipants : 0;

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  };

  const totalEscrow = campaigns.reduce(
    (a, c) => a + parseFloat(c.totalDeposited),
    0
  );
  const primaryCampaign = campaigns.find((c) => c.id === "campaign-rtx-5080-demo") ?? campaigns[0];
  const liveProofText = primaryCampaign
    ? `${primaryCampaign.currentParticipants}/${primaryCampaign.targetParticipants} buyers funded · ${primaryCampaign.totalDeposited} ${primaryCampaign.tokenSymbol} locked`
    : "Live escrow proof loading";
  const heroCompact = width < 380;

  const CARD_ICONS: Record<string, string> = {
    "campaign-rtx-5080-demo": "hardware-chip-outline",
    "campaign-airpods-demo": "headset-outline",
    "campaign-keyboard-demo": "keypad-outline",
    "campaign-powerbank-demo": "battery-charging-outline",
    "campaign-sticker-pack-demo": "pricetag-outline",
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Welcome back</Text>
            <Text style={s.appName}>Snowball</Text>
          </View>
          <TouchableOpacity
            style={[s.restartBtn, resetting && s.restartBtnBusy]}
            onPress={handleRestart}
            disabled={resetting}
            activeOpacity={0.75}
          >
            {resetting ? (
              <ActivityIndicator size="small" color={Brand.primary} />
            ) : (
              <Ionicons name="refresh-outline" size={14} color={Brand.primary} />
            )}
            <Text style={s.restartText}>
              {resetting ? "Resetting..." : "Restart Demo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.submissionHero}>
          <View style={s.heroTopRow}>
            <View style={s.heroCopy}>
              <Text style={s.heroKicker}>Submission screenshot mode</Text>
              <Text style={[s.heroTitle, heroCompact && s.heroTitleCompact]}>
                Group buys protected by Solana escrow.
              </Text>
              <Text style={s.heroSubtitle}>
                Student clubs can coordinate hardware, book, and trip buys safely while AI explains trust and risk in plain language.
              </Text>
            </View>
            <View style={s.heroProofIcon}>
              <Ionicons name="shield-checkmark-outline" size={28} color={Brand.primary} />
            </View>
          </View>
          <View style={s.heroProofRow}>
            <View style={s.heroProofPill}>
              <Ionicons name="radio-button-on-outline" size={12} color={Brand.success} />
              <Text style={s.heroProofText}>Live devnet proof</Text>
            </View>
            <Text style={s.heroProofMetric}>{liveProofText}</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={s.balanceSection}>
          <Text style={s.balanceLabel}>Total Escrow</Text>
          <Text style={s.balanceValue}>
            {totalEscrow.toFixed(2)} <Text style={s.balanceCurrency}>SOL</Text>
          </Text>
          <View style={s.balanceMeta}>
            <View style={s.metaChip}>
              <View style={s.metaDot} />
              <Text style={s.metaText}>Devnet</Text>
            </View>
            <Text style={s.metaSep}>|</Text>
            <Text style={s.metaText}>
              {campaigns.length} campaigns
            </Text>
            <Text style={s.metaSep}>|</Text>
            <Text style={s.metaText}>
              {campaigns.reduce((a, c) => a + c.currentParticipants, 0)} buyers
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.actions}>
          {(() => {
            const firstOpen = campaigns.find((c) => c.status === "OPEN" && !c.userJoined);
            const fallbackId = firstOpen?.id ?? campaigns[0]?.id;
            const quickActions: {
              icon: string;
              label: string;
              color: string;
              onPress: () => void;
            }[] = [
              {
                icon: "add-circle-outline",
                label: "Join",
                color: Brand.primary,
                onPress: () => {
                  if (fallbackId) router.push(`/campaign/${fallbackId}`);
                },
              },
              {
                icon: "swap-horizontal-outline",
                label: "Bridge",
                color: Brand.secondary,
                onPress: () => {
                  if (fallbackId) router.push(`/funding/${fallbackId}`);
                },
              },
              {
                icon: "shield-checkmark-outline",
                label: "Escrow",
                color: Brand.primary,
                onPress: () => router.push("/(tabs)/wallet"),
              },
              {
                icon: "chatbubble-outline",
                label: "AI",
                color: Brand.secondary,
                onPress: () => router.push("/(tabs)/ai"),
              },
              {
                icon: "ribbon-outline",
                label: "Proof",
                color: Brand.warning,
                onPress: () => router.push("/(tabs)/proof"),
              },
            ];
            return quickActions.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={s.actionItem}
                onPress={a.onPress}
                activeOpacity={0.7}
              >
                <View style={[s.actionIcon, { backgroundColor: `${a.color}15` }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={s.actionLabel}>{a.label}</Text>
              </TouchableOpacity>
            ));
          })()}
        </View>

        {/* Section */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Active Campaigns</Text>
          <Text style={s.sectionBadge}>{campaigns.length}</Text>
        </View>

        {/* Campaign List */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {campaigns.map((campaign) => (
            <TouchableOpacity
              key={campaign.id}
              style={s.card}
              activeOpacity={0.6}
              onPress={() => router.push(`/campaign/${campaign.id}`)}
            >
              <View style={s.cardRow}>
                <View style={s.cardIconWrap}>
                  <Ionicons
                    name={(CARD_ICONS[campaign.id] ?? "cube-outline") as any}
                    size={20}
                    color={Brand.primary}
                  />
                </View>
                <View style={s.cardContent}>
                  <Text style={s.cardTitle} numberOfLines={1}>
                    {campaign.title}
                  </Text>
                  <Text style={s.cardSeller}>{campaign.sellerName}</Text>
                </View>
                <View style={s.cardRight}>
                  <Text style={s.cardPrice}>
                    {campaign.pricePerUser}{" "}
                    <Text style={s.cardToken}>{campaign.tokenSymbol}</Text>
                  </Text>
                  <View
                    style={[
                      s.statusDot,
                      {
                        backgroundColor:
                          StatusColors[campaign.status]?.text ?? Dark.textMuted,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Progress */}
              <View style={s.progressRow}>
                <View style={s.progressTrack}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${getProgress(campaign) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={s.progressLabel}>
                  {campaign.currentParticipants}/{campaign.targetParticipants}
                </Text>
              </View>

              <View style={s.cardFooter}>
                <View style={s.footerChip}>
                  <Ionicons
                    name={campaign.userJoined ? "checkmark-circle-outline" : "lock-closed-outline"}
                    size={10}
                    color={campaign.userJoined ? Brand.success : Dark.textMuted}
                  />
                  <Text
                    style={[
                      s.footerChipText,
                      campaign.userJoined && s.footerChipTextJoined,
                    ]}
                  >
                    {campaign.userJoined ? "Joined" : "Escrow"}
                  </Text>
                </View>
                <Text style={s.footerTime}>{getTimeLeft(campaign.deadline)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
      <DemoControls />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  greeting: { fontSize: 13, color: Dark.textMuted, marginBottom: 2 },
  appName: { fontSize: 26, fontWeight: "700", color: Dark.text, letterSpacing: -0.5 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${Brand.primary}12`,
    borderWidth: 1,
    borderColor: `${Brand.primary}33`,
  },
  restartBtnBusy: {
    opacity: 0.7,
  },
  restartText: {
    fontSize: 12,
    color: Brand.primary,
    fontWeight: "600",
  },
  submissionHero: {
    backgroundColor: Dark.bgCard,
    borderColor: `${Brand.primary}30`,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroCopy: { flex: 1 },
  heroKicker: {
    color: Brand.primary,
    fontSize: Typography.tiny,
    fontWeight: Typography.bold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  heroTitle: {
    color: Dark.text,
    fontSize: 26,
    fontWeight: Typography.bold,
    lineHeight: 31,
    marginBottom: Spacing.sm,
  },
  heroTitleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: Dark.textSecondary,
    fontSize: Typography.caption,
    lineHeight: 18,
  },
  heroProofIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: `${Brand.primary}14`,
    alignItems: "center",
    justifyContent: "center",
  },
  heroProofRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
    paddingTop: Spacing.md,
  },
  heroProofPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${Brand.success}12`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  heroProofText: {
    color: Brand.success,
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
  },
  heroProofMetric: {
    color: Dark.textSecondary,
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
  },

  // Balance
  balanceSection: { marginBottom: 32 },
  balanceLabel: { fontSize: 13, color: Dark.textMuted, marginBottom: 6 },
  balanceValue: { fontSize: 42, fontWeight: "700", color: Dark.text, letterSpacing: -1.5 },
  balanceCurrency: { fontSize: 20, fontWeight: "500", color: Dark.textSecondary },
  balanceMeta: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Dark.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  metaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.success },
  metaText: { fontSize: 12, color: Dark.textMuted },
  metaSep: { fontSize: 12, color: Dark.border },

  // Actions
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 36,
  },
  actionItem: {
    flexGrow: 1,
    flexBasis: "30%",
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Dark.bgCard,
    borderWidth: 1,
    borderColor: Dark.border,
    borderRadius: 14,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { fontSize: 12, color: Dark.textSecondary, fontWeight: "600" },

  // Section
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 17, fontWeight: "600", color: Dark.text },
  sectionBadge: {
    fontSize: 12,
    color: Brand.primary,
    fontWeight: "600",
    backgroundColor: `${Brand.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },

  // Card
  card: {
    backgroundColor: Dark.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  cardRow: { flexDirection: "row", alignItems: "center" },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: `${Brand.primary}12`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: Dark.text, marginBottom: 2 },
  cardSeller: { fontSize: 12, color: Dark.textMuted },
  cardRight: { alignItems: "flex-end", gap: 6 },
  cardPrice: { fontSize: 15, fontWeight: "600", color: Dark.text },
  cardToken: { fontSize: 12, color: Brand.primary, fontWeight: "500" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Progress
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Dark.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Brand.primary,
    borderRadius: 2,
  },
  progressLabel: { fontSize: 11, color: Dark.textMuted, fontWeight: "500" },

  // Footer
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  footerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerChipText: { fontSize: 10, color: Dark.textMuted },
  footerChipTextJoined: { color: Brand.success, fontWeight: "600" },
  footerTime: { fontSize: 11, color: Dark.textMuted },
});
