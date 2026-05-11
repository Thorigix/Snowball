import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand } from "@/constants/theme";
import type { Campaign } from "@/types";

type Props = {
  focusCampaign?: Campaign;
  onTranscript?: (role: "user" | "agent", text: string) => void;
};

export function VoiceAgentPanel(_props: Props) {
  return (
    <View style={s.nativeBanner}>
      <View style={s.nativeBannerIcon}>
        <Ionicons name="mic-off-outline" size={22} color={Brand.warning} />
      </View>
      <Text style={s.nativeBannerTitle}>Voice agent is web-only</Text>
      <Text style={s.nativeBannerDesc}>
        Sarah uses browser audio APIs. Open this demo in Chrome or Brave to talk
        to her. Text chat below still works on mobile.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  nativeBanner: {
    backgroundColor: Dark.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${Brand.warning}33`,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginVertical: 24,
  },
  nativeBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Brand.warning}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  nativeBannerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Dark.text,
    marginBottom: 6,
  },
  nativeBannerDesc: {
    fontSize: 12,
    color: Dark.textMuted,
    textAlign: "center",
    lineHeight: 17,
  },
});
