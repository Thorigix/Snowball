import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand, Spacing } from "@/constants/theme";
import ElevenLabsAgent from "@/components/ElevenLabsAgent";
import { getAiCampaignSummary, getAiRiskSummary, allCampaigns } from "@/services/mock-data";
import { useLocalSearchParams } from "expo-router";
import { Campaign } from "@/types";

type Message = {
  id: string;
  role: "user" | "agent";
  text: string;
};

export default function AiTabScreen() {
  const params = useLocalSearchParams<{ campaignId?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState("disconnected");
  const scrollRef = useRef<ScrollView>(null);

  // Find focused campaign if coming from campaign detail
  const focusCampaign: Campaign | undefined = params.campaignId
    ? allCampaigns.find((c) => c.id === params.campaignId)
    : undefined;

  const addTranscript = (role: "user" | "agent", text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString() + role, role, text },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Text-based AI for typed questions
  const sendTextMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const t = text.trim();
    setInput("");
    addTranscript("user", t);
    setIsLoading(true);

    let response = "";
    const lower = t.toLowerCase();

    if (lower.includes("escrow") || lower.includes("protect")) {
      response =
        "Your funds are locked in a Solana escrow program. " +
        "The seller cannot withdraw until enough buyers confirm delivery. " +
        "If the seller doesn't ship, you get a full refund.";
    } else if (lower.includes("campaign") || lower.includes("explain")) {
      const id = focusCampaign?.id || "campaign-rtx-5080-demo";
      response = await getAiCampaignSummary(id);
    } else if (
      lower.includes("safe") ||
      lower.includes("risk") ||
      lower.includes("seller")
    ) {
      const risk = await getAiRiskSummary();
      response = `Risk Level: ${risk.riskLevel.toUpperCase()} - ${risk.summary}`;
    } else if (
      lower.includes("lifi") ||
      lower.includes("bridge") ||
      lower.includes("chain")
    ) {
      response =
        "LI.FI finds the best route to bridge tokens from any chain to Solana. " +
        "You can start with USDC on Base and get SOL for your escrow deposit.";
    } else {
      response =
        "I can help you with:\n" +
        "- How Solana escrow protects your funds\n" +
        "- Campaign details and status\n" +
        "- LI.FI cross-chain routes\n" +
        "- Seller risk assessment\n" +
        "Try asking about one of these topics.";
    }

    addTranscript("agent", response);
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Snowball AI</Text>
          <Text style={s.headerSub}>
            {focusCampaign
              ? `Analyzing: ${focusCampaign.title}`
              : "Voice Campaign Summarizer"}
          </Text>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="mic" size={16} color={Brand.primary} />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.body}
        contentContainerStyle={s.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Voice Agent */}
        <ElevenLabsAgent
          focusCampaign={focusCampaign}
          onTranscript={addTranscript}
          onStatusChange={(s) => setAgentStatus(s)}
        />

        {/* Quick ask chips */}
        <View style={s.chipRow}>
          {[
            { q: "Tell me about the campaigns", icon: "list-outline" as const },
            { q: "How does escrow work?", icon: "shield-checkmark-outline" as const },
            { q: "Is this seller safe?", icon: "alert-circle-outline" as const },
          ].map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={s.chip}
              onPress={() => sendTextMessage(chip.q)}
              activeOpacity={0.7}
            >
              <Ionicons name={chip.icon} size={14} color={Brand.primary} />
              <Text style={s.chipText}>{chip.q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Divider */}
        {messages.length > 0 && (
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>Conversation</Text>
            <View style={s.dividerLine} />
          </View>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              s.bubble,
              msg.role === "user" ? s.userBubble : s.agentBubble,
            ]}
          >
            {msg.role === "agent" && (
              <View style={s.agentDot}>
                <Ionicons name="sparkles" size={10} color={Brand.primary} />
              </View>
            )}
            <View
              style={[
                s.bubbleContent,
                msg.role === "user" ? s.userContent : s.agentContent,
              ]}
            >
              <Text
                style={[
                  s.bubbleText,
                  msg.role === "user" ? s.userText : s.agentText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[s.bubble, s.agentBubble]}>
            <View style={s.agentDot}>
              <Ionicons name="sparkles" size={10} color={Brand.primary} />
            </View>
            <View style={[s.bubbleContent, s.agentContent]}>
              <Text style={s.thinkingText}>Thinking...</Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Text Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          placeholder="Type a question..."
          placeholderTextColor={Dark.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendTextMessage(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, !input.trim() && s.sendBtnDisabled]}
          onPress={() => sendTextMessage(input)}
          disabled={!input.trim() || isLoading}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={input.trim() ? Dark.bg : Dark.textMuted}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Dark.bg },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Dark.text },
  headerSub: { fontSize: 11, color: Dark.textMuted, marginTop: 2 },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Brand.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },

  // Body
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 24 },

  // Quick chips
  chipRow: {
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Dark.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  chipText: { fontSize: 13, color: Dark.textSecondary },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Dark.border },
  dividerText: { fontSize: 11, color: Dark.textMuted },

  // Bubbles
  bubble: { flexDirection: "row", marginBottom: 10, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  agentBubble: { alignSelf: "flex-start" },
  agentDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${Brand.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  bubbleContent: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "90%",
  },
  userContent: { backgroundColor: Brand.primary, borderBottomRightRadius: 4 },
  agentContent: { backgroundColor: Dark.bgCard, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userText: { color: Dark.bg },
  agentText: { color: Dark.text },
  thinkingText: { fontSize: 13, color: Dark.textMuted, fontStyle: "italic" },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
  },
  input: {
    flex: 1,
    backgroundColor: Dark.bgCard,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Dark.text,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: Dark.surface },
});
