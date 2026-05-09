import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Typography, Spacing, Radius } from "@/constants/theme";
import { getLifiQuote } from "@/services/lifi";
import { LifiRouteSummary } from "@/types";
import { goBackOrHome } from "@/hooks/use-safe-back";
import { useWallet } from "@/hooks/use-wallet";

type SourceToken = {
  symbol: string;
  decimals: number;
};

type SourceChain = {
  name: string;
  chainId: number;
  tokens: SourceToken[];
};

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<any>;
};

const CHAINS: SourceChain[] = [
  { name: "Base", chainId: 8453, tokens: [{ symbol: "USDC", decimals: 6 }, { symbol: "ETH", decimals: 18 }, { symbol: "WETH", decimals: 18 }] },
  { name: "Ethereum", chainId: 1, tokens: [{ symbol: "USDC", decimals: 6 }, { symbol: "USDT", decimals: 6 }, { symbol: "ETH", decimals: 18 }, { symbol: "WETH", decimals: 18 }] },
  { name: "Polygon", chainId: 137, tokens: [{ symbol: "USDC", decimals: 6 }, { symbol: "USDT", decimals: 6 }, { symbol: "WETH", decimals: 18 }] },
  { name: "Arbitrum", chainId: 42161, tokens: [{ symbol: "USDC", decimals: 6 }, { symbol: "USDT", decimals: 6 }, { symbol: "ETH", decimals: 18 }, { symbol: "WETH", decimals: 18 }] },
  { name: "Optimism", chainId: 10, tokens: [{ symbol: "USDC", decimals: 6 }, { symbol: "USDT", decimals: 6 }, { symbol: "ETH", decimals: 18 }, { symbol: "WETH", decimals: 18 }] },
];

function getEthereumProvider(): EthereumProvider | null {
  return (globalThis as any)?.ethereum ?? null;
}

function decimalToUnits(value: string, decimals: number): string {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid amount.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`Too many decimals for this token. ${decimals} decimals are supported.`);
  }
  return `${whole}${fraction.padEnd(decimals, "0")}`.replace(/^0+(?=\d)/, "");
}

function chainIdHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

