-- Drop overly permissive document policies and replace with granular access control
-- This allows:
-- 1. Property managers/landlords to see documents they uploaded
-- 2. Tenants to see documents linked to their leases

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Authenticated users can manage documents" ON public.documents;

-- Policy: Users can view documents they uploaded
CREATE POLICY "documents_select_uploader"
  ON public.documents
  FOR SELECT
  USING (uploaded_by = auth.uid());

-- Policy: Users can manage documents they uploaded
CREATE POLICY "documents_all_uploader"
  ON public.documents
  FOR ALL
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Tenants can view documents linked to their leases
-- Matches tenant directly: documents.lease_id → leases.tenant_id = auth.uid()
CREATE POLICY "documents_select_tenant_lease"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.leases l
      WHERE l.id = documents.lease_id
        AND l.status IN ('active', 'signed')
        AND l.tenant_id = auth.uid()
    )
  );

-- Policy: Property managers can view all documents for properties in their entity
-- (if needed in the future, based on entity_id)
-- For now, we rely on uploaded_by check

-- Add comment to clarify access control
COMMENT ON TABLE public.documents IS 'Stores document metadata with RLS policies: uploaders can manage their documents, tenants can view documents linked to their active/signed leases';
