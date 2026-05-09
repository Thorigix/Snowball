import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Spacing, Radius } from "@/constants/theme";
import {
  connectWallet,
  disconnectWallet,
} from "@/services/wallet";
import { useWallet } from "@/hooks/use-wallet";

export default function WalletScreen() {
  const wallet = useWallet();
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleConnect = async () => {
    setBusy(true);
    setErrorText("");
    try {
      await connectWallet();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not connect wallet";
      setErrorText(message);
      Alert.alert(
        "Wallet connection failed",
        message
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnectWallet();
    } finally {
      setBusy(false);
    }
  };

  if (!wallet.connected) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <ScrollView contentContainerStyle={s.scrollCenter} showsVerticalScrollIndicator={false}>
          <View style={s.connectIcon}>
            <Ionicons name="wallet-outline" size={48} color={Dark.textMuted} />
          </View>
          <Text style={s.connectTitle}>Connect Wallet</Text>
          <Text style={s.connectDesc}>
            Link your Solana wallet to deposit into escrow campaigns and track your group buys.
          </Text>
          <TouchableOpacity style={s.connectBtn} onPress={handleConnect} activeOpacity={0.7} disabled={busy}>
            <Ionicons name="link-outline" size={18} color={Dark.bg} />
            <Text style={s.connectBtnText}>{busy ? "Connecting..." : "Connect Wallet"}</Text>
          </TouchableOpacity>
          {errorText ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Brand.danger} />
              <Text style={s.errorText}>{errorText}</Text>
            </View>
          ) : null}

          {/* Info Items */}
          <View style={s.infoList}>
            <View style={s.infoItem}>
              <View style={[s.infoIcon, { backgroundColor: `${Brand.primary}12` }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color={Brand.primary} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>Escrow Protection</Text>
                <Text style={s.infoDesc}>Funds locked until delivery is confirmed</Text>
              </View>
            </View>
            <View style={s.infoItem}>
              <View style={[s.infoIcon, { backgroundColor: `${Brand.secondary}12` }]}>
                <Ionicons name="swap-horizontal-outline" size={18} color={Brand.secondary} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoTitle}>Cross-chain Funding</Text>
                <Text style={s.infoDesc}>Bridge from any chain via LI.FI</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Connected State
  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Wallet</Text>
          <TouchableOpacity onPress={handleDisconnect} disabled={busy}>
            <Text style={s.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>

        {/* Balance */}
        <View style={s.balanceSection}>
          <Text style={s.balanceLabel}>Balance</Text>
          <Text style={s.balanceValue}>
            {wallet.balanceSol == null ? "--" : wallet.balanceSol.toFixed(4)}{" "}
            <Text style={s.balanceCurrency}>SOL</Text>
          </Text>
          <Text style={s.balanceUsd}>{wallet.providerName}</Text>
        </View>

        {/* Network */}
        <View style={s.networkRow}>
          <View style={s.networkDot} />
          <Text style={s.networkText}>Solana Devnet</Text>
        </View>

        {/* Actions */}
        <View style={s.actionRow}>
          {[
            { icon: "arrow-down-outline", label: "Deposit" },
            { icon: "arrow-up-outline", label: "Send" },
            { icon: "swap-horizontal-outline", label: "Bridge" },
            { icon: "time-outline", label: "History" },
          ].map((a, i) => (
            <TouchableOpacity key={i} style={s.actionItem}>
              <View style={s.actionIconWrap}>
                <Ionicons name={a.icon as any} size={20} color={Dark.text} />
              </View>
              <Text style={s.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Escrows */}
        <Text style={s.sectionTitle}>Active Escrows</Text>
        {[
          { title: "RTX 5080 Group Buy", amount: "0.05", status: "Locked" },
          { title: "AirPods Pro 3", amount: "0.03", status: "Locked" },
        ].map((e, i) => (
          <View key={i} style={s.escrowItem}>
            <View style={s.escrowLeft}>
              <View style={s.escrowDot} />
              <View>
                <Text style={s.escrowTitle}>{e.title}</Text>
                <Text style={s.escrowStatus}>{e.status}</Text>
              </View>
            </View>
            <Text style={s.escrowAmount}>{e.amount} SOL</Text>
          </View>
        ))}

        {/* Wallet Address */}
        <View style={s.addressCard}>
          <Text style={s.addressLabel}>Wallet Address</Text>
          <Text style={s.addressValue} numberOfLines={1}>
            {wallet.address}
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  scrollCenter: { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 40, paddingBottom: 60 },

  // Connect state
  connectIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  connectTitle: { fontSize: 24, fontWeight: "700", color: Dark.text, marginBottom: 10 },
  connectDesc: { fontSize: 14, color: Dark.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 32 },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 48,
  },
  connectBtnText: { fontSize: 15, fontWeight: "600", color: Dark.bg },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderRadius: 12,
    padding: 12,
    marginTop: -32,
    marginBottom: 32,
  },
  errorText: { flex: 1, fontSize: 12, color: Brand.danger, lineHeight: 17 },

  infoList: { width: "100%", gap: 16 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: "600", color: Dark.text, marginBottom: 2 },
  infoDesc: { fontSize: 12, color: Dark.textMuted },

  // Connected header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: Dark.text },
  disconnectText: { fontSize: 13, color: Brand.danger, fontWeight: "500" },

  // Balance
  balanceSection: { marginBottom: 12 },
  balanceLabel: { fontSize: 13, color: Dark.textMuted, marginBottom: 6 },
  balanceValue: { fontSize: 42, fontWeight: "700", color: Dark.text, letterSpacing: -1.5 },
  balanceCurrency: { fontSize: 20, fontWeight: "500", color: Dark.textSecondary },
  balanceUsd: { fontSize: 14, color: Dark.textMuted, marginTop: 4 },

  // Network
  networkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 32,
    marginTop: 8,
  },
  networkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Brand.success },
  networkText: { fontSize: 12, color: Dark.textMuted },
  // Actions
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: { fontSize: 11, color: Dark.textMuted, fontWeight: "500" },

  // Section
  sectionTitle: { fontSize: 17, fontWeight: "600", color: Dark.text, marginBottom: 16 },

  // Escrow items
  escrowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Dark.border,
  },
  escrowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  escrowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.warning,
  },
  escrowTitle: { fontSize: 14, fontWeight: "500", color: Dark.text },
  escrowStatus: { fontSize: 11, color: Dark.textMuted, marginTop: 1 },
  escrowAmount: { fontSize: 14, fontWeight: "600", color: Dark.text },

  // Address
  addressCard: {
    marginTop: 32,
    backgroundColor: Dark.bgCard,
    borderRadius: 14,
    padding: 16,
  },
  addressLabel: { fontSize: 11, color: Dark.textMuted, marginBottom: 4 },
  addressValue: { fontSize: 14, fontWeight: "500", color: Dark.textSecondary, fontFamily: "monospace" },
});
