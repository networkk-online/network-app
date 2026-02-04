import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lastMessage, conversationHistory = [] } = await req.json();
    
    if (!lastMessage) {
      return new Response(
        JSON.stringify({ error: "Last message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Return fallback suggestions
      return new Response(
        JSON.stringify({ 
          suggestions: getFallbackSuggestions(lastMessage) 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `أنت مساعد ذكي للمحادثات باللغة العربية العراقية. 
مهمتك هي اقتراح 4 ردود قصيرة ومناسبة على الرسالة الأخيرة.
يجب أن تكون الردود:
- باللهجة العراقية الطبيعية
- قصيرة (3-8 كلمات)
- متنوعة في الأسلوب
- مناسبة للسياق
- ودية وإيجابية

أجب فقط بـ JSON بالشكل التالي:
{"suggestions": ["رد1", "رد2", "رد3", "رد4"]}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-5).map((m: Message) => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: `اقترح 4 ردود مناسبة على هذه الرسالة: "${lastMessage}"` }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", suggestions: getFallbackSuggestions(lastMessage) }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", suggestions: getFallbackSuggestions(lastMessage) }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let suggestions: string[] = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*"suggestions"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        suggestions = parsed.suggestions || [];
      }
    } catch {
      // If parsing fails, extract suggestions manually
      suggestions = getFallbackSuggestions(lastMessage);
    }

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 4) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Smart Reply error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        suggestions: ["👍", "تمام!", "شكراً", "أكيد!"]
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getFallbackSuggestions(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes("مرحبا") || lowerMessage.includes("هلو") || lowerMessage.includes("السلام")) {
    return ["أهلاً وسهلاً! 👋", "مرحبا! كيف حالك؟", "هلا والله!", "السلام عليكم"];
  }
  
  if (lowerMessage.includes("كيف حال") || lowerMessage.includes("شلونك")) {
    return ["الحمدلله بخير، وانت؟", "تمام الله يسلمك!", "زين الله يعافيك", "ماشي الحال 💪"];
  }
  
  if (message.includes("؟")) {
    return ["نعم أكيد!", "لا أعتقد", "خليني أفكر...", "ما أدري صراحة"];
  }
  
  return ["👍", "تمام!", "شكراً!", "أكيد!"];
}
