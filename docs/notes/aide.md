supabase gen types typescript \
  --project-id xojzkwibfoqdydpbhvaf \
  --schema public > src/integrations/supabase/types.ts


## enregistrer edge function 
supabase functions deploy create-checkout-session


## aide stripe 
https://docs.stripe.com/get-started/development-environment?lang=node

Cartes de test utiles
Paiement réussi : 4242 4242 4242 4242 (n’importe quel futur expiry + CVC).
Déclinée : 4000 0000 0000 0002 (ou autres scénarios d’échec fournis par Stripe).
