import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-INVOICES] ${step}${detailsStr}`);
};

interface LeaseWithDetails {
  id: string;
  user_id: string;
  unit_id: string;
  rent_amount: number;
  charges_amount: number;
  status: string;
  start_date: string;
  end_date: string | null;
  tenant?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
  };
  unit?: {
    unit_number: string;
    property?: {
      name: string;
    };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key (full access)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false
        }
      }
    );

    logStep("Supabase client initialized");

    // Optional: Verify user authentication (for manual triggers)
    // For cron jobs, this won't be needed
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

      if (userError) {
        logStep("Authentication warning", { error: userError.message });
        // Continue anyway - might be a cron job
      } else {
        logStep("User authenticated", { userId: userData.user?.id });
      }
    } else {
      logStep("No auth header - running as cron job");
    }

    // Get current date info
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Due date is the 5th of the month
    const dueDate = new Date(currentYear, now.getMonth(), 5);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    logStep("Processing invoices for period", {
      month: currentMonth,
      year: currentYear,
      dueDate: dueDateStr
    });

    // 1. Fetch all active leases
    const { data: leases, error: leasesError } = await supabaseClient
      .from('leases')
      .select(`
        id,
        user_id,
        unit_id,
        rent_amount,
        charges_amount,
        status,
        start_date,
        end_date,
        tenant:profiles!leases_tenant_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        unit:units!leases_unit_id_fkey (
          unit_number,
          property:properties!units_property_id_fkey (
            name
          )
        )
      `)
      .eq('status', 'active');

    if (leasesError) {
      logStep("ERROR fetching leases", { error: leasesError.message });
      throw new Error(`Error fetching leases: ${leasesError.message}`);
    }

    logStep("Fetched leases", { count: leases?.length || 0 });

    if (!leases || leases.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active leases found',
          invoicesCreated: 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    // 2. Filter leases that are currently active (within date range)
    const activeLeases = leases.filter((lease: LeaseWithDetails) => {
      const startDate = new Date(lease.start_date);
      const endDate = lease.end_date ? new Date(lease.end_date) : null;

      // Lease must have started and not ended
      return startDate <= now && (!endDate || endDate >= now);
    });

    logStep("Active leases in date range", { count: activeLeases.length });

    // 3. For each active lease, check if invoice already exists for this period
    const invoicesToCreate = [];

    for (const lease of activeLeases) {
      // Check if invoice already exists for this period
      const { data: existingInvoice } = await supabaseClient
        .from('rent_invoices')
        .select('id')
        .eq('lease_id', lease.id)
        .eq('period_month', currentMonth)
        .eq('period_year', currentYear)
        .maybeSingle();

      if (existingInvoice) {
        logStep("Invoice already exists for lease", { leaseId: lease.id });
        continue;
      }

      // Prepare invoice data
      const totalAmount = lease.rent_amount + (lease.charges_amount || 0);

      invoicesToCreate.push({
        lease_id: lease.id,
        user_id: lease.user_id,
        period_month: currentMonth,
        period_year: currentYear,
        rent_amount: lease.rent_amount,
        charges_amount: lease.charges_amount ?? 0,
        total_amount: totalAmount,
        due_date: dueDateStr,
        status: 'pending',
        paid_date: null,
        pdf_url: null
      });

      logStep("Prepared invoice for lease", {
        leaseId: lease.id,
        totalAmount,
        tenant: lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Unknown'
      });
    }

    logStep("Invoices to create", { count: invoicesToCreate.length });

    // 4. Bulk insert invoices
    if (invoicesToCreate.length > 0) {
      const { data: createdInvoices, error: insertError } = await supabaseClient
        .from('rent_invoices')
        .insert(invoicesToCreate)
        .select();

      if (insertError) {
        logStep("ERROR creating invoices", { error: insertError.message });
        throw new Error(`Error creating invoices: ${insertError.message}`);
      }

      logStep("Successfully created invoices", { count: createdInvoices?.length || 0 });

      // TODO: Send email notifications to tenants (optional)
      // for (const invoice of createdInvoices) {
      //   await sendInvoiceEmail(invoice)
      // }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${invoicesToCreate.length} invoices for ${currentMonth}/${currentYear}`,
        invoicesCreated: invoicesToCreate.length,
        details: {
          totalLeases: leases.length,
          activeLeases: activeLeases.length,
          newInvoices: invoicesToCreate.length
        }
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-monthly-invoices", { message: errorMessage });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});
