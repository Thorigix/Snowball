import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Dark, Brand, Typography, Spacing, Radius, Shadows } from "@/constants/theme";
import { getAiCampaignSummary, getAiRiskSummary } from "@/services/mock-data";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  { icon: "shield-checkmark-outline", text: "How does escrow protect me?" },
  { icon: "information-circle-outline", text: "Explain this campaign" },
  { icon: "alert-circle-outline", text: "Is this seller offer safe?" },
  { icon: "swap-horizontal-outline", text: "Explain the LI.FI route" },
  { icon: "help-circle-outline", text: "What if seller doesn't ship?" },
];

export default function AiTabScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      text: "Hi! I'm the Snowball AI Assistant. I can explain campaigns, escrow protection, cross-chain funding, and help you understand your group buy. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Generate AI response
    let response = "";
    const lowerText = text.toLowerCase();

    if (lowerText.includes("escrow") || lowerText.includes("protect")) {
      response =
        "Your funds are locked in a Solana escrow program controlled by smart contract code. " +
        "The seller cannot withdraw funds directly. Payment is only released when enough buyers " +
        "confirm delivery (2 out of 3 for the RTX 5080 campaign). If the seller doesn't ship, " +
        "buyers can get a full refund.";
    } else if (lowerText.includes("campaign") || lowerText.includes("explain")) {
      response = await getAiCampaignSummary("campaign-rtx-5080-demo");
    } else if (lowerText.includes("safe") || lowerText.includes("risk") || lowerText.includes("seller")) {
      const risk = await getAiRiskSummary();
      response = `Risk Level: ${risk.riskLevel.toUpperCase()}\n\n${risk.summary}`;
    } else if (lowerText.includes("lifi") || lowerText.includes("route") || lowerText.includes("bridge") || lowerText.includes("chain")) {
      response =
        "LI.FI finds the best route to bridge your tokens from any chain to Solana. " +
        "For example, you can start with USDC on Base, and LI.FI will convert it to SOL on Solana " +
        "so you can join the escrow campaign. The estimated time is about 3 minutes and gas cost " +
        "is approximately $2.14.";
    } else if (lowerText.includes("ship") || lowerText.includes("deliver") || lowerText.includes("what if")) {
      response =
        "If the seller doesn't ship within the delivery deadline, the campaign status moves to " +
        "a refund-eligible state. Any buyer can then claim their refund through the escrow program. " +
        "The smart contract ensures the seller never touches the funds unless delivery is confirmed.";
    } else {
      response =
        "I can help you understand:\n\n" +
        "• 🛡️ How Solana escrow protects your funds\n" +
        "• 📦 Campaign details and status\n" +
        "• 🔗 LI.FI cross-chain bridge routes\n" +
        "• ⚠️ Seller risk assessment\n" +
        "• 🚚 What happens if delivery fails\n\n" +
        "Try asking one of these questions!";
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      text: response,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsLoading(false);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={20} color={Brand.primary} />
          </View>
          <View>
            <Text style={styles.title}>AI Assistant</Text>
            <Text style={styles.subtitle}>Powered by ElevenLabs</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={20} color={Brand.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {msg.role === "assistant" && (
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={14} color={Brand.primary} />
              </View>
            )}
            <View
              style={[
                styles.messageContent,
                msg.role === "user"
                  ? styles.userContent
                  : styles.assistantContent,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === "user" ? styles.userText : styles.assistantText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="sparkles" size={14} color={Brand.primary} />
            </View>
            <View style={[styles.messageContent, styles.assistantContent]}>
              <Animated.View style={{ opacity: pulseAnim }}>
                <Text style={styles.typingText}>Thinking...</Text>
              </Animated.View>
            </View>
          </View>
        )}

        {/* Quick Prompts */}
        {messages.length <= 1 && (
          <View style={styles.quickPrompts}>
            {QUICK_PROMPTS.map((prompt, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickPrompt}
                onPress={() => sendMessage(prompt.text)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={prompt.icon as any}
                  size={16}
                  color={Brand.primary}
                />
                <Text style={styles.quickPromptText}>{prompt.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Ask about campaigns, escrow, LI.FI..."
            placeholderTextColor={Dark.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons
              name="arrow-up"
              size={18}
              color={input.trim() ? Dark.textInverse : Dark.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Dark.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Dark.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: "rgba(0, 229, 160, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Dark.text,
  },
  subtitle: {
    fontSize: Typography.tiny,
    color: Dark.textMuted,
    marginTop: 1,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0, 229, 160, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 229, 160, 0.2)",
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.xl,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  assistantBubble: {
    alignSelf: "flex-start",
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0, 229, 160, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  messageContent: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    maxWidth: "90%",
  },
  userContent: {
    backgroundColor: Brand.primary,
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: Dark.bgCard,
    borderWidth: 1,
    borderColor: Dark.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.bodySmall,
    lineHeight: 20,
  },
  userText: {
    color: Dark.textInverse,
  },
  assistantText: {
    color: Dark.text,
  },
  typingText: {
    fontSize: Typography.bodySmall,
    color: Dark.textMuted,
    fontStyle: "italic",
  },

  // Quick Prompts
  quickPrompts: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  quickPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Dark.bgCard,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Dark.border,
  },
  quickPromptText: {
    fontSize: Typography.bodySmall,
    color: Dark.textSecondary,
  },

  // Input
  inputContainer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Dark.border,
    backgroundColor: Dark.bgElevated,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Dark.bgInput,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Dark.border,
    paddingHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: Typography.bodySmall,
    color: Dark.text,
    paddingVertical: Spacing.md,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Dark.surface,
  },
});
