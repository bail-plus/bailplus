import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const country = url.searchParams.get('country') || 'FR';

    const response = await fetch(
      `https://api.bridgeapi.io/v2/banks?country_code=${country}`,
      {
        headers: {
          'Client-Id': Deno.env.get('BRIDGE_CLIENT_ID') || '',
          'Client-Secret': Deno.env.get('BRIDGE_CLIENT_SECRET') || '',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Bridge API error: ${response.statusText}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data.resources || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
