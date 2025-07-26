import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('Credit monitoring sync request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider, forceRefresh } = await req.json();
    console.log('Syncing credit data for user:', user.id, 'provider:', provider);

    // Get user's API credentials
    const { data: credentials, error: credError } = await supabase
      .from('credit_api_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('api_provider', provider)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      throw new Error(`No active ${provider} credentials found. Please add your API credentials first.`);
    }

    // Check if we need to refresh (don't sync more than once per hour unless forced)
    const lastSync = credentials.last_sync ? new Date(credentials.last_sync) : null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (!forceRefresh && lastSync && lastSync > oneHourAgo) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Credit data is up to date. Last sync: ' + lastSync.toLocaleString(),
          lastSync: lastSync.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let creditData = null;
    let alerts = [];

    // Simulate API calls (replace with actual API integration)
    if (provider === 'identityiq') {
      creditData = await fetchIdentityIQData(credentials);
    } else if (provider === 'credit_hero') {
      creditData = await fetchCreditHeroData(credentials);
    } else {
      throw new Error('Unsupported provider: ' + provider);
    }

    // Process and store credit score data
    if (creditData.scores) {
      for (const score of creditData.scores) {
        // Get previous score for comparison
        const { data: previousScore } = await supabase
          .from('credit_monitoring')
          .select('credit_score')
          .eq('user_id', user.id)
          .eq('score_provider', score.provider)
          .order('score_date', { ascending: false })
          .limit(1)
          .single();

        const previousScoreValue = previousScore?.credit_score || null;
        const scoreChange = previousScoreValue ? score.score - previousScoreValue : 0;

        // Insert new score record
        await supabase.from('credit_monitoring').insert({
          user_id: user.id,
          credit_score: score.score,
          score_provider: score.provider,
          score_date: score.date,
          previous_score: previousScoreValue,
          score_change: scoreChange,
          report_data: score.reportData || {}
        });

        // Create alert for significant score changes
        if (Math.abs(scoreChange) >= 10) {
          alerts.push({
            alert_type: 'score_change',
            alert_title: `Credit Score ${scoreChange > 0 ? 'Increased' : 'Decreased'}`,
            alert_description: `Your ${score.provider} credit score ${scoreChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(scoreChange)} points to ${score.score}`,
            severity: Math.abs(scoreChange) >= 25 ? 'high' : 'medium',
            alert_data: { scoreChange, newScore: score.score, provider: score.provider }
          });
        }
      }
    }

    // Process alerts from credit report changes
    if (creditData.newInquiries) {
      for (const inquiry of creditData.newInquiries) {
        alerts.push({
          alert_type: 'new_inquiry',
          alert_title: 'New Credit Inquiry',
          alert_description: `A new ${inquiry.type} inquiry from ${inquiry.creditor} was added to your credit report`,
          severity: inquiry.type === 'hard' ? 'high' : 'medium',
          alert_data: inquiry
        });
      }
    }

    if (creditData.newCollections) {
      for (const collection of creditData.newCollections) {
        alerts.push({
          alert_type: 'collection_added',
          alert_title: 'New Collection Account',
          alert_description: `A new collection account from ${collection.creditor} for $${collection.amount} was added`,
          severity: 'critical',
          alert_data: collection
        });
      }
    }

    if (creditData.newAccounts) {
      for (const account of creditData.newAccounts) {
        alerts.push({
          alert_type: 'new_account',
          alert_title: 'New Credit Account',
          alert_description: `A new ${account.type} account with ${account.creditor} was opened`,
          severity: 'low',
          alert_data: account
        });
      }
    }

    // Insert all alerts
    if (alerts.length > 0) {
      const alertsToInsert = alerts.map(alert => ({
        user_id: user.id,
        ...alert
      }));
      
      await supabase.from('credit_alerts').insert(alertsToInsert);
    }

    // Update last sync time
    await supabase
      .from('credit_api_credentials')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', credentials.id);

    console.log(`Credit sync completed for user ${user.id}: ${alerts.length} new alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Credit data synced successfully. ${alerts.length} new alerts created.`,
        alertsCreated: alerts.length,
        lastSync: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sync-credit-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Simulated IdentityIQ API integration
async function fetchIdentityIQData(credentials: any) {
  console.log('Fetching IdentityIQ data...');
  
  // This is a simulation - replace with actual IdentityIQ API calls
  // You would use credentials.api_key, credentials.username, etc.
  
  return {
    scores: [
      {
        provider: 'experian',
        score: Math.floor(Math.random() * (850 - 300) + 300),
        date: new Date().toISOString().split('T')[0],
        reportData: { lastUpdated: new Date().toISOString() }
      },
      {
        provider: 'equifax',
        score: Math.floor(Math.random() * (850 - 300) + 300),
        date: new Date().toISOString().split('T')[0],
        reportData: { lastUpdated: new Date().toISOString() }
      },
      {
        provider: 'transunion',
        score: Math.floor(Math.random() * (850 - 300) + 300),
        date: new Date().toISOString().split('T')[0],
        reportData: { lastUpdated: new Date().toISOString() }
      }
    ],
    newInquiries: Math.random() > 0.8 ? [
      {
        creditor: 'Example Bank',
        type: 'hard',
        date: new Date().toISOString().split('T')[0]
      }
    ] : [],
    newCollections: Math.random() > 0.9 ? [
      {
        creditor: 'ABC Collections',
        amount: 1250,
        date: new Date().toISOString().split('T')[0]
      }
    ] : [],
    newAccounts: Math.random() > 0.7 ? [
      {
        creditor: 'Sample Credit Union',
        type: 'Credit Card',
        date: new Date().toISOString().split('T')[0]
      }
    ] : []
  };
}

// Simulated Credit Hero API integration
async function fetchCreditHeroData(credentials: any) {
  console.log('Fetching Credit Hero data...');
  
  // This is a simulation - replace with actual Credit Hero API calls
  return {
    scores: [
      {
        provider: 'vantagescore',
        score: Math.floor(Math.random() * (850 - 300) + 300),
        date: new Date().toISOString().split('T')[0],
        reportData: { lastUpdated: new Date().toISOString() }
      }
    ],
    newInquiries: [],
    newCollections: [],
    newAccounts: []
  };
}