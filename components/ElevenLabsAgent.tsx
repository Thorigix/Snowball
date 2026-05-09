import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useConversation } from '@elevenlabs/react';
import { Dark, Brand, Spacing, Radius, Shadows } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { VoiceState } from '@/types';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

/**
 * ElevenLabsAgent
 * 
 * A premium, standalone voice agent component.
 * Compatible with simple backend services via environment variables.
 * No extra configuration needed by other developers.
 */
export const ElevenLabsAgent: React.FC = () => {
  const agentId = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID;

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Received message:', message);
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const { status, isSpeaking } = conversation;

  const toggleConversation = useCallback(async () => {
    try {
      if (status === 'connected') {
        await conversation.endSession();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Request microphone permission if needed (handled by browser/app)
        await conversation.startSession({
          agentId: agentId!,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error('Failed to toggle conversation:', error);
    }
  }, [status, conversation, agentId]);

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.header}>
          <View style={[styles.indicator, { backgroundColor: status === 'connected' ? Brand.success : Brand.danger }]} />
          <ThemedText style={styles.statusText}>
            {status === 'connected' ? 'Agent is Online' : status === 'connecting' ? 'Connecting...' : 'Agent Offline'}
          </ThemedText>
        </View>

        <View style={styles.voiceIndicatorContainer}>
          {isSpeaking ? (
            <View style={styles.speakingWave}>
               {/* Simplified wave animation for performance */}
               <ActivityIndicator color={Brand.primary} size="small" />
            </View>
          ) : (
            <ThemedText style={styles.subText}>
              {status === 'connected' ? 'Listening...' : 'Tap to start conversation'}
            </ThemedText>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: status === 'connected' ? Brand.danger : Brand.primary }
          ]}
          onPress={toggleConversation}
          activeOpacity={0.8}
        >
          {status === 'connecting' ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons 
                name={status === 'connected' ? "stop" : "mic"} 
                size={24} 
                color="white" 
              />
              <ThemedText style={styles.buttonText}>
                {status === 'connected' ? 'End Call' : 'Talk to AI'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    backgroundColor: Dark.bgCard,
    padding: Spacing.xl,
    borderRadius: Radius.xxl,
    width: '100%',
    ...Shadows.elevated,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: Dark.textSecondary,
    fontWeight: '600',
  },
  voiceIndicatorContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  speakingWave: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subText: {
    fontSize: 12,
    color: Dark.textMuted,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
