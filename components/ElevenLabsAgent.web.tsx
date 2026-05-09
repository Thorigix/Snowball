/**
 * ElevenLabs Voice Agent — web variant
 *
 * Two-way voice conversation with the Snowball agent (Sarah). Uses the
 * official @elevenlabs/react SDK over WebRTC for low-latency voice.
 *
 * The native variant (ElevenLabsAgent.tsx) is used on Expo Go and only
 * supports text/output audio; for native voice in/out you'd swap to
 * @elevenlabs/react-native + LiveKit (requires a development build).
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ConversationProvider,
  useConversation,
} from "@elevenlabs/react";
import { Dark, Brand } from "@/constants/theme";
import { ELEVENLABS_AGENT_ID } from "@/constants/config";
import { allCampaigns } from "@/services/mock-data";
import type { Campaign } from "@/types";

const AGENT_ID =
  ELEVENLABS_AGENT_ID || "agent_5901kr50rz2ef1zv27zs7291e3e0";

type AgentStatus = "disconnected" | "connecting" | "connected" | "speaking" | "error";

type Props = {
  focusCampaign?: Campaign;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onStatusChange?: (status: AgentStatus) => void;
};

/** Build a single contextual blob for the focused or all campaigns. */
function buildContext(focus?: Campaign): string {
  if (focus) {
    const pct = Math.round(
      (focus.currentParticipants / focus.targetParticipants) * 100
    );
    return (
      `The user is looking at campaign "${focus.title}" by ${focus.sellerName}. ` +
      `It is ${pct}% funded with ${focus.currentParticipants} out of ${focus.targetParticipants} buyers. ` +
      `Each buyer deposits ${focus.pricePerUser} ${focus.tokenSymbol}. ` +
      `Total required: ${focus.totalRequiredAmount} ${focus.tokenSymbol}, deposited so far: ${focus.totalDeposited} ${focus.tokenSymbol}. ` +
      `Status: ${focus.status}. Description: ${focus.description}. ` +
      `All funds are protected by Solana escrow — seller cannot withdraw until majority confirms delivery.`
    );
  }

  const details = allCampaigns
    .map(
      (c) =>
        `"${c.title}" by ${c.sellerName}: ${c.currentParticipants}/${c.targetParticipants} buyers, ${c.pricePerUser} ${c.tokenSymbol}/buyer, status ${c.status}`
    )
    .join(". ");

  return (
    `Snowball is a group buying platform on Solana. There are ${allCampaigns.length} active campaigns: ${details}. ` +
    `All campaigns use Solana escrow for buyer protection. LI.FI enables cross-chain funding.`
  );
}

