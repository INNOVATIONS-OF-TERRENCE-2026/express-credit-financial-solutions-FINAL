import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Simple CSS injection to hide Lovable badge
    const css = `
      <style>
        /* Hide Lovable badge completely */
        [data-lovable-badge],
        .lovable-badge,
        iframe[src*="lovable"],
        [href*="lovable.dev"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }
        
        /* Hide any floating buttons or edit mode indicators */
        .edit-mode-indicator,
        .floating-edit-button,
        [data-edit-mode] {
          display: none !important;
        }
      </style>
    `;

    return new Response(css, {
      headers: { ...corsHeaders, 'Content-Type': 'text/css' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});