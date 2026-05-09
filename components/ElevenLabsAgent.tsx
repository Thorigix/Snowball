/**
 * ElevenLabs Voice Agent — Web Implementation
 * Uses @elevenlabs/react SDK (browser-only, uses WebRTC/WebSocket)
 */
import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand } from "@/constants/theme";
import { ELEVENLABS_AGENT_ID } from "@/constants/config";
import { allCampaigns } from "@/services/mock-data";

// @elevenlabs/react is web-only (uses browser APIs)
let useConversation: any = null;
try {
  useConversation = require("@elevenlabs/react").useConversation;
} catch {
  // Will be null on native
}

type Props = {
  onTranscript?: (role: "user" | "agent", text: string) => void;
};

export default function ElevenLabsAgent({ onTranscript }: Props) {
  if (!useConversation) {
    return (
      <View style={s.fallback}>
        <Ionicons name="alert-circle-outline" size={24} color={Dark.textMuted} />
        <Text style={s.fallbackText}>
          Voice agent requires web platform or development build.
        </Text>
      </View>
    );
  }

  return <WebAgent onTranscript={onTranscript} />;
}

function WebAgent({ onTranscript }: Props) {
  const conversation = useConversation!({
    onConnect: () => console.log("[ElevenLabs] Connected"),
    onDisconnect: () => console.log("[ElevenLabs] Disconnected"),
    onMessage: (msg: any) => {
      if (msg.source === "user" && msg.message) {
        onTranscript?.("user", msg.message);
      }
      if (msg.source === "ai" && msg.message) {
        onTranscript?.("agent", msg.message);
      }
    },
    onError: (err: any) => console.error("[ElevenLabs] Error:", err),
  });

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  const handleToggle = async () => {
    if (isConnected) {
      await conversation.endSession();
    } else {
      try {
        // Request mic
        await navigator.mediaDevices.getUserMedia({ audio: true });
        // Start session
        await conversation.startSession({
          agentId: ELEVENLABS_AGENT_ID,
        });
        // Send campaign context
        const ctx = buildCampaignContext();
        conversation.sendContextualUpdate(ctx);
      } catch (err) {
        console.error("[ElevenLabs] Start failed:", err);
      }
    }
  };

  const sendText = (text: string) => {
    if (isConnected && conversation.sendUserMessage) {
      conversation.sendUserMessage(text);
      onTranscript?.("user", text);
    }
  };

  return (
    <View style={s.agentContainer}>
      {/* Mic Button */}
      <TouchableOpacity
        style={[
          s.micBtn,
          isConnected && s.micBtnActive,
          isSpeaking && s.micBtnSpeaking,
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isConnected ? (isSpeaking ? "volume-high" : "mic") : "mic-outline"}
          size={36}
          color={isConnected ? Dark.bg : Dark.textSecondary}
        />
      </TouchableOpacity>

      {/* Status */}
      <Text style={s.statusText}>
        {isConnected
          ? isSpeaking
            ? "Agent is speaking..."
            : "Listening..."
          : "Tap to start voice"}
      </Text>

      {/* Quick Questions */}
      {isConnected && (
        <View style={s.quickRow}>
          {[
            "Tell me about the campaigns",
            "How does escrow work?",
            "Is this seller safe?",
          ].map((q, i) => (
            <TouchableOpacity
              key={i}
              style={s.quickChip}
              onPress={() => sendText(q)}
              activeOpacity={0.7}
            >
              <Text style={s.quickText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function buildCampaignContext(): string {
  const lines = allCampaigns.map(
    (c) =>
      `Campaign "${c.title}" by ${c.sellerName}: ` +
      `${c.currentParticipants}/${c.targetParticipants} buyers joined, ` +
      `${c.pricePerUser} ${c.tokenSymbol} per buyer, ` +
      `status ${c.status}. ${c.description}`
  );
  return (
    "Current Snowball campaigns:\n" +
    lines.join("\n") +
    "\n\nSnowball uses Solana escrow to protect buyers. " +
    "Funds are locked until delivery is confirmed by majority of buyers. " +
    "LI.FI enables cross-chain funding from any EVM chain."
  );
}

const s = StyleSheet.create({
  agentContainer: { alignItems: "center", paddingVertical: 20 },
  micBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  micBtnActive: {
    backgroundColor: Brand.primary,
  },
  micBtnSpeaking: {
    backgroundColor: Brand.secondary,
  },
  statusText: {
    fontSize: 14,
    color: Dark.textMuted,
    marginBottom: 20,
  },
  quickRow: {
    gap: 8,
    width: "100%",
    paddingHorizontal: 16,
  },
  quickChip: {
    backgroundColor: Dark.bgCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  quickText: { fontSize: 13, color: Dark.textSecondary },
  fallback: {
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  fallbackText: {
    fontSize: 13,
    color: Dark.textMuted,
    textAlign: "center",
  },
});
