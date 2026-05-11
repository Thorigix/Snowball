import { GEMINI_API_KEY } from "@/constants/config";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function askGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return "Gemini API key is missing. Please check your .env file.";
  }

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("[Gemini] API Error:", data.error);
      return `Error: ${data.error.message}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("[Gemini] Fetch Error:", error);
    return "Failed to connect to Gemini.";
  }
}

/** Specific prompt for campaign analysis */
export async function getCampaignAiAnalysis(campaignData: any): Promise<string> {
  const prompt = `
    You are Snowball AI, a fintech assistant for a Solana group-buy platform.
    Analyze this campaign data and provide a concise, professional summary for a mobile user.
    Focus on risk, trust (escrow protection), and funding status.
    
    Campaign Data:
    ${JSON.stringify(campaignData, null, 2)}
    
    Rules:
    - No emojis.
    - Be professional but friendly.
    - Mention Solana escrow and LI.FI cross-chain capability if relevant.
    - Keep it under 3 paragraphs.
  `;
  
  return askGemini(prompt);
}
