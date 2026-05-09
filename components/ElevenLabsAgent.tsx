/**
 * ElevenLabs Voice Agent — WebSocket Implementation
 * Uses the raw WebSocket API (works on both web and React Native)
 * No native modules needed.
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dark, Brand } from "@/constants/theme";
import { ELEVENLABS_AGENT_ID } from "@/constants/config";
import { allCampaigns } from "@/services/mock-data";

type AgentStatus = "disconnected" | "connecting" | "connected" | "speaking";

type Props = {
  onTranscript?: (role: "user" | "agent", text: string) => void;
};

export default function ElevenLabsAgent({ onTranscript }: Props) {
  const [status, setStatus] = useState<AgentStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<any>(null);

  const connect = useCallback(async () => {
    if (wsRef.current) return;
    setStatus("connecting");

    const url = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      // Send init
      ws.send(
        JSON.stringify({
          type: "conversation_initiation_client_data",
          conversation_config_override: {
            agent: {
              prompt: {
                prompt: buildCampaignContext(),
              },
            },
          },
        })
      );
      setStatus("connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        switch (data.type) {
          case "agent_response":
            if (data.agent_response_event?.agent_response) {
              onTranscript?.("agent", data.agent_response_event.agent_response);
              setStatus("speaking");
            }
            break;
          case "user_transcript":
            if (data.user_transcription_event?.user_transcript) {
              onTranscript?.(
                "user",
                data.user_transcription_event.user_transcript
              );
            }
            break;
          case "audio":
            // Play audio on web
            if (Platform.OS === "web" && data.audio_event?.audio_base_64) {
              playAudioBase64(data.audio_event.audio_base_64);
            }
            break;
          case "agent_response_correction":
            // Agent corrected its own response
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
                ws.send(
                  JSON.stringify({
                    type: "pong",
                    event_id: data.ping_event.event_id,
                  })
                );
              }, data.ping_event.ping_ms || 0);
            }
            break;
          case "conversation_initiation_metadata":
            setStatus("connected");
            break;
          default:
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = (err) => {
      console.error("[ElevenLabs WS] Error:", err);
      setStatus("disconnected");
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("disconnected");
    };
  }, [onTranscript]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const sendTextMessage = useCallback(
    (text: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      // ElevenLabs WebSocket doesn't have a direct text message API in the same way
      // We send it as a contextual update that triggers a response
      wsRef.current.send(
        JSON.stringify({
          type: "contextual_update",
          text: `User asks: ${text}. Please respond to this question.`,
        })
      );
      onTranscript?.("user", text);
    },
    [onTranscript]
  );

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

  return (
    <View style={s.agentContainer}>
      {/* Mic Button */}
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
              ? "mic"
              : "mic-outline"
          }
          size={36}
          color={isActive ? Dark.bg : Dark.textSecondary}
        />
      </TouchableOpacity>

      {/* Status */}
      <Text style={s.statusText}>
        {status === "disconnected" && "Tap to connect voice agent"}
        {status === "connecting" && "Connecting..."}
        {status === "connected" && "Connected — listening"}
        {status === "speaking" && "Agent speaking..."}
      </Text>

      {/* Quick Questions (text-based) */}
      {isActive && (
        <View style={s.quickRow}>
          {[
            "Tell me about the campaigns",
            "How does escrow work?",
            "Is this seller safe?",
          ].map((q, i) => (
            <TouchableOpacity
              key={i}
              style={s.quickChip}
              onPress={() => sendTextMessage(q)}
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

/** Build campaign context for the agent */
function buildCampaignContext(): string {
  const lines = allCampaigns.map(
    (c) =>
      `Campaign "${c.title}" by ${c.sellerName}: ` +
      `${c.currentParticipants}/${c.targetParticipants} buyers joined, ` +
      `${c.pricePerUser} ${c.tokenSymbol} per buyer, ` +
      `status ${c.status}. ${c.description}`
  );
  return (
    "You are the Snowball AI assistant. Snowball is a group buying platform on Solana. " +
    "Users join campaigns to buy products together at discounted bulk prices. " +
    "All funds are protected by a Solana escrow program — the seller cannot withdraw " +
    "until the majority of buyers confirm delivery. LI.FI enables cross-chain funding.\n\n" +
    "Current campaigns:\n" +
    lines.join("\n")
  );
}

/** Play base64-encoded audio on web */
function playAudioBase64(base64: string) {
  if (Platform.OS !== "web") return;
  try {
    const binaryStr = atob(base64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    if (!globalThis._elevenLabsAudioCtx) {
      globalThis._elevenLabsAudioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const ctx = globalThis._elevenLabsAudioCtx;

    // ElevenLabs sends PCM 16-bit mono at 16kHz
    const sampleRate = 16000;
    const audioBuffer = ctx.createBuffer(1, bytes.length / 2, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();
  } catch (err) {
    console.warn("[ElevenLabs] Audio playback error:", err);
  }
}

// Extend global for audio context caching
declare global {
  // eslint-disable-next-line no-var
  var _elevenLabsAudioCtx: any;
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
  micBtnConnecting: {
    backgroundColor: Dark.surface,
    opacity: 0.8,
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
});