function formatTokenUnits(value: string | undefined, decimals: number): string {
  if (!value) return "0";
  const padded = value.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

function isNativeEvmToken(address?: string): boolean {
  return !address || address.toLowerCase() === "0x0000000000000000000000000000000000000000";
}

function strip0x(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function encodeAddress(address: string): string {
  return strip0x(address).toLowerCase().padStart(64, "0");
}

function encodeUint256(value: string): string {
  return BigInt(value).toString(16).padStart(64, "0");
}

function allowanceData(owner: string, spender: string): string {
  return `0xdd62ed3e${encodeAddress(owner)}${encodeAddress(spender)}`;
}

function approveData(spender: string, amount: string): string {
  return `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}`;
}

async function waitForReceipt(provider: EthereumProvider, hash: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    const receipt = await provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });
    if (receipt) {
      if (receipt.status && receipt.status !== "0x1") {
        throw new Error("Approval transaction failed.");
      }
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error("Timed out waiting for approval confirmation.");
}

export default function FundingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedChain, setSelectedChain] = useState<SourceChain>(CHAINS[0]);
  const [selectedToken, setSelectedToken] = useState("USDC");
  const [amount, setAmount] = useState("500");
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [route, setRoute] = useState<LifiRouteSummary | null>(null);
  const [fetching, setFetching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [bridgeTxHash, setBridgeTxHash] = useState("");
  const wallet = useWallet();
  const selectedTokenConfig = useMemo(
    () => selectedChain.tokens.find((t) => t.symbol === selectedToken) ?? selectedChain.tokens[0],
    [selectedChain, selectedToken]
  );

  useEffect(() => {
    if (wallet.address && !toAddress) {
      setToAddress(wallet.address);
    }
  }, [wallet.address, toAddress]);

  const selectChain = (chain: SourceChain) => {
    setSelectedChain(chain);
    setSelectedToken(chain.tokens[0].symbol);
    setRoute(null);
    setBridgeTxHash("");
    setError("");
  };

  const connectEvmWallet = async () => {
    const provider = getEthereumProvider();
    if (!provider) {
      setError("No EVM wallet found. Install MetaMask, Rabby, or another injected EVM wallet.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const account = Array.isArray(accounts) ? accounts[0] : "";
      if (account) {
        setFromAddress(account);
        setError("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "EVM wallet connection failed.");
    }
  };

  const requestLiveRoute = async (): Promise<LifiRouteSummary> => {
    const amountInUnits = decimalToUnits(amount, selectedTokenConfig.decimals);

    const nextRoute = await getLifiQuote({
      fromChain: selectedChain.name,
      toChain: "solana",
      fromToken: selectedToken,
      toToken: "SOL",
      fromAmount: amountInUnits,
      fromAddress,
      toAddress,
    });

    return {
      ...nextRoute,
      fromChain: selectedChain.name,
      fromToken: selectedToken,
      summary:
        nextRoute.summary ?? `Bridge ${amount} ${selectedToken} to Solana through LI.FI`,
    };
  };

  const ensureTokenApproval = async (
    provider: EthereumProvider,
    liveRoute: LifiRouteSummary
  ): Promise<string | null> => {
    const tokenAddress = liveRoute.fromTokenAddress;
    const spender = liveRoute.approvalAddress;
    const requiredAmount = liveRoute.fromAmount;

    if (isNativeEvmToken(tokenAddress) || !spender || !requiredAmount) {
      return null;
    }

    const allowance = await provider.request({
      method: "eth_call",
      params: [
        {
          to: tokenAddress,
          data: allowanceData(fromAddress, spender),
        },
        "latest",
      ],
    });

    const currentAllowance = BigInt(allowance || "0x0");
    const neededAllowance = BigInt(requiredAmount);
    if (currentAllowance >= neededAllowance) {
      return null;
    }

    if (currentAllowance > 0n && selectedToken === "USDT") {
      const resetHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: fromAddress,
            to: tokenAddress,
            data: approveData(spender, "0"),
            value: "0x0",
          },
        ],
      });
      await waitForReceipt(provider, String(resetHash));
    }

    const approvalHash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: fromAddress,
          to: tokenAddress,
          data: approveData(spender, requiredAmount),
          value: "0x0",
        },
      ],
    });
    await waitForReceipt(provider, String(approvalHash));
    return String(approvalHash);
  };

  const fetchRoute = async () => {
    setError("");
    setBridgeTxHash("");
    setFetching(true);
    try {
      setRoute(await requestLiveRoute());
    } catch (err) {
      setRoute(null);
      setError(err instanceof Error ? err.message : "LI.FI quote failed.");
    } finally {
      setFetching(false);
    }
  };

  const executeBridge = async () => {
    if (!route?.transactionRequest) {
      setError("LI.FI did not return an executable transaction request for this route.");
      return;
    }
    const provider = getEthereumProvider();
    if (!provider) {
      setError("No EVM wallet found. Install MetaMask, Rabby, or another injected EVM wallet.");
      return;
    }

    setSending(true);
    setError("");
    try {
      await provider.request({ method: "eth_requestAccounts" });
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex(selectedChain.chainId) }],
        });
      } catch {
        // Some wallets do not support programmatic switching; they will still
        // reject eth_sendTransaction if the user is on the wrong chain.
      }

      let executableRoute = route;
      const approvalHash = await ensureTokenApproval(provider, executableRoute);
      if (approvalHash) {
        setBridgeTxHash(`Approval confirmed: ${approvalHash}`);
        executableRoute = await requestLiveRoute();
        setRoute(executableRoute);
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [executableRoute.transactionRequest],
      });
      setBridgeTxHash(String(txHash));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bridge transaction was rejected or failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => goBackOrHome(router)}>
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

        <View style={s.modeCard}>
          <Text style={s.modeTitle}>Live LI.FI mode</Text>
          <Text style={s.modeText}>This screen calls LI.FI /v1/quote through the Snowball backend. There is no mock fallback.</Text>
          <View style={s.modeDivider} />
          <Text style={s.modeTitle}>Required live parameters</Text>
          <Text style={s.modeText}>
            fromAddress: {fromAddress || "Missing EVM sender"}{"\n"}
            toAddress: {toAddress || "Missing Solana recipient"}{"\n"}
            fromAmount: {amount || "0"} {selectedToken}{"\n"}
            fromChain: {selectedChain.name} · fromToken: {selectedToken}
          </Text>
        </View>

        {/* From Section */}
        <View style={s.card}>
          <Text style={s.label}>EVM SENDER</Text>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="0x sender address"
              placeholderTextColor={Dark.textMuted}
              value={fromAddress}
              onChangeText={setFromAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.smallBtn} onPress={connectEvmWallet} activeOpacity={0.85}>
              <Text style={s.smallBtnText}>Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={[s.label, { marginTop: Spacing.lg }]}>AMOUNT</Text>
          <TextInput
            style={s.input}
            placeholder="500"
            placeholderTextColor={Dark.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Text style={[s.label, { marginTop: Spacing.lg }]}>SOLANA RECIPIENT</Text>
          <TextInput
            style={s.input}
            placeholder="Solana mainnet recipient address"
            placeholderTextColor={Dark.textMuted}
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={s.helpText}>LI.FI bridges to Solana mainnet. Snowball escrow is still devnet, so deposit remains a separate devnet step.</Text>

          <Text style={s.label}>FROM CHAIN</Text>
          <View style={s.chipRow}>
            {CHAINS.map(c => (
              <TouchableOpacity key={c.name} style={[s.chip, selectedChain.name === c.name && s.chipActive]} onPress={() => selectChain(c)}>
                <Text style={[s.chipText, selectedChain.name === c.name && s.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[s.label, { marginTop: Spacing.lg }]}>FROM TOKEN</Text>
          <View style={s.chipRow}>
            {selectedChain.tokens.map(t => (
              <TouchableOpacity key={t.symbol} style={[s.chip, selectedToken === t.symbol && s.chipActive]} onPress={() => setSelectedToken(t.symbol)}>
                <Text style={[s.chipText, selectedToken === t.symbol && s.chipTextActive]}>{t.symbol}</Text>
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
        {error ? (
          <View style={s.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={Brand.danger} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={s.routeBtn} onPress={fetchRoute} activeOpacity={0.85} disabled={fetching}>
          {fetching ? <ActivityIndicator color={Dark.textInverse} /> : (
            <><Ionicons name="search" size={18} color={Dark.textInverse} /><Text style={s.routeBtnText}>Get Live LI.FI Quote</Text></>
          )}
        </TouchableOpacity>

        {/* Route Result */}
        {route && (
          <View style={s.routeCard}>
            <Text style={s.routeTitle}>
              Live LI.FI quote
            </Text>
            <View style={s.routeRow}><Text style={s.routeLabel}>From</Text><Text style={s.routeValue}>{route.fromChain} {route.fromToken}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>To</Text><Text style={s.routeValue}>Solana SOL</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>Tool</Text><Text style={s.routeValue}>{route.tool ?? "LI.FI"}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>Est. Gas</Text><Text style={s.routeValue}>${route.estimatedGasUsd}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>Est. Time</Text><Text style={s.routeValue}>{Math.floor(route.estimatedTimeSeconds/60)} min</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>You send</Text><Text style={s.routeValue}>{formatTokenUnits(route.fromAmount, selectedTokenConfig.decimals)} {selectedToken}</Text></View>
            <View style={s.routeRow}><Text style={s.routeLabel}>You receive</Text><Text style={s.routeValue}>{formatTokenUnits(route.toAmount, 9)} SOL</Text></View>
            <View style={s.divider} />
            <Text style={s.routeSummary}>{route.summary}</Text>

            <TouchableOpacity style={s.bridgeBtn} onPress={executeBridge} activeOpacity={0.85} disabled={sending}>
              {sending ? <ActivityIndicator color={Dark.textInverse} /> : (
                <>
                  <Text style={s.continueBtnText}>Send Bridge Transaction</Text>
                  <Ionicons name="open-outline" size={18} color={Dark.textInverse} />
                </>
              )}
            </TouchableOpacity>

            {bridgeTxHash ? (
              <Text style={s.txText}>Bridge transaction submitted: {bridgeTxHash}</Text>
            ) : null}

            <TouchableOpacity style={s.continueBtn} onPress={() => {
              Alert.alert(
                "Continue to devnet escrow?",
                "LI.FI funds Solana mainnet. The Snowball escrow deposit is currently a separate Solana devnet transaction.",
                [{ text: "Cancel", style: "cancel" }, { text: "Continue", onPress: () => router.push(`/join/${id}`) }]
              );
            }} activeOpacity={0.85}>
              <Text style={s.continueBtnText}>Continue to Deposit</Text>
              <Ionicons name="arrow-forward" size={18} color={Dark.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Dark.textMuted} />
          <Text style={s.infoText}>Snowball asks LI.FI for a real quote and uses the returned transaction request for EVM wallet signing. Production escrow should move from devnet SOL to mainnet token vaults before merging this into one checkout.</Text>
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
  inputRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  input: { flex: 1, minHeight: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Dark.border, backgroundColor: Dark.surface, color: Dark.text, paddingHorizontal: Spacing.md, fontSize: Typography.bodySmall, marginBottom: Spacing.md },
  smallBtn: { minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: Radius.md, backgroundColor: Brand.lifi, alignItems: "center", justifyContent: "center", marginBottom: Spacing.md },
  smallBtnText: { color: Dark.textInverse, fontSize: Typography.caption, fontWeight: Typography.semiBold },
  helpText: { color: Dark.textMuted, fontSize: Typography.caption, lineHeight: 18, marginBottom: Spacing.lg },
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
  errorCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: "rgba(239, 68, 68, 0.12)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.28)", marginBottom: Spacing.md },
  errorText: { flex: 1, color: Brand.danger, fontSize: Typography.caption, lineHeight: 18 },
  routeCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: "rgba(155, 127, 204,0.25)", marginBottom: Spacing.lg },
  modeCard: { backgroundColor: Dark.bgCard, borderRadius: Radius.md, padding: Spacing.lg, borderWidth: 1, borderColor: Dark.border, marginBottom: Spacing.lg },
  modeTitle: { fontSize: Typography.caption, fontWeight: Typography.semiBold, color: Dark.text, marginBottom: 4 },
  modeText: { fontSize: Typography.caption, color: Dark.textMuted, lineHeight: 18 },
  modeDivider: { height: 1, backgroundColor: Dark.border, marginVertical: Spacing.md },
  routeTitle: { fontSize: Typography.h4, fontWeight: Typography.bold, color: Brand.lifi, marginBottom: Spacing.md },
  routeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
  routeLabel: { fontSize: Typography.bodySmall, color: Dark.textMuted },
  routeValue: { fontSize: Typography.bodySmall, color: Dark.text, fontWeight: Typography.medium },
  divider: { height: 1, backgroundColor: Dark.border, marginVertical: Spacing.md },
  routeSummary: { fontSize: Typography.caption, color: Dark.textSecondary, fontStyle: "italic", marginBottom: Spacing.lg },
  bridgeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.lifi, paddingVertical: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm, backgroundColor: Brand.primary, paddingVertical: Spacing.md, borderRadius: Radius.md },
  continueBtnText: { fontSize: Typography.body, fontWeight: Typography.semiBold, color: Dark.textInverse },
  txText: { color: Brand.success, fontSize: Typography.caption, lineHeight: 18, marginBottom: Spacing.md },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, padding: Spacing.lg, backgroundColor: Dark.bgCard, borderRadius: Radius.md, borderWidth: 1, borderColor: Dark.border },
  infoText: { flex: 1, fontSize: Typography.caption, color: Dark.textMuted, lineHeight: 18 },
});
