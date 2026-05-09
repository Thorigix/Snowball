/**
 * Demo Controls — floating panel for advancing campaign state during a demo.
 *
 * Hidden unless DEMO_MODE is enabled in constants/config. Mounted on the
 * campaign feed and detail screens. Lets the presenter walk through:
 *   OPEN → join → FUNDED → mark shipped → SHIPPED → confirm → DELIVERY_REVIEW
 *   → release → RELEASED, or jump back to the start with Reset.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius, Shadows, StatusColors } from "@/constants/theme";
import { DEMO_MODE } from "@/constants/config";
import {
  mockJoinCampaign,
  mockMarkShipped,
  mockConfirmDelivery,
  mockReleaseFunds,
  resetDemoState,
  getConfirmationThreshold,
} from "@/services/mock-data";
import { useCampaigns } from "@/hooks/use-mock-store";
import type { Campaign } from "@/types";

type Props = {
  /** When set, the panel opens focused on this campaign. */
  focusCampaignId?: string;
};

type Action = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  run: () => Promise<{ success: boolean; error?: string }>;
};

function actionsFor(c: Campaign): Action[] {
  const threshold = getConfirmationThreshold(c.targetParticipants);

  switch (c.status) {
    case "OPEN":
      return [
        {
          label: `Join (${c.currentParticipants}/${c.targetParticipants})`,
          icon: "person-add-outline",
          color: Brand.primary,
          run: () => mockJoinCampaign(c.id),
        },
      ];
    case "FUNDED":
      return [
        {
          label: "Mark Shipped",
          icon: "cube-outline",
          color: Brand.warning,
          run: () => mockMarkShipped(c.id),
        },
      ];
    case "SHIPPED":
    case "DELIVERY_REVIEW": {
      const list: Action[] = [
        {
          label: `Confirm Delivery (${c.confirmationsCount}/${threshold})`,
          icon: "checkmark-done-outline",
          color: Brand.secondary,
          run: () => mockConfirmDelivery(c.id),
        },
      ];
      if (c.confirmationsCount >= threshold) {
        list.push({
          label: "Release Funds",
          icon: "send-outline",
          color: Brand.success,
          run: () => mockReleaseFunds(c.id),
        });
      }
      return list;
    }
    case "RELEASED":
      return [];
    default:
      return [];
  }
}

export default function DemoControls({ focusCampaignId }: Props) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const campaigns = useCampaigns();

  if (!DEMO_MODE) return null;

  const ordered = focusCampaignId
    ? [
        ...campaigns.filter((c) => c.id === focusCampaignId),
        ...campaigns.filter((c) => c.id !== focusCampaignId),
      ]
    : campaigns;

  const runAction = async (campaignId: string, action: Action) => {
    if (busyId) return;
    setBusyId(campaignId);
    const result = await action.run();
    setBusyId(null);
    if (!result.success) {
      Alert.alert("Action failed", result.error ?? "Unknown error");
    }
  };

  const handleReset = () => {
    Alert.alert("Reset demo?", "Restore all campaigns to their starting state.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          resetDemoState().catch(() => {});
        },
      },
    ]);
  };

  return (
    <>
      <TouchableOpacity
        style={s.fab}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="play-circle-outline" size={20} color={Dark.bg} />
        <Text style={s.fabText}>Demo</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.backdrop}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.title}>Demo Controls</Text>
                <Text style={s.subtitle}>
                  Advance campaign state for the demo flow
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={s.closeBtn}>
                <Ionicons name="close" size={20} color={Dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={s.body}
              contentContainerStyle={s.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {ordered.map((c) => {
                const actions = actionsFor(c);
                const sc = StatusColors[c.status] ?? StatusColors.OPEN;
                return (
                  <View key={c.id} style={s.card}>
                    <View style={s.cardTop}>
                      <Text style={s.cardTitle} numberOfLines={1}>
                        {c.title}
                      </Text>
                      <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
                        <Text style={[s.statusText, { color: sc.text }]}>
                          {c.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={s.cardMeta}>
                      {c.currentParticipants}/{c.targetParticipants} buyers ·{" "}
                      {c.totalDeposited} {c.tokenSymbol} locked ·{" "}
                      {c.confirmationsCount} confirmations
                    </Text>

                    {actions.length === 0 ? (
                      <Text style={s.terminal}>
                        Campaign complete. Reset to replay.
                      </Text>
                    ) : (
                      <View style={s.actionRow}>
                        {actions.map((a) => (
                          <TouchableOpacity
                            key={a.label}
                            style={[s.actionBtn, { borderColor: a.color }]}
                            onPress={() => runAction(c.id, a)}
                            activeOpacity={0.85}
                            disabled={busyId === c.id}
                          >
                            <Ionicons name={a.icon} size={16} color={a.color} />
                            <Text style={[s.actionLabel, { color: a.color }]}>
                              {busyId === c.id ? "..." : a.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={s.resetBtn}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={18} color={Brand.danger} />
                <Text style={s.resetText}>Reset Demo State</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadows.elevated,
  },
  fabText: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
    color: Dark.bg,
  },

  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: Dark.bgOverlay,
  },
  sheet: {
    backgroundColor: Dark.bgElevated,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingTop: Spacing.lg,
    maxHeight: "85%",
    borderTopWidth: 1,
    borderTopColor: Dark.border,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Dark.border,
  },
  title: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Dark.text,
  },
  subtitle: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },

  body: { flex: 0 },
  bodyContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  card: {
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Dark.border,
    marginBottom: Spacing.md,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Dark.text,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: Typography.tiny,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.5,
  },
  cardMeta: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
    marginBottom: Spacing.md,
  },
  terminal: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: Dark.surface,
  },
  actionLabel: {
    fontSize: Typography.caption,
    fontWeight: Typography.semiBold,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(212, 104, 122, 0.35)",
    backgroundColor: "rgba(212, 104, 122, 0.08)",
    marginTop: Spacing.sm,
  },
  resetText: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Brand.danger,
  },
});
