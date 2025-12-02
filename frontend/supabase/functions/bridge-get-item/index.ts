import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { item_id } = await req.json();

    if (!item_id) {
      throw new Error('item_id is required');
    }

    const bridgeClientId = Deno.env.get('BRIDGE_CLIENT_ID') || '';
    const bridgeClientSecret = Deno.env.get('BRIDGE_CLIENT_SECRET') || '';

    // Récupérer les détails de l'item depuis Bridge API v2 (version 2025-01-15)
    const itemResponse = await fetch(
      `https://api.bridgeapi.io/v2/items/${item_id}`,
      {
        headers: {
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
        },
      }
    );

    if (!itemResponse.ok) {
      const error = await itemResponse.json();
      throw new Error(`Bridge API error: ${error.message || itemResponse.statusText}`);
    }

    const item = await itemResponse.json();

    // Récupérer les comptes associés à l'item
    const accountsResponse = await fetch(
      `https://api.bridgeapi.io/v2/items/${item_id}/accounts`,
      {
        headers: {
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
        },
      }
    );

    if (!accountsResponse.ok) {
      const error = await accountsResponse.json();
      throw new Error(`Bridge API error: ${error.message || accountsResponse.statusText}`);
    }

    const accountsData = await accountsResponse.json();

    return new Response(
      JSON.stringify({
        item: item,
        accounts: accountsData.resources || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching item:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
