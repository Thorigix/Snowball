import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Dark, Brand, Typography, Spacing, Radius, Shadows, StatusColors } from "@/constants/theme";
import { Campaign } from "@/types";
import { getCampaigns } from "@/services/mock-data";

export default function CampaignFeedScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const data = await getCampaigns();
    setCampaigns(data);
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  const getProgress = (c: Campaign) =>
    c.targetParticipants > 0 ? c.currentParticipants / c.targetParticipants : 0;

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="snow-outline" size={24} color={Brand.primary} />
          <View>
            <Text style={styles.logo}>Snowball</Text>
            <Text style={styles.subtitle}>Group Buying with Trust</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={20} color={Dark.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="layers-outline" size={16} color={Brand.primary} />
          <Text style={styles.statValue}>{campaigns.length}</Text>
          <Text style={styles.statLabel}>active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color={Dark.textSecondary} />
          <Text style={styles.statValue}>
            {campaigns.reduce((a, c) => a + c.currentParticipants, 0)}
          </Text>
          <Text style={styles.statLabel}>buyers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Dark.textSecondary} />
          <Text style={styles.statLabel}>escrow secured</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Brand.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {campaigns.map((campaign, index) => (
              <TouchableOpacity
                key={campaign.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/campaign/${campaign.id}`)}
              >
                {/* Card Top */}
                <View style={styles.cardTop}>
                  <View style={styles.cardIcon}>
                    <Ionicons
                      name={
                        index === 0
                          ? "hardware-chip-outline"
                          : index === 1
                          ? "headset-outline"
                          : "keypad-outline"
                      }
                      size={22}
                      color={Brand.primary}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {campaign.title}
                    </Text>
                    <View style={styles.sellerRow}>
                      <Ionicons name="storefront-outline" size={12} color={Dark.textMuted} />
                      <Text style={styles.sellerName}>{campaign.sellerName}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: StatusColors[campaign.status]?.bg }]}>
                    <Text style={[styles.statusText, { color: StatusColors[campaign.status]?.text }]}>
                      {campaign.status}
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${getProgress(campaign) * 100}%` }]} />
                </View>
                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>
                    <Text style={styles.progressHighlight}>{campaign.currentParticipants}</Text>
                    {" / "}{campaign.targetParticipants} buyers
                  </Text>
                  <Text style={styles.timeLeft}>{getTimeLeft(campaign.deadline)}</Text>
                </View>

                {/* Bottom */}
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.priceLabel}>per buyer</Text>
                    <Text style={styles.priceValue}>
                      {campaign.pricePerUser}{" "}
                      <Text style={styles.tokenSymbol}>{campaign.tokenSymbol}</Text>
                    </Text>
                  </View>
                  <View style={styles.escrowBadge}>
                    <Ionicons name="lock-closed-outline" size={11} color={Brand.primary} />
                    <Text style={styles.escrowText}>Escrow</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },

  // Header — open, no box
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  logo: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Dark.text,
    letterSpacing: -0.3,
  },
  subtitle: { fontSize: Typography.tiny, color: Dark.textMuted, marginTop: 1 },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },

  // Stats row — flat, no container
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statValue: { fontSize: Typography.bodySmall, fontWeight: Typography.semiBold, color: Dark.text },
  statLabel: { fontSize: Typography.caption, color: Dark.textMuted },
  statDivider: { width: 1, height: 14, backgroundColor: Dark.border },

  // Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  // Card — subtle border, not heavy
  card: {
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Dark.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: Typography.body, fontWeight: Typography.medium, color: Dark.text, marginBottom: 2 },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  sellerName: { fontSize: Typography.caption, color: Dark.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  statusText: { fontSize: 10, fontWeight: Typography.semiBold, textTransform: "uppercase", letterSpacing: 0.5 },

  // Progress
  progressBar: { height: 4, backgroundColor: Dark.surface, borderRadius: Radius.full, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", backgroundColor: Brand.primary, borderRadius: Radius.full },
  progressInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: Spacing.md },
  progressText: { fontSize: Typography.caption, color: Dark.textSecondary },
  progressHighlight: { color: Brand.primary, fontWeight: Typography.medium },
  timeLeft: { fontSize: Typography.caption, color: Dark.textMuted },

  // Bottom
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
  },
  priceLabel: { fontSize: 10, color: Dark.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  priceValue: { fontSize: Typography.h4, fontWeight: Typography.semiBold, color: Dark.text },
  tokenSymbol: { fontSize: Typography.caption, color: Brand.primary, fontWeight: Typography.medium },
  escrowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Dark.surface,
  },
  escrowText: { fontSize: 10, color: Dark.textSecondary },
});
