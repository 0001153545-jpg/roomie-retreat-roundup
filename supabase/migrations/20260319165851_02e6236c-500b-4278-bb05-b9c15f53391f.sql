
-- Add images array column to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add discount_percent to listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS discount_percent integer DEFAULT 0;

-- Add payment and guest details to reservations
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'credit';
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL';
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS adults integer DEFAULT 1;
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS children_ages integer[] DEFAULT '{}';
