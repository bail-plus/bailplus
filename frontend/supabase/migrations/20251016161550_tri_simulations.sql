-- Create tri_simulations table for storing TRI (Internal Rate of Return) simulations
CREATE TABLE IF NOT EXISTS public.tri_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    simulation_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for faster user queries
CREATE INDEX IF NOT EXISTS idx_tri_simulations_user_id ON public.tri_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_tri_simulations_entity_id ON public.tri_simulations(entity_id);
CREATE INDEX IF NOT EXISTS idx_tri_simulations_created_at ON public.tri_simulations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.tri_simulations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own simulations
CREATE POLICY "Users can view their own TRI simulations"
    ON public.tri_simulations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create their own simulations
CREATE POLICY "Users can create their own TRI simulations"
    ON public.tri_simulations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own simulations
CREATE POLICY "Users can update their own TRI simulations"
    ON public.tri_simulations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own simulations
CREATE POLICY "Users can delete their own TRI simulations"
    ON public.tri_simulations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_tri_simulations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tri_simulations_updated_at
    BEFORE UPDATE ON public.tri_simulations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tri_simulations_updated_at();

-- Add comment to table
COMMENT ON TABLE public.tri_simulations IS 'Stores TRI (Internal Rate of Return) investment simulations for users';
COMMENT ON COLUMN public.tri_simulations.simulation_data IS 'JSONB column storing all simulation parameters and inputs';
