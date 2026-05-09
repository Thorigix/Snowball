/**
 * ElevenLabs Voice Agent — Campaign Summarizer
 * 
 * Bağlanınca hemen kampanyaları sesli özetler.
 * WebSocket API kullanır (web + React Native).
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

type AgentStatus = "disconnected" | "connecting" | "connected" | "speaking";

type Props = {
  /** Belirli bir kampanyayı özetle (Campaign Detail'den gelince) */
  focusCampaign?: Campaign;
  /** Transcript callback — chat UI'a mesaj aktarır */
  onTranscript?: (role: "user" | "agent", text: string) => void;
  /** Status callback */
  onStatusChange?: (status: AgentStatus) => void;
};

export default function ElevenLabsAgent({
  focusCampaign,
  onTranscript,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);

  // Pulse animation when speaking
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

  /** Kampanya özetini agent'ın first_message'ı olarak oluştur */
  const buildFirstMessage = (): string => {
    if (focusCampaign) {
      const c = focusCampaign;
      const pct = Math.round(
        (c.currentParticipants / c.targetParticipants) * 100
      );
      return (
        `Let me tell you about this campaign. ` +
        `"${c.title}" by ${c.sellerName}. ` +
        `It's currently ${pct} percent funded with ${c.currentParticipants} out of ${c.targetParticipants} buyers. ` +
        `Each buyer deposits ${c.pricePerUser} ${c.tokenSymbol}. ` +
        `${c.description} ` +
        `The campaign status is ${c.status}. ` +
        `All funds are protected by Solana escrow until delivery is confirmed.`
      );
    }

    // Tüm kampanyaları özetle
    const summaries = allCampaigns.map((c) => {
      const pct = Math.round(
        (c.currentParticipants / c.targetParticipants) * 100
      );
      return `"${c.title}" by ${c.sellerName}, ${pct}% funded, ${c.pricePerUser} ${c.tokenSymbol} per buyer`;
    });

    return (
      `Welcome to Snowball! I'll summarize the active campaigns for you. ` +
      `There are ${allCampaigns.length} campaigns right now. ` +
      summaries.join(". ") +
      `. All campaigns use Solana escrow for buyer protection. Would you like to know more about any of these?`
    );
  };

  /** Agent prompt — kampanya bilgilerini içerir */
  const buildPrompt = (): string => {
    const campaignDetails = allCampaigns
      .map(
        (c) =>
          `- "${c.title}" by ${c.sellerName}: ` +
          `${c.currentParticipants}/${c.targetParticipants} buyers, ` +
          `${c.pricePerUser} ${c.tokenSymbol}/buyer, ` +
          `total ${c.totalRequiredAmount} ${c.tokenSymbol}, ` +
          `deposited ${c.totalDeposited} ${c.tokenSymbol}, ` +
          `status: ${c.status}. ` +
          c.description
      )
      .join("\n");

    return (
      "You are Snowball AI, a voice assistant for the Snowball group buying platform on Solana blockchain. " +
      "Your role is to summarize campaigns, explain escrow protection, and help users understand group buys.\n\n" +
      "Key facts:\n" +
      "- Snowball uses Solana escrow programs to protect buyer funds\n" +
      "- Sellers cannot withdraw until majority of buyers confirm delivery\n" +
      "- LI.FI enables cross-chain funding from Ethereum, Base, Polygon, Arbitrum, Optimism\n" +
      "- If delivery fails, buyers get automatic refund\n\n" +
      "Active campaigns:\n" +
      campaignDetails +
      "\n\nSpeak naturally and concisely. Summarize campaigns when asked. " +
      "Warn about risks when relevant. Be helpful and reassuring about escrow protection."
    );
  };

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    updateStatus("connecting");

    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Kampanya context + first_message ile başlat
      ws.send(
        JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: buildPrompt(),
              },
              first_message: buildFirstMessage(),
            },
          },
        })
      );
      updateStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        switch (data.type) {
          case "agent_response":
            if (data.agent_response_event?.agent_response) {
              onTranscript?.(
                "agent",
                data.agent_response_event.agent_response
              );
              updateStatus("speaking");
            }
            break;

          case "user_transcript":
            if (data.user_transcription_event?.user_transcript) {
              onTranscript?.(
                "user",
                data.user_transcription_event.user_transcript
              );
              updateStatus("connected");
            }
            break;

          case "audio":
            if (data.audio_event?.audio_base_64) {
              // Queue audio for sequential playback
              audioQueueRef.current.push(data.audio_event.audio_base_64);
              processAudioQueue();
              updateStatus("speaking");
            }
            break;

          case "agent_response_correction":
            if (data.agent_response_correction_event?.corrected_response) {
              onTranscript?.(
                "agent",
                data.agent_response_correction_event.corrected_response
              );
            }
            break;

          case "ping":
            if (data.ping_event) {
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(
                    JSON.stringify({
                      type: "pong",
                      event_id: data.ping_event.event_id,
                    })
                  );
                }
              }, data.ping_event.ping_ms || 0);
            }
            break;

          case "conversation_initiation_metadata":
            updateStatus("connected");
            break;

          default:
            break;
        }
      } catch {
        // ignore
      }
    };

    ws.onerror = () => {
      updateStatus("disconnected");
    };

    ws.onclose = () => {
      wsRef.current = null;
      audioQueueRef.current = [];
      isPlayingRef.current = false;
      updateStatus("disconnected");
    };
  }, [onTranscript, updateStatus, focusCampaign]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    updateStatus("disconnected");
  }, [updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    if (status === "disconnected") {
      connect();
    } else {
      disconnect();
    }
  };

  const isActive = status === "connected" || status === "speaking";

  /** Audio queue processor — web only */
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

      // PCM 16-bit mono 16kHz
      const sampleRate = 16000;
      const numSamples = bytes.length / 2;
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
        // Process next chunk
        if (audioQueueRef.current.length > 0) {
          processAudioQueue();
        } else {
          updateStatus("connected");
        }
      };
      source.start();
    } catch {
      isPlayingRef.current = false;
    }
  };

  return (
    <View style={s.container}>
      {/* Label */}
      <Text style={s.label}>
        {focusCampaign
          ? "Campaign Voice Summary"
          : "Campaign Summarizer"}
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
                : isActive
                ? "stop"
                : "play"
            }
            size={36}
            color={isActive ? "#fff" : Dark.textSecondary}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Status */}
      <Text style={s.statusText}>
        {status === "disconnected" && "Tap to start"}
        {status === "connecting" && "Connecting to Snowball AI..."}
        {status === "connected" && "Listening — ask a question"}
        {status === "speaking" && "Summarizing campaigns..."}
      </Text>

      {/* Active indicator */}
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

// Extend global for audio context caching
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
  statusText: {
    fontSize: 13,
    color: Dark.textMuted,
    marginBottom: 16,
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
