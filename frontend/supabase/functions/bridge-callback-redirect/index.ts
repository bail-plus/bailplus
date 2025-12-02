import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    // Récupérer les paramètres de l'URL
    const url = new URL(req.url);
    const itemId = url.searchParams.get('item_id');

    // Rediriger vers l'application frontend avec le paramètre item_id
    const redirectUrl = `http://localhost:8080/settings/bank-callback?item_id=${itemId}`;

    console.log('Redirecting to:', redirectUrl);

    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
      },
    });
  } catch (error) {
    console.error('Error in callback redirect:', error);
    return new Response('Error processing callback', { status: 500 });
  }
});
