/**
 * Snowball Shared Types
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AgentConfig {
  agentId: string;
  name?: string;
  description?: string;
}

export interface VoiceState {
  isSpeaking: boolean;
  isListening: boolean;
  status: 'idle' | 'connecting' | 'connected' | 'error';
}
