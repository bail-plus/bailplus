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

    const webhookData = await req.json();

    console.log('Received Bridge webhook:', JSON.stringify(webhookData, null, 2));
    console.log('Webhook content:', JSON.stringify(webhookData.content, null, 2));

    // Traiter selon le type d'événement
    const eventType = webhookData.type;

    switch (eventType) {
      case 'item.created':
      case 'item.refreshed':
        // Un item a été créé ou rafraîchi
        const itemId = webhookData.content?.item_id || webhookData.content?.id;
        const userId = webhookData.content?.user_uuid || webhookData.content?.user?.uuid;

        console.log('Item event:', eventType, 'Item ID:', itemId, 'User UUID:', userId);

        if (itemId && userId) {
          // Récupérer l'utilisateur Supabase correspondant
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, user_id')
            .eq('bridge_user_uuid', userId)
            .single();

          if (profileError || !profile) {
            console.error('Profile not found for Bridge user:', userId);
            break;
          }

          // Récupérer les détails de l'item via Bridge API
          const bridgeClientId = Deno.env.get('BRIDGE_CLIENT_ID') || '';
          const bridgeClientSecret = Deno.env.get('BRIDGE_CLIENT_SECRET') || '';

          // Essayer d'abord avec v3/aggregation/items
          console.log('Trying v3 aggregation endpoint for item:', itemId);
          let itemResponse = await fetch(
            `https://api.bridgeapi.io/v3/aggregation/items/${itemId}`,
            {
              headers: {
                'Bridge-Version': '2025-01-15',
                'Client-Id': bridgeClientId,
                'Client-Secret': bridgeClientSecret,
              },
            }
          );

          // Si ça échoue, essayer v2
          if (!itemResponse.ok) {
            console.log('v3 failed, trying v2 endpoint');
            itemResponse = await fetch(
              `https://api.bridgeapi.io/v2/items/${itemId}`,
              {
                headers: {
                  'Bridge-Version': '2021-06-01',
                  'Client-Id': bridgeClientId,
                  'Client-Secret': bridgeClientSecret,
                },
              }
            );
          }

          if (!itemResponse.ok) {
            const itemError = await itemResponse.json();
            console.error('Failed to fetch item from Bridge (item.created/refreshed):', itemResponse.status, JSON.stringify(itemError));
            break;
          }

          const item = await itemResponse.json();

          // Récupérer les comptes
          console.log('Trying v3 aggregation endpoint for accounts');
          let accountsResponse = await fetch(
            `https://api.bridgeapi.io/v3/aggregation/accounts?item_id=${itemId}`,
            {
              headers: {
                'Bridge-Version': '2025-01-15',
                'Client-Id': bridgeClientId,
                'Client-Secret': bridgeClientSecret,
              },
            }
          );

          // Si ça échoue, essayer v2
          if (!accountsResponse.ok) {
            console.log('v3 accounts failed, trying v2 endpoint');
            accountsResponse = await fetch(
              `https://api.bridgeapi.io/v2/items/${itemId}/accounts`,
              {
                headers: {
                  'Bridge-Version': '2021-06-01',
                  'Client-Id': bridgeClientId,
                  'Client-Secret': bridgeClientSecret,
                },
              }
            );
          }

          if (!accountsResponse.ok) {
            const accountsError = await accountsResponse.json();
            console.error('Failed to fetch accounts from Bridge (item.created/refreshed):', accountsResponse.status, JSON.stringify(accountsError));
            break;
          }

          const accountsData = await accountsResponse.json();
          // v2 retourne { resources: [...] }, v3 retourne { data: [...] }
          const accounts = accountsData.resources || accountsData.data || [];
          console.log('Found', accounts.length, 'accounts');

          // Sauvegarder le premier compte dans bank_connections
          if (accounts.length > 0) {
            const account = accounts[0];

            const { error: insertError } = await supabase
              .from('bank_connections')
              .upsert({
                user_id: profile.user_id,
                institution_id: item.bank_id?.toString() || item.id.toString(),
                institution_name: item.bank?.name || 'Banque',
                requisition_id: item.id.toString(),
                account_id: account.id.toString(),
                consent_expires_at: new Date(
                  Date.now() + 90 * 24 * 60 * 60 * 1000
                ).toISOString(),
                iban: account.iban ? `****${account.iban.slice(-4)}` : null,
                account_name: account.name,
                currency: account.currency_code || 'EUR',
                consent_status: 'active',
              }, {
                onConflict: 'requisition_id',
              });

            if (insertError) {
              console.error('Error saving bank connection:', insertError);
            } else {
              console.log('Bank connection saved successfully for user:', profile.id);
            }
          }
        }
        break;

      case 'item.account.created':
      case 'item.account.updated':
        console.log('Account event:', eventType);
        // Le webhook contient déjà les infos du compte
        const accountData = webhookData.content;
        const accountItemId = accountData?.item_id;
        const accountUserId = accountData?.user_uuid;
        const accountId = accountData?.account_id || accountData?.id;

        console.log('Account event details - Item ID:', accountItemId, 'User UUID:', accountUserId, 'Account ID:', accountId);

        if (accountItemId && accountUserId && accountId) {
          // Récupérer l'utilisateur Supabase correspondant
          const { data: accountProfile, error: accountProfileError } = await supabase
            .from('profiles')
            .select('id, user_id')
            .eq('bridge_user_uuid', accountUserId)
            .single();

          if (accountProfileError || !accountProfile) {
            console.error('Profile not found for Bridge user:', accountUserId);
            break;
          }

          // Le webhook ne contient pas toutes les infos, on doit faire un appel API
          // Mais les endpoints v3 nécessitent un Bearer token
          // Solution: On génère un token temporaire avec le user_uuid
          console.log('Getting Bearer token for user:', accountUserId);

          const bridgeClientId = Deno.env.get('BRIDGE_CLIENT_ID') || '';
          const bridgeClientSecret = Deno.env.get('BRIDGE_CLIENT_SECRET') || '';

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
              user_uuid: accountUserId,
            }),
          });

          if (!authResponse.ok) {
            const authError = await authResponse.json();
            console.error('Failed to get Bearer token:', authResponse.status, JSON.stringify(authError));
            break;
          }

          const authData = await authResponse.json();
          const accessToken = authData.access_token;
          console.log('Got access token, fetching account details');

          // Récupérer les détails complets du compte
          const accountDetailsResponse = await fetch(
            `https://api.bridgeapi.io/v3/aggregation/accounts/${accountId}`,
            {
              headers: {
                'Bridge-Version': '2025-01-15',
                'Client-Id': bridgeClientId,
                'Client-Secret': bridgeClientSecret,
                'Authorization': `Bearer ${accessToken}`,
                'accept': 'application/json',
              },
            }
          );

          if (!accountDetailsResponse.ok) {
            const accountError = await accountDetailsResponse.json();
            console.error('Failed to fetch account details:', accountDetailsResponse.status, JSON.stringify(accountError));
            break;
          }

          const accountDetails = await accountDetailsResponse.json();
          console.log('Account details:', JSON.stringify(accountDetails));

          // Sauvegarder ou mettre à jour dans bank_connections
          const { error: upsertError } = await supabase
            .from('bank_connections')
            .upsert({
              user_id: accountProfile.user_id,
              institution_id: accountDetails.provider_id?.toString() || accountItemId.toString(),
              institution_name: accountDetails.bank_name || 'Banque de démonstration',
              requisition_id: accountItemId.toString(),
              account_id: accountId.toString(),
              consent_expires_at: new Date(
                Date.now() + 90 * 24 * 60 * 60 * 1000
              ).toISOString(),
              iban: accountDetails.iban ? `****${accountDetails.iban.slice(-4)}` : null,
              account_name: accountDetails.name || 'Compte',
              currency: accountDetails.currency_code || 'EUR',
              consent_status: 'active',
            }, {
              onConflict: 'requisition_id',
            });

          if (upsertError) {
            console.error('Error saving/updating bank connection:', upsertError);
          } else {
            console.log('Bank connection saved/updated successfully for user:', accountProfile.id);
          }

          // Note: Les transactions seront récupérées automatiquement le 5 et le 10 de chaque mois
          // lors de la vérification des paiements de loyer
        }
        break;

      default:
        console.log('Unhandled webhook event:', eventType);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
