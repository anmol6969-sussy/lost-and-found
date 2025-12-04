-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT false
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Create flags/reports table
CREATE TABLE public.flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flags
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;

-- Users can create flags
CREATE POLICY "Users can flag items"
ON public.flags
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add claim and SSD fields to items table
ALTER TABLE public.items 
ADD COLUMN claimed_by UUID,
ADD COLUMN claim_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN with_ssd BOOLEAN DEFAULT false,
ADD COLUMN ssd_location TEXT,
ADD COLUMN ssd_contact TEXT;

-- Create function to delete old claimed items
CREATE OR REPLACE FUNCTION delete_old_claimed_items()
RETURNS void AS $$
BEGIN
  DELETE FROM public.items
  WHERE is_claimed = true
  AND claim_date IS NOT NULL
  AND claim_date < NOW() - INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql;

-- Create a cron-like trigger (note: this requires pg_cron extension which may not be available)
-- For now, this function can be called manually or via a scheduled edge function