-- ============================================================
-- Smith's CRM — Full Database Setup
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SCHEMA
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bikes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
  make         TEXT NOT NULL,
  model        TEXT NOT NULL,
  year         INTEGER,
  registration TEXT,
  color        TEXT,
  vin          TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS job_number_seq START 1001;

CREATE TABLE IF NOT EXISTS jobs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_number            INTEGER UNIQUE DEFAULT nextval('job_number_seq'),
  bike_id               UUID REFERENCES bikes(id) ON DELETE SET NULL,
  customer_id           UUID REFERENCES customers(id) ON DELETE SET NULL,
  status                TEXT NOT NULL DEFAULT 'checked_in'
                        CHECK (status IN ('checked_in','in_progress','ready','checked_out')),
  check_in_date         TIMESTAMPTZ DEFAULT NOW(),
  check_out_date        TIMESTAMPTZ,
  customer_description  TEXT,
  work_performed        TEXT,
  damage_notes          TEXT,
  estimated_cost        NUMERIC(10,2),
  final_cost            NUMERIC(10,2),
  odometer_in           INTEGER,
  odometer_out          INTEGER,
  customer_acknowledged BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url   TEXT,
  caption      TEXT,
  photo_type   TEXT DEFAULT 'check_in'
               CHECK (photo_type IN ('check_in','check_out','damage','work')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS bikes_updated_at ON bikes;
CREATE TRIGGER bikes_updated_at
  BEFORE UPDATE ON bikes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (open for V1 — no auth yet)
-- ============================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

-- Allow all operations from anon role (no login required in V1)
CREATE POLICY "allow_all_customers"  ON customers  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_bikes"      ON bikes      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_jobs"       ON jobs       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_job_photos" ON job_photos FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA — 3 customers, 4 bikes, 4 jobs
-- ============================================================

DO $$
DECLARE
  mike_id    UUID := uuid_generate_v4();
  sarah_id   UUID := uuid_generate_v4();
  dave_id    UUID := uuid_generate_v4();

  honda_id    UUID := uuid_generate_v4();
  kawasaki_id UUID := uuid_generate_v4();
  triumph_id  UUID := uuid_generate_v4();
  bmw_id      UUID := uuid_generate_v4();
BEGIN

  -- Customers
  INSERT INTO customers (id, name, phone, email, address, notes) VALUES
    (mike_id,  'Mike Thompson',  '07700 900123', 'mike.t@email.com',    '14 Elm Close, Sheffield S1 2AA',   'Regular customer, prefers phone calls'),
    (sarah_id, 'Sarah Jenkins',  '07700 900456', 'sarah.j@email.com',   '7 Oak Avenue, Sheffield S3 4BB',   NULL),
    (dave_id,  'Dave Kowalski',  '07700 900789', 'dave.k@email.com',    '32 Birch Lane, Rotherham S60 1CC', 'Has two bikes — always in a rush');

  -- Bikes
  INSERT INTO bikes (id, customer_id, make, model, year, registration, color, vin) VALUES
    (honda_id,    mike_id,  'Honda',    'CBR600RR',      2019, 'SH19 XYZ', 'Red',         'JH2PC40J6XM200001'),
    (kawasaki_id, sarah_id, 'Kawasaki', 'Ninja 400',     2021, 'KZ21 ABC', 'Lime Green',  'JKAEX8A19MDA00001'),
    (triumph_id,  dave_id,  'Triumph',  'Street Triple', 2018, 'TR18 DEF', 'Matt Silver', 'SMTD64HPXHJ700001'),
    (bmw_id,      dave_id,  'BMW',      'R1250GS',       2020, 'BM20 GHI', 'Blue',        'WB10408070ZS00001');

  -- Jobs
  INSERT INTO jobs (job_number, bike_id, customer_id, status, check_in_date, customer_description, damage_notes, estimated_cost, odometer_in) VALUES
    (1001, honda_id,    mike_id,  'in_progress', NOW() - INTERVAL '3 days',
     'Full service — 12,000 mile service due. Also a slight hesitation on startup in the cold.',
     'Small scratch on right fairing (pre-existing, customer confirmed).',
     320.00, 11850),

    (1002, kawasaki_id, sarah_id, 'checked_in',  NOW() - INTERVAL '1 day',
     'MOT prep — needs to pass MOT next week. Check brakes and lights.',
     'None noted.',
     95.00, 4200),

    (1003, triumph_id,  dave_id,  'ready',        NOW() - INTERVAL '5 days',
     'Front brake lever feels spongy. Has the bike been dropped? Also wants new tyres.',
     'Scuffed left bar-end from minor tip-over. Both mirrors intact.',
     480.00, 18730),

    (1004, bmw_id,      dave_id,  'checked_out',  NOW() - INTERVAL '14 days',
     'Annual service plus replace chain and sprockets.',
     NULL,
     550.00, 22100);

  -- Update the completed job
  UPDATE jobs
  SET
    status           = 'checked_out',
    check_out_date   = NOW() - INTERVAL '10 days',
    work_performed   = 'Completed full annual service. Replaced chain and both sprockets. Oil, filter, spark plugs all done. Brake fluid flushed front and rear.',
    final_cost       = 538.50,
    odometer_out     = 22100,
    customer_acknowledged = TRUE
  WHERE job_number = 1004;

  -- Update in-progress job with some work notes
  UPDATE jobs
  SET work_performed = 'Oil and filter changed. Air filter replaced. Chain adjusted and lubed. Investigating cold start issue — suspect air/fuel mixture sensor.'
  WHERE job_number = 1001;

  -- Update ready job
  UPDATE jobs
  SET
    work_performed = 'Replaced front brake fluid and bled system. Brake feel restored. Fitted new front (Pirelli Diablo Rosso IV) and rear (Michelin Power 5) tyres. Bar-end replaced.',
    final_cost     = 492.00,
    odometer_out   = 18730,
    customer_acknowledged = FALSE
  WHERE job_number = 1003;

END $$;

-- ============================================================
-- STORAGE BUCKET (run separately in Supabase dashboard if preferred)
-- ============================================================
-- In your Supabase dashboard → Storage → New bucket:
--   Name: job-photos
--   Public: YES
-- Then add this policy in the SQL editor:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('job-photos', 'job-photos', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "allow_all_job_photos_storage"
--   ON storage.objects FOR ALL TO anon
--   USING (bucket_id = 'job-photos')
--   WITH CHECK (bucket_id = 'job-photos');
