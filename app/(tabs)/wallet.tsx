import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Dark, Brand, Typography, Spacing, Radius, Shadows } from "@/constants/theme";

export default function WalletScreen() {
  const [connected, setConnected] = useState(false);
  const [walletAddress] = useState("7xKX...m9Qp");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <View style={styles.walletIcon}>
              <Ionicons name="wallet" size={28} color={Brand.primary} />
            </View>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Devnet</Text>
            </View>
          </View>

          {connected ? (
            <>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balance}>
                0.245 <Text style={styles.balanceCurrency}>SOL</Text>
              </Text>
              <View style={styles.addressRow}>
                <Text style={styles.addressLabel}>Address</Text>
                <Text style={styles.address}>{walletAddress}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.connectTitle}>Connect Your Wallet</Text>
              <Text style={styles.connectDesc}>
                Connect a Solana wallet to deposit funds into escrow campaigns.
              </Text>
            </>
          )}

          <TouchableOpacity
            style={[styles.connectButton, connected && styles.disconnectButton]}
            onPress={() => setConnected(!connected)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={connected ? "log-out-outline" : "link"}
              size={18}
              color={connected ? Brand.danger : Dark.textInverse}
            />
            <Text
              style={[
                styles.connectButtonText,
                connected && styles.disconnectButtonText,
              ]}
            >
              {connected ? "Disconnect" : "Connect Wallet"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark" size={20} color={Brand.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Escrow Protection</Text>
            <Text style={styles.infoDesc}>
              Your funds are locked in a Solana escrow program. The seller cannot
              withdraw until delivery is confirmed.
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="swap-horizontal" size={20} color={Brand.lifi} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Cross-chain Funding</Text>
            <Text style={styles.infoDesc}>
              Fund from any chain using LI.FI bridge. Your tokens are converted
              to Solana SOL for the escrow deposit.
            </Text>
          </View>
        </View>

        {/* Transaction History Placeholder */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Recent Activity</Text>
          {connected ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={32} color={Dark.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Join a campaign to make your first deposit
              </Text>
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="wallet-outline" size={32} color={Dark.textMuted} />
              <Text style={styles.emptyText}>Connect wallet to view activity</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Dark.bg,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Dark.text,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },

  // Wallet Card
  walletCard: {
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Dark.border,
    marginBottom: Spacing.lg,
    ...Shadows.elevated,
  },
  walletTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  walletIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(0, 229, 160, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  networkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(153, 69, 255, 0.12)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.solana,
  },
  networkText: {
    fontSize: Typography.caption,
    color: Brand.solana,
    fontWeight: Typography.semiBold,
  },

  // Connected
  balanceLabel: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontSize: 36,
    fontWeight: Typography.bold,
    color: Dark.text,
    marginBottom: Spacing.lg,
  },
  balanceCurrency: {
    fontSize: Typography.h3,
    color: Brand.primary,
  },
  addressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Dark.bgInput,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  addressLabel: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
  },
  address: {
    fontSize: Typography.bodySmall,
    color: Dark.text,
    fontFamily: "monospace",
  },

  // Disconnected
  connectTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.semiBold,
    color: Dark.text,
    marginBottom: Spacing.sm,
  },
  connectDesc: {
    fontSize: Typography.bodySmall,
    color: Dark.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },

  // Buttons
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Brand.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  connectButtonText: {
    fontSize: Typography.body,
    fontWeight: Typography.semiBold,
    color: Dark.textInverse,
  },
  disconnectButton: {
    backgroundColor: "rgba(255, 77, 106, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 106, 0.3)",
  },
  disconnectButtonText: {
    color: Brand.danger,
  },

  // Info Cards
  infoCard: {
    flexDirection: "row",
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Dark.border,
    marginBottom: Spacing.md,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "rgba(0, 229, 160, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semiBold,
    color: Dark.text,
    marginBottom: 4,
  },
  infoDesc: {
    fontSize: Typography.caption,
    color: Dark.textSecondary,
    lineHeight: 18,
  },

  // History
  historySection: {
    marginTop: Spacing.lg,
  },
  historyTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semiBold,
    color: Dark.text,
    marginBottom: Spacing.md,
  },
  emptyHistory: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.lg,
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Dark.border,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: Typography.bodySmall,
    color: Dark.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.caption,
    color: Dark.textMuted,
    marginTop: 4,
  },
});