function AgentInner({ focusCampaign, onTranscript, onStatusChange }: Props) {
  const conversation = useConversation({
    onConnect: () => {
      console.log("[ElevenLabs] connected");
      onStatusChange?.("connected");
    },
    onDisconnect: () => {
      console.log("[ElevenLabs] disconnected");
      onStatusChange?.("disconnected");
    },
    onError: (err) => {
      console.error("[ElevenLabs] error:", err);
      const msg =
        typeof err === "string"
          ? err
          : (err as any)?.message || "Conversation error";
      setErrorMsg(msg);
      onStatusChange?.("error");
    },
    onStatusChange: ({ status }: { status: string }) => {
      console.log("[ElevenLabs] status:", status);
    },
    onDebug: (info: unknown) => {
      console.log("[ElevenLabs] debug:", info);
    },
    onMessage: (msg: { source: "user" | "ai"; message: string }) => {
      if (!msg?.message) return;
      const role: "user" | "agent" = msg.source === "user" ? "user" : "agent";
      onTranscript?.(role, msg.message);
    },
    onModeChange: ({ mode }: { mode: "speaking" | "listening" }) => {
      onStatusChange?.(mode === "speaking" ? "speaking" : "connected");
    },
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [starting, setStarting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sentInitialContextRef = useRef(false);
  const lastFocusIdRef = useRef<string | undefined>(undefined);

  const status = conversation.status; // "disconnected" | "connecting" | "connected" | "disconnecting"
  const isSpeaking = conversation.isSpeaking;
  const isActive = status === "connected";

  // Pulse the mic button when the agent is speaking.
  useEffect(() => {
    if (isSpeaking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isSpeaking, pulseAnim]);

  // Send campaign context once on connect, and whenever focus changes mid-call.
  useEffect(() => {
    if (status !== "connected") {
      sentInitialContextRef.current = false;
      lastFocusIdRef.current = undefined;
      return;
    }
    const focusId = focusCampaign?.id;
    if (!sentInitialContextRef.current || focusId !== lastFocusIdRef.current) {
      try {
        conversation.sendContextualUpdate(buildContext(focusCampaign));
        sentInitialContextRef.current = true;
        lastFocusIdRef.current = focusId;
      } catch (err) {
        console.warn("[ElevenLabs] contextual update failed:", err);
      }
    }
  }, [status, focusCampaign, conversation]);

  const start = async () => {
    if (starting || isActive) return;
    setErrorMsg("");
    setStarting(true);
    onStatusChange?.("connecting");
    try {
      // Browser permission prompt + WebRTC session.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "websocket",
      });
    } catch (err: any) {
      console.error("[ElevenLabs] start failed:", err);
      setErrorMsg(err?.message ?? "Microphone or connection failed");
      onStatusChange?.("error");
    } finally {
      setStarting(false);
    }
  };

  const stop = async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.warn("[ElevenLabs] end session error:", err);
    }
  };

  const handleToggle = () => {
    if (isActive || status === "connecting" || starting) {
      stop();
    } else {
      start();
    }
  };

  const statusLabel = (() => {
    if (errorMsg) return errorMsg;
    if (starting || status === "connecting") return "Connecting to Snowball AI...";
    if (status === "connected" && isSpeaking) return "Sarah is speaking...";
    if (status === "connected") return "Listening — speak any time";
    return "Tap to talk to Sarah";
  })();

  const buttonState =
    status === "connecting" || starting
      ? "connecting"
      : isSpeaking
      ? "speaking"
      : isActive
      ? "active"
      : errorMsg
      ? "error"
      : "idle";

  return (
    <View style={s.container}>
      <Text style={s.label}>
        {focusCampaign ? "Campaign Voice Assistant" : "Snowball Voice Assistant"}
      </Text>
      <Text style={s.sublabel}>
        {focusCampaign
          ? `Ask Sarah about "${focusCampaign.title}"`
          : "Ask Sarah about any active campaign"}
      </Text>

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            s.micBtn,
            buttonState === "connecting" && s.micBtnConnecting,
            buttonState === "active" && s.micBtnActive,
            buttonState === "speaking" && s.micBtnSpeaking,
            buttonState === "error" && s.micBtnError,
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              buttonState === "speaking"
                ? "volume-high"
                : buttonState === "connecting"
                ? "hourglass-outline"
                : buttonState === "error"
                ? "refresh"
                : isActive
                ? "stop"
                : "mic"
            }
            size={36}
            color={
              buttonState === "error"
                ? Brand.danger
                : isActive || buttonState === "speaking"
                ? "#fff"
                : Dark.textSecondary
            }
          />
        </TouchableOpacity>
      </Animated.View>

      <Text
        style={[s.statusText, errorMsg ? { color: Brand.danger } : undefined]}
      >
        {statusLabel}
      </Text>

      {isActive && (
        <View style={s.activeBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                s.barSegment,
                isSpeaking && {
                  height: 8 + Math.random() * 20,
                  backgroundColor: Brand.primary,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ElevenLabsAgent(props: Props) {
  // Provider must wrap any component that uses the conversation hook.
  return (
    <ConversationProvider>
      <AgentInner {...props} />
    </ConversationProvider>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", paddingVertical: 24 },
  label: {
    fontSize: 18,
    fontWeight: "600",
    color: Dark.text,
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 13,
    color: Dark.textMuted,
    marginBottom: 28,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Dark.bgCard,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Dark.border,
  },
  micBtnConnecting: {
    backgroundColor: Dark.surface,
    borderColor: Dark.textMuted,
    opacity: 0.7,
  },
  micBtnActive: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primaryLight,
  },
  micBtnSpeaking: {
    backgroundColor: Brand.secondary,
    borderColor: Brand.secondaryLight,
  },
  micBtnError: {
    backgroundColor: Dark.bgCard,
    borderColor: Brand.danger,
  },
  statusText: {
    fontSize: 13,
    color: Dark.textMuted,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  activeBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 30,
  },
  barSegment: {
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: Dark.surface,
  },
});
