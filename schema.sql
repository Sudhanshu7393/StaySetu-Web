-- ============================================================
--  StaySetu — Supabase Complete PostgreSQL Database Schema
--  Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (Users synced with Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT, -- For backward compatibility
  full_name TEXT,
  name TEXT,
  email TEXT,
  role TEXT CHECK (role IN ('student', 'owner', 'admin')) DEFAULT 'student',
  phone TEXT,
  whatsapp TEXT,
  college TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ============================================================

-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Automatically create profile on new Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  preferred_role TEXT;
  user_name TEXT;
BEGIN
  preferred_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, user_id, email, full_name, name, role)
  VALUES (
    NEW.id,
    NEW.id::text,
    NEW.email,
    user_name,
    user_name,
    preferred_role
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
      name = COALESCE(public.profiles.name, EXCLUDED.name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 3. LISTINGS (Properties: PGs, Hostels, Flats)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  location TEXT NOT NULL,
  latitude TEXT,
  longitude TEXT,
  type TEXT NOT NULL DEFAULT 'PG',
  phone_number TEXT,
  whatsapp_number TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'rented', 'sold')) DEFAULT 'pending',
  featured BOOLEAN DEFAULT false,
  gender_preference TEXT DEFAULT 'any',
  listed_by TEXT DEFAULT 'owner',
  occupancy JSONB DEFAULT '[]'::jsonb,
  association TEXT DEFAULT '',
  nearby_college TEXT DEFAULT '',
  deposit TEXT DEFAULT '',
  available_from TEXT DEFAULT '',
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TRIGGER IF EXISTS set_listings_updated_at ON public.listings;
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. FAVORITES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, listing_id)
);

