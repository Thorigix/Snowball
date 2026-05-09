import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius, StatusColors } from "@/constants/theme";
import { Campaign } from "@/types";
import { useCampaigns } from "@/hooks/use-mock-store";
import DemoControls from "@/components/DemoControls";

const { width } = Dimensions.get("window");

export default function CampaignFeedScreen() {
  const router = useRouter();
  const campaigns = useCampaigns();
  const fadeAnim = useState(new Animated.Value(0))[0];

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

  const CARD_ICONS: Record<number, string> = {
    0: "hardware-chip-outline",
    1: "headset-outline",
    2: "keypad-outline",
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
          <TouchableOpacity style={s.avatarBtn}>
            <Ionicons name="person-outline" size={18} color={Dark.textSecondary} />
          </TouchableOpacity>
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
          {[
            { icon: "add-circle-outline", label: "Join", color: Brand.primary },
            { icon: "swap-horizontal-outline", label: "Bridge", color: Brand.secondary },
            { icon: "shield-checkmark-outline", label: "Escrow", color: Brand.primary },
            { icon: "chatbubble-outline", label: "AI", color: Brand.secondary },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={s.actionItem}>
              <View style={[s.actionIcon, { backgroundColor: `${a.color}15` }]}>
                <Ionicons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Active Campaigns</Text>
          <Text style={s.sectionBadge}>{campaigns.length}</Text>
        </View>

        {/* Campaign List */}
        <Animated.View style={{ opacity: fadeAnim }}>
          {campaigns.map((campaign, idx) => (
            <TouchableOpacity
              key={campaign.id}
              style={s.card}
              activeOpacity={0.6}
              onPress={() => router.push(`/campaign/${campaign.id}`)}
            >
              <View style={s.cardRow}>
                <View style={s.cardIconWrap}>
                  <Ionicons
                    name={(CARD_ICONS[idx] ?? "cube-outline") as any}
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
                    name="lock-closed-outline"
                    size={10}
                    color={Dark.textMuted}
                  />
                  <Text style={s.footerChipText}>Escrow</Text>
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
    justifyContent: "space-between",
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { fontSize: 11, color: Dark.textSecondary, fontWeight: "500" },

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
  footerTime: { fontSize: 11, color: Dark.textMuted },
});
