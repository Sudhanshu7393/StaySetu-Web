-- ============================================================
-- StaySetu Database Schema for Supabase (PostgreSQL)
-- Foolproof 1-Click Execution Script
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE,
    full_name TEXT,
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'student',
    college TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage profiles" ON public.profiles;
CREATE POLICY "Users can manage profiles" ON public.profiles FOR ALL USING (true);

-- 2. LISTINGS TABLE (Properties, Flats, PGs)
CREATE TABLE IF NOT EXISTS public.listings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    security_deposit NUMERIC DEFAULT 0,
    brokerage_fee NUMERIC DEFAULT 0,
    property_type TEXT DEFAULT 'PG',
    type TEXT DEFAULT 'PG',
    purpose TEXT DEFAULT 'rent',
    city TEXT DEFAULT 'Greater Noida',
    locality TEXT,
    location TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    gender_preference TEXT DEFAULT 'all',
    occupancy JSONB DEFAULT '[]'::jsonb,
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    videos JSONB DEFAULT '[]'::jsonb,
    rules JSONB DEFAULT '[]'::jsonb,
    owner_id TEXT,
    owner_name TEXT,
    owner_phone TEXT,
    whatsapp_number TEXT DEFAULT '9289614973',
    is_verified BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active',
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view listings" ON public.listings;
CREATE POLICY "Public can view listings" ON public.listings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage listings" ON public.listings;
CREATE POLICY "Users can manage listings" ON public.listings FOR ALL USING (true);

-- 3. ROOMMATE REQUESTS
CREATE TABLE IF NOT EXISTS public.roommate_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    name TEXT,
    college TEXT,
    city TEXT,
    locality TEXT,
    budget NUMERIC,
    gender TEXT,
    move_in_date TEXT,
    habits JSONB DEFAULT '[]'::jsonb,
    about TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.roommate_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view roommate requests" ON public.roommate_requests;
CREATE POLICY "Public can view roommate requests" ON public.roommate_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage roommate requests" ON public.roommate_requests;
CREATE POLICY "Users can manage roommate requests" ON public.roommate_requests FOR ALL USING (true);

-- 4. ROOMMATE CONNECT REQUESTS
CREATE TABLE IF NOT EXISTS public.roommate_connect_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    requester_id TEXT,
    target_id TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.roommate_connect_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage connect requests" ON public.roommate_connect_requests;
CREATE POLICY "Users can manage connect requests" ON public.roommate_connect_requests FOR ALL USING (true);

-- 5. MAID & COOK SERVICES DIRECTORY
CREATE TABLE IF NOT EXISTS public.maid_services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    location TEXT,
    city TEXT DEFAULT 'Greater Noida',
    services JSONB DEFAULT '[]'::jsonb,
    service_type TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    monthly_rate NUMERIC DEFAULT 0,
    experience TEXT,
    rating NUMERIC DEFAULT 5.0,
    is_verified BOOLEAN DEFAULT true,
    photo_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.maid_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view maid services" ON public.maid_services;
CREATE POLICY "Public can view maid services" ON public.maid_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage maid services" ON public.maid_services;
CREATE POLICY "Users can manage maid services" ON public.maid_services FOR ALL USING (true);

-- 6. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    listing_id TEXT,
    user_id TEXT,
    user_name TEXT,
    user_avatar TEXT,
    rating NUMERIC DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage reviews" ON public.reviews;
CREATE POLICY "Users can manage reviews" ON public.reviews FOR ALL USING (true);

-- 7. WHATSAPP LEADS
CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    phone_number TEXT,
    listing_id TEXT,
    listing_title TEXT,
    owner_name TEXT,
    clicker_user_id TEXT,
    clicker_name TEXT,
    clicker_email TEXT,
    source TEXT,
    message TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.whatsapp_leads;
CREATE POLICY "Anyone can insert leads" ON public.whatsapp_leads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view leads" ON public.whatsapp_leads;
CREATE POLICY "Anyone can view leads" ON public.whatsapp_leads FOR SELECT USING (true);

-- 8. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender_id TEXT,
    sender_name TEXT,
    receiver_id TEXT,
    receiver_name TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage messages" ON public.messages;
CREATE POLICY "Users can manage messages" ON public.messages FOR ALL USING (true);

-- 9. VISIT REQUESTS
CREATE TABLE IF NOT EXISTS public.visit_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    listing_id TEXT,
    listing_title TEXT,
    user_id TEXT,
    user_name TEXT,
    user_phone TEXT,
    visit_date TEXT,
    visit_time TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create visit requests" ON public.visit_requests;
CREATE POLICY "Anyone can create visit requests" ON public.visit_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can view visit requests" ON public.visit_requests;
CREATE POLICY "Anyone can view visit requests" ON public.visit_requests FOR SELECT USING (true);

-- 10. FAVORITES
CREATE TABLE IF NOT EXISTS public.favorites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    listing_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage favorites" ON public.favorites;
CREATE POLICY "Users can manage favorites" ON public.favorites FOR ALL USING (true);

-- 11. STORAGE BUCKET FOR LISTING IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access listing-images" ON storage.objects;
CREATE POLICY "Public Access listing-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Public Upload listing-images" ON storage.objects;
CREATE POLICY "Public Upload listing-images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Public Update listing-images" ON storage.objects;
CREATE POLICY "Public Update listing-images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'listing-images');
