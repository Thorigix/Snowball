/**
 * ElevenLabs Voice Agent — native fallback.
 *
 * The web variant (ElevenLabsAgent.web.tsx) provides full two-way voice via
 * @elevenlabs/react. On Expo Go and native builds we surface a clear notice:
 * voice requires the web build or a development build with
 * @elevenlabs/react-native + LiveKit. Text chat (Gemini) on the AI tab still
 * works as the conversational fallback.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand } from "@/constants/theme";
import type { Campaign } from "@/types";

type AgentStatus = "disconnected" | "connecting" | "connected" | "speaking" | "error";

type Props = {
  focusCampaign?: Campaign;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onStatusChange?: (status: AgentStatus) => void;
};

export default function ElevenLabsAgent({ focusCampaign }: Props) {
  return (
    <View style={s.container}>
      <View style={s.iconWrap}>
        <Ionicons name="mic-off-outline" size={32} color={Dark.textMuted} />
      </View>
      <Text style={s.title}>
        {focusCampaign ? "Campaign Voice Assistant" : "Snowball Voice Assistant"}
      </Text>
      <Text style={s.body}>
        Voice with Sarah runs in the browser. Open Snowball with{" "}
        <Text style={s.code}>npm run web</Text> for a live conversation, or use
        the text chat below to ask anything about{" "}
        {focusCampaign ? `"${focusCampaign.title}"` : "active campaigns"}.
      </Text>
      <View style={s.tip}>
        <Ionicons name="information-circle-outline" size={14} color={Brand.primary} />
        <Text style={s.tipText}>
          Native voice requires a development build with{" "}
          <Text style={s.code}>@elevenlabs/react-native</Text>.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: Dark.text,
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    color: Dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(91, 181, 162, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(91, 181, 162, 0.18)",
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: Dark.textMuted,
    lineHeight: 16,
  },
  code: {
    fontFamily: "monospace",
    color: Dark.text,
    backgroundColor: Dark.bgCard,
    paddingHorizontal: 4,
  },
});