-- ============================================================
-- 5. ROOMMATE REQUESTS (Student posts looking for roommates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roommate_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  college TEXT,
  budget NUMERIC DEFAULT 0,
  whatsapp TEXT,
  gender_preference TEXT DEFAULT 'any',
  move_in_date TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'closed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 6. ROOMMATE CONNECT REQUESTS (Student connection interest)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roommate_connect_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  roommate_post_id UUID REFERENCES public.roommate_requests(id) ON DELETE CASCADE NOT NULL,
  poster_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  post_location TEXT,
  post_college TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 7. MESSAGES (Direct Chat between Users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 8. REVIEWS (Ratings & comments on properties)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 9. MAID SERVICES (Cook, Cleaning, Laundry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maid_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  poster_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  service_type TEXT DEFAULT 'all-in-one',
  timing TEXT,
  price NUMERIC,
  whatsapp_number TEXT NOT NULL,
  phone_number TEXT,
  gender_preference TEXT DEFAULT 'any',
  image_url TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 10. WHATSAPP LEADS (Click tracking analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  listing_id TEXT,
  listing_title TEXT,
  owner_name TEXT,
  clicker_user_id TEXT DEFAULT 'guest',
  clicker_name TEXT DEFAULT 'Guest',
  clicker_email TEXT,
  source TEXT DEFAULT 'unknown',
  message TEXT,
  clicked_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- 11. INDEXES FOR HIGH PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_owner_id ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_type ON public.listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_location ON public.listings(location);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(featured);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_listing_id ON public.favorites(listing_id);

CREATE INDEX IF NOT EXISTS idx_roommates_user_id ON public.roommate_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_roommates_status ON public.roommate_requests(status);
CREATE INDEX IF NOT EXISTS idx_roommates_created_at ON public.roommate_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_roommate_post ON public.roommate_connect_requests(roommate_post_id);
CREATE INDEX IF NOT EXISTS idx_connect_poster ON public.roommate_connect_requests(poster_id);
CREATE INDEX IF NOT EXISTS idx_connect_requester ON public.roommate_connect_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON public.messages(listing_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_maids_status ON public.maid_services(status);
CREATE INDEX IF NOT EXISTS idx_maids_posted_by ON public.maid_services(posted_by);
CREATE INDEX IF NOT EXISTS idx_maids_location ON public.maid_services(location);

CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.whatsapp_leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_clicked_at ON public.whatsapp_leads(clicked_at DESC);

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_connect_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maid_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_leads ENABLE ROW LEVEL SECURITY;

-- ----------------- PROFILES POLICIES -----------------
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- ----------------- LISTINGS POLICIES -----------------
DROP POLICY IF EXISTS "Approved listings are viewable by everyone" ON public.listings;
CREATE POLICY "Approved listings are viewable by everyone" 
  ON public.listings FOR SELECT 
  USING (status IN ('approved', 'rented', 'sold') OR auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings" 
  ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners and admins can update listings" ON public.listings;
CREATE POLICY "Owners and admins can update listings" 
  ON public.listings FOR UPDATE USING (auth.uid() = owner_id OR public.is_admin());

DROP POLICY IF EXISTS "Owners and admins can delete listings" ON public.listings;
CREATE POLICY "Owners and admins can delete listings" 
  ON public.listings FOR DELETE USING (auth.uid() = owner_id OR public.is_admin());

-- ----------------- FAVORITES POLICIES -----------------
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
CREATE POLICY "Users can view their own favorites" 
  ON public.favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.favorites;
CREATE POLICY "Users can insert their own favorites" 
  ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;
CREATE POLICY "Users can delete their own favorites" 
  ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ----------------- ROOMMATE REQUESTS POLICIES -----------------
DROP POLICY IF EXISTS "Approved roommate requests viewable by everyone" ON public.roommate_requests;
CREATE POLICY "Approved roommate requests viewable by everyone" 
  ON public.roommate_requests FOR SELECT 
  USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create roommate requests" ON public.roommate_requests;
CREATE POLICY "Users can create roommate requests" 
  ON public.roommate_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can update roommate requests" ON public.roommate_requests;
CREATE POLICY "Users and admins can update roommate requests" 
  ON public.roommate_requests FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users and admins can delete roommate requests" ON public.roommate_requests;
CREATE POLICY "Users and admins can delete roommate requests" 
  ON public.roommate_requests FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ----------------- ROOMMATE CONNECT REQUESTS POLICIES -----------------
DROP POLICY IF EXISTS "Involved users and admins can view connect requests" ON public.roommate_connect_requests;
CREATE POLICY "Involved users and admins can view connect requests" 
  ON public.roommate_connect_requests FOR SELECT 
  USING (auth.uid() = requester_id OR auth.uid() = poster_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can send connect requests" ON public.roommate_connect_requests;
CREATE POLICY "Users can send connect requests" 
  ON public.roommate_connect_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Posters and admins can update connect requests" ON public.roommate_connect_requests;
CREATE POLICY "Posters and admins can update connect requests" 
  ON public.roommate_connect_requests FOR UPDATE USING (auth.uid() = poster_id OR public.is_admin());

-- ----------------- MESSAGES POLICIES -----------------
DROP POLICY IF EXISTS "Users can view their conversation messages" ON public.messages;
CREATE POLICY "Users can view their conversation messages" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" 
  ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receivers can update message read status" ON public.messages;
CREATE POLICY "Receivers can update message read status" 
  ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- ----------------- REVIEWS POLICIES -----------------
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" 
  ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post reviews" ON public.reviews;
CREATE POLICY "Authenticated users can post reviews" 
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users and admins can delete reviews" ON public.reviews;
CREATE POLICY "Users and admins can delete reviews" 
  ON public.reviews FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ----------------- MAID SERVICES POLICIES -----------------
DROP POLICY IF EXISTS "Approved maid services viewable by everyone" ON public.maid_services;
CREATE POLICY "Approved maid services viewable by everyone" 
  ON public.maid_services FOR SELECT 
  USING (status = 'approved' OR auth.uid() = posted_by OR public.is_admin());

DROP POLICY IF EXISTS "Users can post maid services" ON public.maid_services;
CREATE POLICY "Users can post maid services" 
  ON public.maid_services FOR INSERT WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "Posters and admins can update maid services" ON public.maid_services;
CREATE POLICY "Posters and admins can update maid services" 
  ON public.maid_services FOR UPDATE USING (auth.uid() = posted_by OR public.is_admin());

DROP POLICY IF EXISTS "Posters and admins can delete maid services" ON public.maid_services;
CREATE POLICY "Posters and admins can delete maid services" 
  ON public.maid_services FOR DELETE USING (auth.uid() = posted_by OR public.is_admin());

-- ----------------- WHATSAPP LEADS POLICIES -----------------
DROP POLICY IF EXISTS "Anyone can insert whatsapp leads" ON public.whatsapp_leads;
CREATE POLICY "Anyone can insert whatsapp leads" 
  ON public.whatsapp_leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Only admins can view whatsapp leads" ON public.whatsapp_leads;
CREATE POLICY "Only admins can view whatsapp leads" 
  ON public.whatsapp_leads FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete whatsapp leads" ON public.whatsapp_leads;
CREATE POLICY "Only admins can delete whatsapp leads" 
  ON public.whatsapp_leads FOR DELETE USING (public.is_admin());

-- ============================================================
-- 13. STORAGE BUCKET CREATION & STORAGE POLICIES
-- ============================================================

-- Create 'listing-images' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Anyone can view listing images
DROP POLICY IF EXISTS "Public Access to Listing Images" ON storage.objects;
CREATE POLICY "Public Access to Listing Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

-- Storage Policy: Authenticated users can upload listing images
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

-- Storage Policy: Users can delete or update their own uploaded files
DROP POLICY IF EXISTS "Users can update their listing images" ON storage.objects;
CREATE POLICY "Users can update their listing images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-images' AND auth.uid() = owner);

DROP POLICY IF EXISTS "Users can delete their listing images" ON storage.objects;
CREATE POLICY "Users can delete their listing images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-images' AND auth.uid() = owner);

-- ============================================================
-- 14. REALTIME PUBLICATION (Optional - for live chat/messages)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
