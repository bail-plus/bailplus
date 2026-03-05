-- Reset account data - Delete all records except user profiles
-- Delete in order to respect foreign key constraints

-- Delete bank transactions
DELETE FROM public.bank_transactions;

-- Delete communication logs
DELETE FROM public.communication_logs;

-- Delete communication templates
DELETE FROM public.communication_templates;

-- Delete work orders
DELETE FROM public.work_orders;

-- Delete documents
DELETE FROM public.documents;

-- Delete deposits
DELETE FROM public.deposits;

-- Delete expenses
DELETE FROM public.expenses;

-- Delete rent invoices
DELETE FROM public.rent_invoices;

-- Delete maintenance tickets
DELETE FROM public.maintenance_tickets;

-- Delete leases
DELETE FROM public.leases;

-- Delete tenants
DELETE FROM public.tenants;

-- Delete units
DELETE FROM public.units;

-- Delete properties
DELETE FROM public.properties;

-- Delete entities (but keep user profiles)
DELETE FROM public.entities;