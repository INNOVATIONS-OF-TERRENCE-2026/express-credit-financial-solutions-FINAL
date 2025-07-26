import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHAT-HISTORY-MANAGER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { action, sessionId, messages } = await req.json();
    logStep("Request received", { action, sessionId });

    if (action === "save") {
      // Save chat messages to history
      const chatEntries = messages.map((msg: any) => ({
        user_id: user.id,
        session_id: sessionId,
        message_role: msg.role,
        message_content: msg.content
      }));

      const { error: insertError } = await supabaseClient
        .from('chat_history')
        .insert(chatEntries);

      if (insertError) {
        throw new Error(`Failed to save chat history: ${insertError.message}`);
      }

      logStep("Chat history saved successfully");

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Chat history saved" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "load") {
      // Load chat history for user
      const { data: chatHistory, error: loadError } = await supabaseClient
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (loadError) {
        throw new Error(`Failed to load chat history: ${loadError.message}`);
      }

      // Group by session_id
      const sessionGroups = chatHistory?.reduce((groups: any, chat: any) => {
        const sessionId = chat.session_id;
        if (!groups[sessionId]) {
          groups[sessionId] = [];
        }
        groups[sessionId].push({
          role: chat.message_role,
          content: chat.message_content,
          timestamp: chat.timestamp
        });
        return groups;
      }, {}) || {};

      logStep("Chat history loaded successfully", { sessionCount: Object.keys(sessionGroups).length });

      return new Response(JSON.stringify({ 
        success: true, 
        sessions: sessionGroups 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else if (action === "loadSession") {
      // Load specific session
      const { data: sessionData, error: sessionError } = await supabaseClient
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (sessionError) {
        throw new Error(`Failed to load session: ${sessionError.message}`);
      }

      const messages = sessionData?.map((chat: any) => ({
        role: chat.message_role,
        content: chat.message_content,
        timestamp: chat.timestamp
      })) || [];

      logStep("Session loaded successfully", { messageCount: messages.length });

      return new Response(JSON.stringify({ 
        success: true, 
        messages 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } else {
      throw new Error("Invalid action specified");
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});