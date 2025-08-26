-- Create subscriptions table to track user subscription information
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT, -- 'starter', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'inactive', -- 'active', 'canceled', 'past_due', 'inactive'
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own subscription info
CREATE POLICY "select_own_subscription" ON public.subscriptions
FOR SELECT
USING (user_id = auth.uid());

-- Create policy for edge functions to manage subscription info (uses service role)
CREATE POLICY "manage_subscription_service" ON public.subscriptions
FOR ALL
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the handle_new_user function to create a subscription record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  
  -- Insert subscription record with inactive status
  INSERT INTO public.subscriptions (user_id, email, subscribed, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    false,
    'inactive'
  );
  
  RETURN NEW;
END;
$function$;