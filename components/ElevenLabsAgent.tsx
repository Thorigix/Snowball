/**
 * ElevenLabs Voice Agent — Campaign Summarizer
 *
 * Bağlanınca hemen kampanyaları sesli özetler.
 * WebSocket API — works on both web and React Native.
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand } from "@/constants/theme";
import { ELEVENLABS_AGENT_ID } from "@/constants/config";
import { allCampaigns } from "@/services/mock-data";
import type { Campaign } from "@/types";

// Fallback if env var is empty
const AGENT_ID =
  ELEVENLABS_AGENT_ID || "agent_5901kr50rz2ef1zv27zs7291e3e0";

type AgentStatus = "disconnected" | "connecting" | "connected" | "speaking" | "error";

type Props = {
  focusCampaign?: Campaign;
  onTranscript?: (role: "user" | "agent", text: string) => void;
  onStatusChange?: (status: AgentStatus) => void;
};

export default function ElevenLabsAgent({
  focusCampaign,
  onTranscript,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const [errorMsg, setErrorMsg] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pulse animation
  useEffect(() => {
    if (status === "speaking") {
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
      pulseAnim.setValue(1);
    }
  }, [status]);

  const updateStatus = useCallback(
    (s: AgentStatus) => {
      setStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange]
  );

  /** Build context for a specific campaign */
  const buildFocusContext = (c: Campaign): string => {
    const pct = Math.round(
      (c.currentParticipants / c.targetParticipants) * 100
    );
    return (
      `The user is looking at campaign "${c.title}" by ${c.sellerName}. ` +
      `It is ${pct}% funded with ${c.currentParticipants} out of ${c.targetParticipants} buyers. ` +
      `Each buyer deposits ${c.pricePerUser} ${c.tokenSymbol}. ` +
      `Total required: ${c.totalRequiredAmount} ${c.tokenSymbol}, deposited so far: ${c.totalDeposited} ${c.tokenSymbol}. ` +
      `Status: ${c.status}. Description: ${c.description}. ` +
      `All funds are protected by Solana escrow — seller cannot withdraw until majority confirms delivery.`
    );
  };

  /** Build context for all campaigns */
  const buildAllCampaignsContext = (): string => {
    const details = allCampaigns
      .map(
        (c) =>
          `"${c.title}" by ${c.sellerName}: ` +
          `${c.currentParticipants}/${c.targetParticipants} buyers, ` +
          `${c.pricePerUser} ${c.tokenSymbol}/buyer, status ${c.status}`
      )
      .join(". ");

    return (
      `Snowball is a group buying platform on Solana. There are ${allCampaigns.length} active campaigns: ${details}. ` +
      `All campaigns use Solana escrow for buyer protection. LI.FI enables cross-chain funding.`
    );
  };

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    updateStatus("connecting");
    setErrorMsg("");

    console.log("[ElevenLabs] Connecting with agent:", AGENT_ID);

    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${AGENT_ID}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[ElevenLabs] WebSocket opened, sending init...");

        // Send client init — no first_message override (agent config blocks it)
        const initData = {
          type: "conversation_initiation_client_data",
        };

        ws.send(JSON.stringify(initData));
      };

      ws.onmessage = (event) => {
        try {
          const raw =
            typeof event.data === "string"
              ? event.data
              : String(event.data);
          const data = JSON.parse(raw);

          console.log("[ElevenLabs] Message type:", data.type);

          switch (data.type) {
            case "conversation_initiation_metadata":
              console.log(
                "[ElevenLabs] Conversation started:",
                data.conversation_initiation_metadata_event?.conversation_id
              );
              updateStatus("connected");

              // Send campaign data as context so agent can answer about them
              if (ws.readyState === WebSocket.OPEN) {
                const ctx = focusCampaign
                  ? buildFocusContext(focusCampaign)
                  : buildAllCampaignsContext();
                ws.send(
                  JSON.stringify({
                    type: "contextual_update",
                    text: ctx,
                  })
                );
                console.log("[ElevenLabs] Campaign context sent");
              }
              break;

            case "agent_response":
              if (data.agent_response_event?.agent_response) {
                const text = data.agent_response_event.agent_response;
                console.log("[ElevenLabs] Agent says:", text.slice(0, 60));
                onTranscript?.("agent", text);
                updateStatus("speaking");
              }
              break;

            case "user_transcript":
              if (data.user_transcription_event?.user_transcript) {
                const text = data.user_transcription_event.user_transcript;
                console.log("[ElevenLabs] User said:", text.slice(0, 60));
                onTranscript?.("user", text);
                updateStatus("connected");
              }
              break;

            case "audio":
              if (data.audio_event?.audio_base_64) {
                audioQueueRef.current.push(data.audio_event.audio_base_64);
                processAudioQueue();
                if (status !== "speaking") updateStatus("speaking");
              }
              break;

            case "agent_response_correction":
              if (
                data.agent_response_correction_event?.corrected_response
              ) {
                onTranscript?.(
                  "agent",
                  data.agent_response_correction_event.corrected_response
                );
              }
              break;

            case "ping":
              if (data.ping_event) {
                const delay = data.ping_event.ping_ms || 0;
                setTimeout(() => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(
                      JSON.stringify({
                        type: "pong",
                        event_id: data.ping_event.event_id,
                      })
                    );
                    console.log("[ElevenLabs] Pong sent");
                  }
                }, delay);
              }
              break;

            case "interruption":
              console.log("[ElevenLabs] Interruption event");
              audioQueueRef.current = [];
              break;

            case "internal_vad_score":
              // Voice activity detection — ignore
              break;

            case "internal_turn_probability":
              // Turn probability — ignore
              break;

            default:
              console.log("[ElevenLabs] Unhandled:", data.type);
              break;
          }
        } catch (e) {
          console.warn("[ElevenLabs] Parse error:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("[ElevenLabs] WebSocket error:", err);
        setErrorMsg("Connection error");
        updateStatus("error");
      };

      ws.onclose = (event) => {
        console.log(
          "[ElevenLabs] WebSocket closed:",
          event.code,
          event.reason
        );
        wsRef.current = null;
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        clearKeepAlive();

        if (event.code === 1000) {
          updateStatus("disconnected");
        } else {
          setErrorMsg(
            `Disconnected (${event.code}${event.reason ? ": " + event.reason : ""})`
          );
          updateStatus("error");
        }
      };
    } catch (err) {
      console.error("[ElevenLabs] Connection failed:", err);
      setErrorMsg("Failed to connect");
      updateStatus("error");
    }
  }, [onTranscript, updateStatus, focusCampaign]);

  const disconnect = useCallback(() => {
    clearKeepAlive();
    if (wsRef.current) {
      wsRef.current.close(1000, "user_disconnect");
      wsRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setErrorMsg("");
    updateStatus("disconnected");
  }, [updateStatus]);

  const clearKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearKeepAlive();
      if (wsRef.current) {
        wsRef.current.close(1000, "unmount");
        wsRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    if (status === "disconnected" || status === "error") {
      connect();
    } else {
      disconnect();
    }
  };

  const isActive = status === "connected" || status === "speaking";

  /** Sequential audio playback — web only */
  const processAudioQueue = () => {
    if (Platform.OS !== "web") return;
    if (isPlayingRef.current) return;
    if (audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    const base64 = audioQueueRef.current.shift()!;

    try {
      if (!globalThis._elevenLabsAudioCtx) {
        globalThis._elevenLabsAudioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      const ctx: AudioContext = globalThis._elevenLabsAudioCtx;

      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const sampleRate = 16000;
      const numSamples = bytes.length / 2;
      if (numSamples <= 0) {
        isPlayingRef.current = false;
        return;
      }
      const audioBuffer = ctx.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = view.getInt16(i * 2, true) / 32768;
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        } else {
          updateStatus("connected");
        }
      };
      source.start();
    } catch (err) {
      console.warn("[ElevenLabs] Audio error:", err);
      isPlayingRef.current = false;
    }
  };

  const statusLabel = () => {
    switch (status) {
      case "disconnected":
        return "Tap to start voice summary";
      case "connecting":
        return "Connecting to Snowball AI...";
      case "connected":
        return "Listening — speak or wait for summary";
      case "speaking":
        return "Agent speaking...";
      case "error":
        return errorMsg || "Connection failed — tap to retry";
    }
  };

  return (
    <View style={s.container}>
      {/* Label */}
      <Text style={s.label}>
        {focusCampaign ? "Campaign Voice Summary" : "Campaign Summarizer"}
      </Text>
      <Text style={s.sublabel}>
        {focusCampaign
          ? `Tap to hear about "${focusCampaign.title}"`
          : "Tap to hear all active campaigns"}
      </Text>

      {/* Mic Button with pulse */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[
            s.micBtn,
            status === "connecting" && s.micBtnConnecting,
            status === "connected" && s.micBtnActive,
            status === "speaking" && s.micBtnSpeaking,
            status === "error" && s.micBtnError,
          ]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              status === "speaking"
                ? "volume-high"
                : status === "connecting"
                ? "hourglass-outline"
                : status === "error"
                ? "refresh"
                : isActive
                ? "stop"
                : "play"
            }
            size={36}
            color={
              status === "error"
                ? Brand.danger
                : isActive
                ? "#fff"
                : Dark.textSecondary
            }
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Status */}
      <Text
        style={[s.statusText, status === "error" && { color: Brand.danger }]}
      >
        {statusLabel()}
      </Text>

      {/* Audio visualizer */}
      {isActive && (
        <View style={s.activeBar}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                s.barSegment,
                status === "speaking" && {
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

declare global {
  // eslint-disable-next-line no-var
  var _elevenLabsAudioCtx: AudioContext;
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
