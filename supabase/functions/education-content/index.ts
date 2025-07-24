import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[EDUCATION-CONTENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

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
    
    logStep("User authenticated", { userId: user.id });

    const { topic, contentType = "article" } = await req.json();
    
    if (!topic) {
      throw new Error("Topic is required");
    }

    logStep("Processing request", { topic, contentType });

    // Comprehensive FCRA and credit law knowledge base
    const systemPrompt = `You are an expert credit repair educator specializing in FCRA compliance and consumer credit rights. Create comprehensive, accurate, and legally compliant educational content.

    Your expertise includes:
    - Fair Credit Reporting Act (FCRA) - 15 USC §1681 et seq.
    - Fair Debt Collection Practices Act (FDCPA) - 15 USC §1692 et seq.
    - Equal Credit Opportunity Act (ECOA) - 15 USC §1691 et seq.
    - Fair Credit Billing Act (FCBA)
    - Truth in Lending Act (TILA)
    - Consumer Financial Protection Bureau (CFPB) regulations
    - State credit repair laws and regulations

    Key areas of focus:
    1. Consumer Rights Under FCRA:
       - Right to accurate credit reporting (§1681e)
       - Right to dispute inaccurate information (§1681i)
       - Right to receive free credit reports (§1681j)
       - Reinvestigation procedures and timelines (§1681i)
       - Consumer reporting agency obligations

    2. Common Creditor Violations:
       - Reporting inaccurate information
       - Failure to conduct reasonable reinvestigations
       - Ignoring consumer disputes
       - Failure to update or delete inaccurate information
       - Mixing consumer files
       - Reporting outdated information beyond statutory periods

    3. Protection Mechanisms:
       - Dispute letter strategies
       - Documentation requirements
       - Timeline compliance
       - Escalation procedures
       - Legal remedies and damages

    Content Guidelines:
    - Provide specific legal citations when relevant
    - Include practical examples and scenarios
    - Explain complex legal concepts in accessible language
    - Highlight actionable steps consumers can take
    - Reference current CFPB guidance and interpretations
    - Include warning signs of violations
    - Provide template language when appropriate

    Generate ${contentType} content that empowers consumers with knowledge of their rights and how to enforce them.`;

    const contentPrompts = {
      "Understanding Your Credit Report": `Create a comprehensive guide on reading credit reports, focusing on:
      - How to identify inaccuracies and violations
      - Understanding FCRA requirements for accuracy
      - Recognizing when creditors have violated reporting standards
      - Specific sections to review for errors
      - Timeline requirements under FCRA
      - Your rights when errors are found`,

      "FCRA Rights and Protections": `Explain detailed FCRA rights including:
      - Section 1681e accuracy requirements
      - Section 1681i dispute procedures and reinvestigation timelines
      - Maximum reporting periods (Section 1681c)
      - Consumer notification requirements
      - Damages available under Section 1681n and 1681o
      - How creditors commonly violate these protections`,

      "Dealing with Collections": `Cover FDCPA protections and common violations:
      - Debt validation requirements under Section 1692g
      - Prohibited collection practices under Section 1692d-f
      - Credit reporting violations by collectors
      - Statute of limitations and re-aging violations
      - How to enforce your rights against collectors`,

      "Credit Laws and Regulations": `Comprehensive overview of consumer protection laws:
      - FCRA accuracy and dispute requirements
      - FDCPA collection limitations
      - ECOA discrimination protections
      - FCBA billing dispute rights
      - State credit repair law protections
      - Recent CFPB enforcement actions and guidance`,

      "Dispute Letter Strategies": `Advanced dispute strategies using FCRA requirements:
      - Proper dispute formatting under Section 1681i
      - Documentation requirements
      - Reinvestigation timeline enforcement
      - Escalation to CFPB when violations occur
      - Following up on incomplete investigations
      - Legal action thresholds and procedures`,

      "Credit Building and Protection": `Strategies that leverage consumer protection laws:
      - Using FCRA to maintain accurate reporting
      - Monitoring for violations and unauthorized inquiries
      - Identity theft protections under FCRA
      - Building credit while protecting your rights
      - Preventing future violations through documentation`
    };

    const specificPrompt = contentPrompts[topic] || `Create educational content about ${topic} focusing on consumer rights, common violations, and protection strategies.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create a comprehensive ${contentType} about "${topic}". ${specificPrompt}

      Structure the content with:
      1. Overview of relevant laws and protections
      2. Common violations consumers should watch for
      3. Specific rights and how to exercise them
      4. Step-by-step action plans
      5. Warning signs and red flags
      6. Resources for further help

      Make it practical, actionable, and empowering for consumers who may not know their rights are being violated.` }
    ];

    logStep("Making OpenAI API call");

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: messages,
        max_tokens: 1500,
        temperature: 0.3,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      logStep("OpenAI API error", { status: openaiResponse.status, error: errorData });
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    logStep("Successfully generated content", { contentLength: content.length });

    return new Response(
      JSON.stringify({ 
        content,
        topic,
        contentType,
        usage: openaiData.usage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in education-content", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});