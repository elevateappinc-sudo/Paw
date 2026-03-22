CREATE TABLE IF NOT EXISTS public.marketplace_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('free','pro','business')),
  price_monthly DECIMAL(10,2) DEFAULT 0,
  max_listings INT,
  max_images INT DEFAULT 3,
  commission_rate DECIMAL(5,4) DEFAULT 0,
  has_analytics BOOLEAN DEFAULT false,
  has_featured BOOLEAN DEFAULT false,
  has_verified_badge BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.business_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.marketplace_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','cancelled','past_due')),
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id)
);

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('product','service')),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  price_unit TEXT,
  category TEXT NOT NULL CHECK (category IN ('alimentos','accesorios','servicios_vet','peluqueria','paseos','guarderia')),
  images TEXT[] DEFAULT '{}',
  contact_whatsapp TEXT,
  contact_email TEXT,
  active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.marketplace_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','click_whatsapp','click_email')),
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.marketplace_config (key, value, description) VALUES
  ('commission_enabled', 'false', 'Master switch para comisiones'),
  ('free_commission', '0.08', 'Comisión plan Free'),
  ('pro_commission', '0.03', 'Comisión plan Pro'),
  ('business_commission', '0', 'Comisión plan Business')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.marketplace_plans (name, price_monthly, max_listings, max_images, commission_rate, has_analytics, has_featured, has_verified_badge) VALUES
  ('free',     0,     1,    3, 0.08, false, false, false),
  ('pro',      29.99, NULL, 5, 0.03, true,  false, true),
  ('business', 79.99, NULL, 5, 0,    true,  true,  true)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.marketplace_plans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plans_select_all' AND tablename = 'marketplace_plans') THEN
    CREATE POLICY "plans_select_all" ON public.marketplace_plans FOR SELECT USING (true);
  END IF;
END $$;

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'listings_select_active' AND tablename = 'marketplace_listings') THEN
    CREATE POLICY "listings_select_active" ON public.marketplace_listings FOR SELECT USING (active = true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'listings_manage_own' AND tablename = 'marketplace_listings') THEN
    CREATE POLICY "listings_manage_own" ON public.marketplace_listings FOR ALL USING (
      EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    );
  END IF;
END $$;

ALTER TABLE public.business_subscriptions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'subs_manage_own' AND tablename = 'business_subscriptions') THEN
    CREATE POLICY "subs_manage_own" ON public.business_subscriptions FOR ALL USING (
      EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
    );
  END IF;
END $$;

ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_insert_all' AND tablename = 'listing_analytics') THEN
    CREATE POLICY "analytics_insert_all" ON public.listing_analytics FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'analytics_select_own' AND tablename = 'listing_analytics') THEN
    CREATE POLICY "analytics_select_own" ON public.listing_analytics FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.marketplace_listings ml JOIN public.businesses b ON b.id = ml.business_id WHERE ml.id = listing_id AND b.owner_id = auth.uid())
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_business_verified()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE plan_name TEXT;
BEGIN
  SELECT name INTO plan_name FROM public.marketplace_plans WHERE id = NEW.plan_id;
  IF NEW.status = 'active' AND plan_name IN ('pro','business') THEN
    UPDATE public.businesses SET verified = true WHERE id = NEW.business_id;
  ELSE
    UPDATE public.businesses SET verified = false WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_subscription_change ON public.business_subscriptions;
CREATE TRIGGER on_subscription_change AFTER INSERT OR UPDATE ON public.business_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_business_verified();
