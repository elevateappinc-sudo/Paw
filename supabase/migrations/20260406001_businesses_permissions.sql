-- ============================================================
-- F-ADMIN: Plataforma Administrativa + Sistema de Permisos Granular
-- Sprint 3 · PAW
-- ============================================================

-- ----- businesses -----
CREATE TABLE IF NOT EXISTS businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  logo_url      TEXT,
  qr_token      UUID NOT NULL DEFAULT gen_random_uuid(),
  qr_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_qr_token ON businesses(qr_token);

-- ----- pet_members -----
-- Registra relación entre una mascota y un miembro (negocio u otra persona)
CREATE TABLE IF NOT EXISTS pet_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id      UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  member_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pet_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_pet_members_pet ON pet_members(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_members_member ON pet_members(member_id);
CREATE INDEX IF NOT EXISTS idx_pet_members_business ON pet_members(business_id);

-- ----- pet_member_permissions -----
-- Permisos granulares por módulo para cada miembro de una mascota
CREATE TABLE IF NOT EXISTS pet_member_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_member_id UUID NOT NULL REFERENCES pet_members(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,  -- dashboard | gastos | entrenamiento | vacunas | itinerario | medicamentos | info
  access_level  TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('none', 'view', 'edit')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pet_member_id, module)
);

CREATE INDEX IF NOT EXISTS idx_pmp_pet_member ON pet_member_permissions(pet_member_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_member_permissions ENABLE ROW LEVEL SECURITY;

-- businesses: owner full access, members can view their business
CREATE POLICY "businesses_owner_all" ON businesses
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "businesses_member_select" ON businesses
  FOR SELECT USING (
    id IN (
      SELECT business_id FROM pet_members WHERE member_id = auth.uid() AND status = 'active'
    )
  );

-- pet_members: pet owner can manage all; member can view own rows
CREATE POLICY "pet_members_owner_all" ON pet_members
  FOR ALL USING (
    pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
  );

CREATE POLICY "pet_members_self_select" ON pet_members
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "pet_members_self_update_status" ON pet_members
  FOR UPDATE USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- pet_member_permissions: pet owner can manage; member can view own
CREATE POLICY "pmp_owner_all" ON pet_member_permissions
  FOR ALL USING (
    pet_member_id IN (
      SELECT pm.id FROM pet_members pm
      JOIN pets p ON p.id = pm.pet_id
      WHERE p.owner_id = auth.uid()
    )
  );

CREATE POLICY "pmp_member_select" ON pet_member_permissions
  FOR SELECT USING (
    pet_member_id IN (
      SELECT id FROM pet_members WHERE member_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger: grant_initial_permissions
-- Cuando se acepta un pet_member (status -> active), crear permisos
-- por defecto "view" para todos los módulos
-- ============================================================

CREATE OR REPLACE FUNCTION grant_initial_permissions()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_module TEXT;
  v_modules TEXT[] := ARRAY[
    'dashboard','gastos','entrenamiento','vacunas',
    'itinerario','notificaciones','medicamentos','info'
  ];
BEGIN
  -- Only trigger when status transitions to 'active'
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO pet_member_permissions (pet_member_id, module, access_level)
      VALUES (NEW.id, v_module, 'view')
      ON CONFLICT (pet_member_id, module) DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_grant_initial_permissions
  AFTER INSERT OR UPDATE ON pet_members
  FOR EACH ROW EXECUTE FUNCTION grant_initial_permissions();

-- updated_at auto-update helper
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pet_members_updated_at
  BEFORE UPDATE ON pet_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pmp_updated_at
  BEFORE UPDATE ON pet_member_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
