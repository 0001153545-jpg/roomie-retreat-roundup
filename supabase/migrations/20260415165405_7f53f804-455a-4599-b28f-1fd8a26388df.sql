
CREATE TABLE public.resilience_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  tables_included TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resilience_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view backups"
ON public.resilience_backups FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create backups"
ON public.resilience_backups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can delete own backups"
ON public.resilience_backups FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
