import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { getLifiQuoteMock } from "@/services/mock-data";
import { LifiRouteSummary } from "@/types";

const CHAINS = ["Base", "Ethereum", "Polygon", "Arbitrum", "Optimism"];
const TOKENS = ["USDC", "USDT", "ETH", "WETH"];

export default function FundingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedChain, setSelectedChain] = useState("Base");
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("500");
  const [route, setRoute] = useState<LifiRouteSummary | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchRoute = async () => {
    setFetching(true);
    try {
      const { getLifiQuote } = require("@/services/lifi");
      // Amount is hardcoded in demo, but we convert it to decimals (assuming 6 for USDC)
      const amountInUnits = (parseFloat(amount) * 1000000).toString();
      
      const data = await getLifiQuote({
        fromChain: selectedChain,
        toChain: "SOL",
        fromToken: selectedToken,
        toToken: "SOL",
        fromAmount: amountInUnits,
      });

      setRoute({
        fromChain: selectedChain,
        fromToken: selectedToken,
        toChain: "Solana",
        toToken: "SOL",
        estimatedGasUsd: data.estimate.gasCosts[0]?.amountUsd || "0",
        estimatedTimeSeconds: data.estimate.executionDuration || 300,
        routeId: data.id,
        summary: `Bridge ${amount} ${selectedToken} to Solana via ${data.tool}`,
      });
    } catch (err) {
      console.warn("LI.FI fetch failed, falling back to mock");
      const r = await getLifiQuoteMock();
      setRoute({ ...r, fromChain: selectedChain, fromToken: selectedToken });
    } finally {
      setFetching(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Dark.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Cross-chain Funding</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* LI.FI Branding */}
        <View style={s.lifiHeader}>
          <View style={s.lifiIcon}><Ionicons name="swap-horizontal" size={24} color={Brand.lifi} /></View>
          <Text style={s.lifiTitle}>Powered by LI.FI</Text>
          <Text style={s.lifiDesc}>Bridge tokens from any chain to Solana for your escrow deposit.</Text>
        </View>

        {/* From Section */}
        <View style={s.card}>
          <Text style={s.label}>FROM CHAIN</Text>
          <View style={s.chipRow}>
            {CHAINS.map(c => (
              <TouchableOpacity key={c} style={[s.chip, selectedChain === c && s.chipActive]} onPress={() => setSelectedChain(c)}>
                <Text style={[s.chipText, selectedChain === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.label, { marginTop: Spacing.lg }]}>FROM TOKEN</Text>
          <View style={s.chipRow}>
            {TOKENS.map(t => (
              <TouchableOpacity key={t} style={[s.chip, selectedToken === t && s.chipActive]} onPress={() => setSelectedToken(t)}>
                <Text style={[s.chipText, selectedToken === t && s.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Arrow */}
        <View style={s.arrowWrap}>
          <View style={s.arrowCircle}><Ionicons name="arrow-down" size={20} color={Brand.primary} /></View>
        </View>

        {/* To Section */}
        <View style={s.card}>
          <Text style={s.label}>TO</Text>
          <View style={s.toRow}>
            <View style={s.toItem}>
              <View style={s.solanaIcon}><Ionicons name="diamond-outline" size={16} color={Brand.solana} /></View>
              <Text style={s.toText}>Solana</Text>
            </View>
            <View style={s.toItem}>
              <Text style={s.toToken}>SOL</Text>
            </View>
          </View>
        </View>

        {/* Get Route Button */}
        <TouchableOpacity style={s.routeBtn} onPress={fetchRoute} activeOpacity={0.85} disabled={fetching}>
          {fetching ? <ActivityIndicator color={Dark.textInverse} /> : (
            <><Ionicons name="search" size={18} color={Dark.textInverse} /><Text style={s.routeBtnText}>Get Best Route</Text></>
          )}
        </TouchableOpacity>

        {/* Route Result */}
        {route && (
          <View style={s.routeCard}>
            <Text style={s.routeTitle}>Route Found</Text>
            <View style={s.routeRow}><Text style={s.routeLabel}>From</Text><Text style={s.routeValue}>{route.fromChain} {route.fromToken}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>To</Text><Text style={s.routeValue}>Solana SOL</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>Est. Gas</Text><Text style={s.routeValue}>${route.estimatedGasUsd}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>Est. Time</Text><Text style={s.routeValue}>{Math.floor(route.estimatedTimeSeconds/60)} min</Text></View>
            <View style={s.divider} />
            <Text style={s.routeSummary}>{route.summary}</Text>

            <TouchableOpacity style={s.continueBtn} onPress={() => router.push(`/join/${id}`)} activeOpacity={0.85}>
              <Text style={s.continueBtnText}>Continue to Deposit</Text>
              <Ionicons name="arrow-forward" size={18} color={Dark.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Dark.textMuted} />
          <Text style={s.infoText}>The user does not need to understand bridges. Snowball asks LI.FI for the best route and brings the user into Solana SOL before joining the escrow.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Dark.border },
  backBtn: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, justifyContent: "center", alignItems: "center" },
  topTitle: { flex: 1, textAlign: "center", fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  content: { padding: Spacing.xl },
  lifiHeader: { alignItems: "center", marginBottom: Spacing.xl },
  lifiIcon: { width: 56, height: 56, borderRadius: Radius.full, backgroundColor: "rgba(155, 127, 204,0.1)", justifyContent: "center", alignItems: "center", marginBottom: Spacing.md },
  lifiTitle: { fontSize: Typography.h3, fontWeight: Typography.bold, color: Brand.lifi, marginBottom: Spacing.xs },
  lifiDesc: { fontSize: Typography.bodySmall, color: Dark.textSecondary, textAlign: "center" },
  card: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.md },
  label: { fontSize: Typography.tiny, color: Dark.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Dark.surface, borderWidth: 1, borderColor: Dark.border },
  chipActive: { backgroundColor: "rgba(155, 127, 204,0.15)", borderColor: Brand.lifi },
  chipText: { fontSize: Typography.caption, color: Dark.textSecondary },
  chipTextActive: { color: Brand.lifi, fontWeight: Typography.semiBold },
  arrowWrap: { alignItems: "center", marginVertical: Spacing.sm },
  arrowCircle: { width: 36, height: 36, borderRadius: Radius.full, backgroundColor: Dark.bgCard, borderWidth: 1, borderColor: Dark.border, justifyContent: "center", alignItems: "center" },
  toRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  solanaIcon: { width: 28, height: 28, borderRadius: Radius.full, backgroundColor: "rgba(168, 124, 219,0.12)", justifyContent: "center", alignItems: "center" },
  toText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.text },
  toToken: { fontSize: Typography.body, fontWeight: Typography.bold, color: Brand.primary },
  routeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.lifi, paddingVertical: Spacing.lg, borderRadius: Radius.md, marginTop: Spacing.md, marginBottom: Spacing.lg },
  routeBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  routeCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: "rgba(155, 127, 204,0.25)", marginBottom: Spacing.lg },
  routeTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Brand.lifi, marginBottom: Spacing.md },
  routeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  routeLabel: { fontSize: Typography.bodySmall, color: Dark.textMuted },
  routeValue: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  divider: { height: 1, backgroundColor: Dark.border, marginVertical: Spacing.md },
  routeSummary: { fontSize: Typography.caption, color: Dark.textSecondary, fontStyle: "italic", marginBottom: Spacing.lg },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.md, borderRadius: Radius.md },
  continueBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Dark.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Dark.border },
  infoText: { flex: 1, fontSize: Typography.caption, color: Dark.textMuted, lineHeight: 18 },
});
