import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import {
  markCampaignJoined,
  mockJoinCampaign,
  refreshCampaignsFromBackend,
} from "@/services/mock-data";
import { fetchBackendCampaign } from "@/services/backend";
import { joinCampaignWithWallet } from "@/services/wallet";
import { useCampaign } from "@/hooks/use-mock-store";
import { useWallet } from "@/hooks/use-wallet";
import { goBackOrHome } from "@/hooks/use-safe-back";

export default function JoinCampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const campaign = useCampaign(id);
  const wallet = useWallet();
  const [joining, setJoining] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleJoin = async () => {
    if (!campaign) return;
    setErrorText("");
    setStatusText("");
    if (campaign.userJoined) {
      const message = "You already joined this campaign.";
      setErrorText(message);
      Alert.alert("Already joined", message);
      return;
    }
    if (!wallet.connected) {
      const message = "Connect Phantom or Solflare from the Wallet tab before depositing.";
      setErrorText(message);
      Alert.alert("Wallet required", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Wallet",
          onPress: () => router.push("/(tabs)/wallet"),
        },
      ]);
      return;
    }

    setJoining(true);
    try {
      if (campaign.id !== "campaign-rtx-5080-demo" && !campaign.campaignPda) {
        setStatusText("Recording low-cost demo deposit...");
        const result = await mockJoinCampaign(campaign.id);
        if (!result.success) {
          throw new Error(result.error ?? "Demo deposit failed");
        }
        router.replace({
          pathname: "/success",
          params: {
            txHash: result.txHash,
            type: "deposit",
            campaignTitle: campaign.title,
            amount: campaign.pricePerUser,
            token: campaign.tokenSymbol,
            escrowPda: campaign.campaignPda ?? "",
            buyerWallet: wallet.address,
            status: "LOCKED",
          },
        });
        return;
      }

      setStatusText("Refreshing devnet campaign...");
      const latestCampaign = await fetchBackendCampaign();
      if (!latestCampaign.campaignPda) {
        throw new Error(
          "Backend did not return a campaign PDA. Check the backend terminal for the devnet initialization error."
        );
      }

      setStatusText("Requesting wallet signature...");
      const signature = await joinCampaignWithWallet(latestCampaign);
      markCampaignJoined(latestCampaign.id);
      setStatusText("Confirming devnet transaction...");
      await refreshCampaignsFromBackend();
      router.replace({
        pathname: "/success",
        params: {
          txHash: signature,
          type: "deposit",
          campaignTitle: latestCampaign.title,
          amount: latestCampaign.pricePerUser,
          token: latestCampaign.tokenSymbol,
          escrowPda: latestCampaign.campaignPda ?? "",
          buyerWallet: wallet.address,
          status: "LOCKED",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      setErrorText(message);
      Alert.alert(
        "Cannot join",
        message
      );
    } finally {
      setStatusText("");
      setJoining(false);
    }
  };

  if (!campaign) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><Text style={{ color: Dark.textSecondary }}>Campaign not found</Text></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => goBackOrHome(router)}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Join Campaign</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Campaign Info */}
        <View style={s.card}>
          <Text style={s.campaignTitle}>{campaign.title}</Text>
          <View style={s.sellerRow}>
            <Ionicons name="storefront-outline" size={14} color={Dark.textSecondary} />
            <Text style={s.seller}>{campaign.sellerName}</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={s.card}>
          <Text style={s.label}>DEPOSIT AMOUNT</Text>
          <Text style={s.amount}>{campaign.pricePerUser} <Text style={s.unit}>{campaign.tokenSymbol}</Text></Text>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowLabel}>Token</Text>
            <Text style={s.rowValue}>{campaign.tokenSymbol}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Network</Text>
            <Text style={s.rowValue}>Solana Devnet</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Destination</Text>
            <Text style={s.rowValue} numberOfLines={1}>
              {campaign.campaignPda ? `${campaign.campaignPda.slice(0, 4)}...${campaign.campaignPda.slice(-4)}` : "Escrow PDA"}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Wallet</Text>
            <Text style={s.rowValue} numberOfLines={1}>
              {wallet.connected ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}` : "Not connected"}
            </Text>
          </View>
        </View>

        {/* Escrow Info */}
        <View style={s.trustCard}>
          <Ionicons name="shield-checkmark" size={20} color={Brand.primary} />
          <Text style={s.trustText}>
            Your funds will be locked in a Solana escrow program. The seller cannot withdraw until delivery is confirmed.
          </Text>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          style={[s.depositBtn, campaign.userJoined && s.depositBtnDisabled]}
          onPress={handleJoin}
          activeOpacity={0.85}
          disabled={joining || campaign.userJoined}
        >
          {joining ? (
            <ActivityIndicator color={Dark.textInverse} />
          ) : (
            <>
              <Ionicons
                name={
                  campaign.userJoined
                    ? "checkmark-circle"
                    : wallet.connected
                      ? "lock-closed"
                      : "wallet-outline"
                }
                size={20}
                color={Dark.textInverse}
              />
              <Text style={s.depositBtnText}>
                {campaign.userJoined
                  ? "Already Joined"
                  : wallet.connected
                    ? "Sign Deposit"
                    : "Connect Wallet First"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        {statusText ? (
          <View style={s.statusBox}>
            <ActivityIndicator color={Brand.primary} size="small" />
            <Text style={s.statusText}>{statusText}</Text>
          </View>
        ) : null}
        {errorText ? (
          <View style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Brand.danger} />
            <Text style={s.errorText}>{errorText}</Text>
          </View>
        ) : null}

        <Text style={s.disclaimer}>
          By depositing, you agree to the group buy terms. Funds will be released to the seller only after delivery confirmation by the majority of buyers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { padding: Spacing.xl },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  campaignTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.sm },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  seller: { fontSize: Typography.bodySmall, color: Dark.textSecondary },
  label: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  amount: { fontSize: 36, fontWeight: Typography.bold, color: Dark.text, marginBottom: Spacing.md },
  unit: { fontSize: Typography.h3, color: Brand.primary },
  divider: { height: 1, backgroundColor: Dark.border, marginVertical: Spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  rowLabel: { fontSize: Typography.bodySmall, color: Dark.textMuted },
  rowValue: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  trustCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md, backgroundColor: "rgba(91, 181, 162,0.06)", borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: "rgba(91, 181, 162,0.15)", marginBottom: Spacing.xl },
  trustText: { flex: 1, fontSize: Typography.caption, color: Dark.textSecondary, lineHeight: 18 },
  depositBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.lg, borderRadius: Radius.md, marginBottom: Spacing.lg },
  depositBtnDisabled: { backgroundColor: Dark.bgCard, borderWidth: 1, borderColor: Dark.border },
  depositBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  statusBox: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.md },
  statusText: { flex: 1, fontSize: Typography.caption, color: Dark.textSecondary },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, backgroundColor: "rgba(239, 68, 68,0.1)", borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: "rgba(239, 68, 68,0.25)", marginBottom: Spacing.md },
  errorText: { flex: 1, fontSize: Typography.caption, color: Brand.danger, lineHeight: 18 },
  disclaimer: { fontSize: Typography.caption, color: Dark.textMuted, textAlign: "center", lineHeight: 18 },
});
