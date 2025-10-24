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

    const { redirect_url, prefill_email } = await req.json();

    // Créer une Connect session avec Bridge API v3
    const bodyData: any = {
      redirect_url: redirect_url || `${req.headers.get('origin')}/settings/bank-callback`,
    };

    // Ajouter l'email si disponible
    if (prefill_email || user.email) {
      bodyData.user_email = prefill_email || user.email;
    }

    const bridgeClientId = Deno.env.get('BRIDGE_CLIENT_ID') || '';
    const bridgeClientSecret = Deno.env.get('BRIDGE_CLIENT_SECRET') || '';

    console.log('Starting Bridge v3 flow...');

    // Étape 1: Créer ou récupérer un utilisateur Bridge
    console.log('Step 1: Creating or retrieving Bridge user...');

    const createUserResponse = await fetch('https://api.bridgeapi.io/v3/aggregation/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bridge-Version': '2025-01-15',
        'Client-Id': bridgeClientId,
        'Client-Secret': bridgeClientSecret,
        'accept': 'application/json',
      },
      body: JSON.stringify({
        external_user_id: user.id, // Utiliser l'ID Supabase comme external_user_id
      }),
    });

    let userUuid;

    // Sauvegarder le bridge_user_uuid dans le profil Supabase
    const saveUserUuid = async (uuid: string) => {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ bridge_user_uuid: uuid })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving bridge_user_uuid:', updateError);
      } else {
        console.log('bridge_user_uuid saved to profile');
      }
    };

    // Si l'utilisateur existe déjà (409 Conflict), on l'authentifie directement
    if (createUserResponse.status === 409) {
      console.log('Bridge user already exists, using existing user');

      // Authentifier directement avec l'external_user_id
      const authResponse = await fetch('https://api.bridgeapi.io/v3/aggregation/authorization/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          external_user_id: user.id,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        console.error('Auth error:', error);
        throw new Error(`Auth error: ${error.message || authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      userUuid = authData.user.uuid;

      console.log('Authenticated existing user, UUID:', userUuid);
      await saveUserUuid(userUuid);
    } else if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      console.error('Create user error:', error);
      throw new Error(`Create user error: ${error.message || createUserResponse.statusText}`);
    } else {
      const userData = await createUserResponse.json();
      userUuid = userData.uuid;
      console.log('Bridge user created, UUID:', userUuid);
      await saveUserUuid(userUuid);
    }

    // Étape 2: Authentifier l'utilisateur pour obtenir un access_token (si pas déjà fait)
    let accessToken;

    if (createUserResponse.status === 409) {
      // On a déjà le token de l'étape 1
      console.log('Step 2: Already authenticated (skipped)');
      // Le token a déjà été obtenu dans le bloc if (createUserResponse.status === 409)
      // On doit le récupérer à nouveau
      const authResponse = await fetch('https://api.bridgeapi.io/v3/aggregation/authorization/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          user_uuid: userUuid,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        console.error('Auth error:', error);
        throw new Error(`Auth error: ${error.message || authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      accessToken = authData.access_token;
      console.log('Access token obtained, expires at:', authData.expires_at);
    } else {
      console.log('Step 2: Authenticating user...');

      const authResponse = await fetch('https://api.bridgeapi.io/v3/aggregation/authorization/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
          'accept': 'application/json',
        },
        body: JSON.stringify({
          user_uuid: userUuid,
        }),
      });

      if (!authResponse.ok) {
        const error = await authResponse.json();
        console.error('Auth error:', error);
        throw new Error(`Auth error: ${error.message || authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      accessToken = authData.access_token;
      console.log('Access token obtained, expires at:', authData.expires_at);
    }

    // Étape 3: Créer la session Connect avec le Bearer token
    console.log('Step 3: Creating connect session...');
    console.log('Note: redirect_url must be configured in Bridge Dashboard, not sent in body');

    const connectSessionBody: any = {
      user_email: bodyData.user_email,
    };

    // Note: En v3, le redirect_url se configure dans le Dashboard Bridge, pas dans l'API
    console.log('Connect session body:', JSON.stringify(connectSessionBody));

    const response = await fetch('https://api.bridgeapi.io/v3/aggregation/connect-sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Bridge-Version': '2025-01-15',
        'Client-Id': bridgeClientId,
        'Client-Secret': bridgeClientSecret,
        'Authorization': `Bearer ${accessToken}`,
        'accept': 'application/json',
      },
      body: JSON.stringify(connectSessionBody),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Bridge API error:', error);
      throw new Error(`Bridge API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    console.log('Bridge Connect session created successfully');
    console.log('Redirect URL:', data.url);

    // data contient { id: "...", url: "https://connect.bridgeapi.io/session/{session-id}" }
    return new Response(JSON.stringify({ redirect_url: data.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating Connect session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
