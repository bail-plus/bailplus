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

    const bridgeClientId = Deno.env.get('BRIDGE_CLIENT_ID') || '';
    const bridgeClientSecret = Deno.env.get('BRIDGE_CLIENT_SECRET') || '';

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    console.log(`Running rent payment check for ${currentYear}-${currentMonth} on day ${currentDay}`);

    // Récupérer toutes les connexions bancaires actives
    const { data: connections, error: connectionsError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('consent_status', 'active');

    if (connectionsError) {
      throw connectionsError;
    }

    console.log(`Found ${connections?.length || 0} active bank connections`);

    // Pour chaque connexion bancaire
    for (const connection of connections || []) {
      console.log(`Processing connection ${connection.id} for account ${connection.account_id}`);

      // Récupérer le profil utilisateur pour avoir le bridge_user_uuid
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('bridge_user_uuid')
        .eq('user_id', connection.user_id)
        .single();

      if (profileError || !profile?.bridge_user_uuid) {
        console.error('Profile not found or missing bridge_user_uuid for user:', connection.user_id);
        continue;
      }

      // Générer un Bearer token pour récupérer les transactions
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
          user_uuid: profile.bridge_user_uuid,
        }),
      });

      if (!authResponse.ok) {
        console.error('Failed to get Bearer token for user:', connection.user_id);
        continue;
      }

      const authData = await authResponse.json();
      const accessToken = authData.access_token;

      // Récupérer les transactions depuis la dernière synchro
      const sinceDate = connection.last_transaction_sync_at;
      let transactionsUrl = `https://api.bridgeapi.io/v3/aggregation/transactions?account_id=${connection.account_id}`;
      if (sinceDate) {
        transactionsUrl += `&since=${new Date(sinceDate).toISOString()}`;
      }

      const transactionsResponse = await fetch(transactionsUrl, {
        headers: {
          'Bridge-Version': '2025-01-15',
          'Client-Id': bridgeClientId,
          'Client-Secret': bridgeClientSecret,
          'Authorization': `Bearer ${accessToken}`,
          'accept': 'application/json',
        },
      });

      if (!transactionsResponse.ok) {
        console.error('Failed to fetch transactions for account:', connection.account_id);
        continue;
      }

      const transactionsData = await transactionsResponse.json();
      const transactions = transactionsData.resources || [];
      console.log(`Found ${transactions.length} transactions for account ${connection.account_id}`);

      // Sauvegarder les transactions
      let latestUpdatedAt = sinceDate;

      for (const transaction of transactions) {
        await supabase
          .from('bank_transactions')
          .upsert({
            bank_connection_id: connection.id,
            account_id: connection.account_id,
            external_transaction_id: transaction.id.toString(),
            date: transaction.date,
            booking_date: transaction.booking_date,
            transaction_date: transaction.transaction_date,
            value_date: transaction.value_date,
            label: transaction.clean_description || transaction.provider_description,
            clean_description: transaction.clean_description,
            provider_description: transaction.provider_description,
            amount: transaction.amount,
            currency_code: transaction.currency_code,
            bridge_updated_at: transaction.updated_at,
            deleted: transaction.deleted || false,
            category_id: transaction.category_id,
            operation_type: transaction.operation_type,
            future: transaction.future || false,
            status: 'unmatched',
            raw_data: transaction,
          }, {
            onConflict: 'external_transaction_id',
          });

        if (!latestUpdatedAt || new Date(transaction.updated_at) > new Date(latestUpdatedAt)) {
          latestUpdatedAt = transaction.updated_at;
        }
      }

      // Mettre à jour last_transaction_sync_at
      if (latestUpdatedAt) {
        await supabase
          .from('bank_connections')
          .update({
            last_transaction_sync_at: latestUpdatedAt,
            last_sync_at: new Date().toISOString(),
            last_sync_status: 'success',
          })
          .eq('id', connection.id);
      }
    }

    // Maintenant, vérifier les loyers attendus pour ce mois
    const { data: rentInvoices, error: invoicesError } = await supabase
      .from('rent_invoices')
      .select(`
        *,
        lease:leases (
          *,
          unit:units (*)
        )
      `)
      .eq('period_month', currentMonth)
      .eq('period_year', currentYear)
      .eq('status', 'pending');

    if (invoicesError) {
      throw invoicesError;
    }

    console.log(`Found ${rentInvoices?.length || 0} pending rent invoices for ${currentYear}-${currentMonth}`);

    // Pour chaque loyer attendu, chercher une transaction correspondante
    for (const invoice of rentInvoices || []) {
      console.log(`Checking payment for invoice ${invoice.id} - Amount: ${invoice.total_amount}`);

      // Chercher une transaction correspondante dans les transactions non matchées
      const { data: matchingTransactions, error: transError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('status', 'unmatched')
        .gte('amount', invoice.total_amount * 0.95) // Tolérance de 5%
        .lte('amount', invoice.total_amount * 1.05)
        .gte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lte('date', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay}`);

      if (transError) {
        console.error('Error searching for matching transactions:', transError);
        continue;
      }

      if (matchingTransactions && matchingTransactions.length > 0) {
        const matchedTransaction = matchingTransactions[0];
        console.log(`Found matching transaction ${matchedTransaction.id} for invoice ${invoice.id}`);

        // Marquer la transaction comme matchée
        await supabase
          .from('bank_transactions')
          .update({
            status: 'matched',
            matched_rent_invoice_id: invoice.id,
            match_score: 100,
          })
          .eq('id', matchedTransaction.id);

        // Marquer le loyer comme payé
        await supabase
          .from('rent_invoices')
          .update({
            status: 'paid',
            paid_date: matchedTransaction.date,
          })
          .eq('id', invoice.id);

        console.log(`Rent invoice ${invoice.id} marked as paid`);

        // Générer la quittance de loyer automatiquement
        console.log(`Generating receipt for invoice ${invoice.id}`);
        try {
          const receiptResponse = await supabase.functions.invoke('generate-receipt', {
            body: { invoiceId: invoice.id },
          });

          if (receiptResponse.error) {
            console.error('Error generating receipt:', receiptResponse.error);
          } else {
            console.log('Receipt generated successfully:', receiptResponse.data);
          }
        } catch (receiptError) {
          console.error('Exception while generating receipt:', receiptError);
        }
      } else {
        console.log(`No matching transaction found for invoice ${invoice.id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed_connections: connections?.length || 0,
        checked_invoices: rentInvoices?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing rent payments:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
