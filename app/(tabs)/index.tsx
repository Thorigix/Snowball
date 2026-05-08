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

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const data = await getCampaigns();
    setCampaigns(data);
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const getProgress = (c: Campaign) =>
    c.targetParticipants > 0
      ? c.currentParticipants / c.targetParticipants
      : 0;

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
        <View>
          <Text style={styles.logo}>❄️ Snowball</Text>
          <Text style={styles.subtitle}>Group Buying with Trust</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="notifications-outline" size={22} color={Dark.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroGradient}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Join Group Buys</Text>
            <Text style={styles.heroDesc}>
              Lock funds in Solana escrow. Pay only after delivery.
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>{campaigns.length}</Text>
                <Text style={styles.heroStatLabel}>Active</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatValue}>
                  {campaigns.reduce((a, c) => a + c.currentParticipants, 0)}
                </Text>
                <Text style={styles.heroStatLabel}>Buyers</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <Ionicons name="shield-checkmark" size={18} color={Brand.primary} />
                <Text style={styles.heroStatLabel}>Escrow</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Campaign List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        <Text style={styles.sectionCount}>{campaigns.length}</Text>
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
                activeOpacity={0.85}
                onPress={() => router.push(`/campaign/${campaign.id}`)}
              >
                {/* Card Header */}
                <View style={styles.cardTop}>
                  <View style={styles.cardImagePlaceholder}>
                    <Ionicons
                      name={
                        index === 0
                          ? "hardware-chip"
                          : index === 1
                          ? "headset"
                          : "keypad"
                      }
                      size={28}
                      color={Brand.primary}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {campaign.title}
                    </Text>
                    <View style={styles.sellerRow}>
                      <Ionicons name="storefront-outline" size={13} color={Dark.textSecondary} />
                      <Text style={styles.sellerName}>{campaign.sellerName}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          StatusColors[campaign.status]?.bg ?? StatusColors.OPEN.bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            StatusColors[campaign.status]?.text ?? StatusColors.OPEN.text,
                        },
                      ]}
                    >
                      {campaign.status}
                    </Text>
                  </View>
                </View>

                {/* Progress */}
                <View style={styles.progressSection}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgress(campaign) * 100}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressText}>
                      <Text style={styles.progressHighlight}>
                        {campaign.currentParticipants}
                      </Text>{" "}
                      / {campaign.targetParticipants} buyers
                    </Text>
                    <Text style={styles.timeLeft}>
                      {getTimeLeft(campaign.deadline)}
                    </Text>
                  </View>
                </View>

                {/* Bottom Info */}
                <View style={styles.cardBottom}>
                  <View style={styles.priceWrap}>
                    <Text style={styles.priceLabel}>Per buyer</Text>
                    <Text style={styles.priceValue}>
                      {campaign.pricePerUser}{" "}
                      <Text style={styles.tokenSymbol}>{campaign.tokenSymbol}</Text>
                    </Text>
                  </View>
                  <View style={styles.escrowBadge}>
                    <Ionicons name="lock-closed" size={12} color={Brand.primary} />
                    <Text style={styles.escrowText}>Solana Escrow</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Bottom spacer */}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Dark.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  logo: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Dark.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.caption,
    color: Dark.textSecondary,
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Dark.border,
  },

  // Hero
  heroBanner: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  heroGradient: {
    backgroundColor: Dark.bgCard,
    borderWidth: 1,
    borderColor: Dark.borderLight,
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  heroContent: {
    padding: Spacing.xl,
  },
  heroTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Dark.text,
    marginBottom: Spacing.xs,
  },
  heroDesc: {
    fontSize: Typography.bodySmall,
    color: Dark.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: {
    alignItems: "center",
    flex: 1,
  },
  heroStatValue: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Brand.primary,
  },
  heroStatLabel: {
    fontSize: Typography.tiny,
    color: Dark.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroDivider: {
    width: 1,
    height: 28,
    backgroundColor: Dark.border,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semiBold,
    color: Dark.text,
  },
  sectionCount: {
    fontSize: Typography.bodySmall,
    color: Dark.textMuted,
    backgroundColor: Dark.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },

  // Card
  card: {
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Dark.border,
    ...Shadows.card,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(0, 229, 160, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Dark.text,
    marginBottom: 3,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sellerName: {
    fontSize: Typography.caption,
    color: Dark.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Progress
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Dark.surface,
    borderRadius: Radius.full,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Brand.primary,
    borderRadius: Radius.full,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: Typography.caption,
    color: Dark.textSecondary,
  },
  progressHighlight: {
    color: Brand.primary,
    fontWeight: Typography.semiBold,
  },
  timeLeft: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
  },

  // Bottom
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
  },
  priceWrap: {},
  priceLabel: {
    fontSize: Typography.tiny,
    color: Dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Dark.text,
  },
  tokenSymbol: {
    fontSize: Typography.bodySmall,
    color: Brand.primary,
    fontWeight: Typography.medium,
  },
  escrowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 229, 160, 0.08)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  escrowText: {
    fontSize: Typography.tiny,
    color: Brand.primary,
    fontWeight: Typography.medium,
  },
});
