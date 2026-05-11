import React from "react";
import ElevenLabsAgentComponent from "@/components/ElevenLabsAgent";
import type { Campaign } from "@/types";

type Props = {
  focusCampaign?: Campaign;
  onTranscript?: (role: "user" | "agent", text: string) => void;
};

export function VoiceAgentPanel(props: Props) {
  return <ElevenLabsAgentComponent {...props} />;
}
