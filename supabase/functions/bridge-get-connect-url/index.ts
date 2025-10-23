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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { user_uuid, redirect_url } = await req.json();

    if (!user_uuid) {
      throw new Error('user_uuid is required');
    }

    // Générer l'URL Bridge Connect
    const params = new URLSearchParams({
      client_id: Deno.env.get('BRIDGE_CLIENT_ID') || '',
      user_uuid: user_uuid,
      redirect_url: redirect_url || `${req.headers.get('origin')}/settings/bank-callback`,
    });

    const connectUrl = `https://connect.bridgeapi.io?${params.toString()}`;

    return new Response(
      JSON.stringify({ connect_url: connectUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating connect URL:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
