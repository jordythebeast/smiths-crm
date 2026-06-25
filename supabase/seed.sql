-- ============================================================
-- Smith's CRM — Test Seed Data
-- Paste into Supabase SQL Editor and run once.
-- Safe to run on a fresh database — uses INSERT with subqueries.
-- ============================================================

-- Customers
INSERT INTO customers (name, phone, email) VALUES
  ('Mike Thompson',  '082 555 1234', 'mike.t@gmail.com'),
  ('Sarah Jenkins',  '083 444 5678', 'sarah.j@gmail.com'),
  ('Dave Kowalski',  '071 333 9012', null),
  ('Linda Petersen', '082 111 2233', 'linda.p@outlook.com'),
  ('James Nkosi',    '076 999 4455', null),
  ('Priya Singh',    '084 777 6655', 'priya.s@gmail.com');

-- Bikes
INSERT INTO bikes (customer_id, make, model, year, registration, color, vin) VALUES
  ((SELECT id FROM customers WHERE name='Mike Thompson'),  'Honda',           'CBR600RR',     2019, 'SH 19 XYZ GP', 'Red',          'JH2PC40J6XM200001'),
  ((SELECT id FROM customers WHERE name='Mike Thompson'),  'Kawasaki',        'Ninja 400',    2021, 'KZ 21 ABC GP', 'Lime Green',   null),
  ((SELECT id FROM customers WHERE name='Sarah Jenkins'),  'BMW',             'R1250GS',      2020, 'BM 20 GHI GP', 'Blue',         'WB10408070ZS00001'),
  ((SELECT id FROM customers WHERE name='Dave Kowalski'),  'Triumph',         'Street Triple',2018, 'TR 18 DEF GP', 'Matt Silver',  null),
  ((SELECT id FROM customers WHERE name='Linda Petersen'), 'Yamaha',          'MT-07',        2022, 'YM 22 JKL GP', 'Ice Fluo',     null),
  ((SELECT id FROM customers WHERE name='James Nkosi'),    'Ducati',          'Monster 821',  2017, 'DC 17 MNO GP', 'Red',          'ZDM14BEW6HB000001'),
  ((SELECT id FROM customers WHERE name='Priya Singh'),    'Honda',           'CB500F',       2023, 'SH 23 PQR GP', 'Pearl Blue',   null),
  (NULL,                                                   'Harley-Davidson', 'Sportster S',  2022, 'HD 22 STU GP', 'Gunship Gray', null);

-- Jobs
INSERT INTO jobs (bike_id, customer_id, status, job_type, customer_description, odometer_in) VALUES
  (
    (SELECT id FROM bikes WHERE registration='SH 19 XYZ GP'),
    (SELECT id FROM customers WHERE name='Mike Thompson'),
    'in_progress', 'service', 'Full service + brake pads replacement', 24500
  ),
  (
    (SELECT id FROM bikes WHERE registration='BM 20 GHI GP'),
    (SELECT id FROM customers WHERE name='Sarah Jenkins'),
    'ready', 'service', 'Annual service, chain and sprockets', 18200
  ),
  (
    (SELECT id FROM bikes WHERE registration='TR 18 DEF GP'),
    (SELECT id FROM customers WHERE name='Dave Kowalski'),
    'checked_in', 'service', 'Electrical fault — intermittent starting issue', 31000
  ),
  (
    (SELECT id FROM bikes WHERE registration='YM 22 JKL GP'),
    (SELECT id FROM customers WHERE name='Linda Petersen'),
    'in_progress', 'service', 'Clutch plates and gear oil change', 9800
  ),
  (
    (SELECT id FROM bikes WHERE registration='HD 22 STU GP'),
    NULL,
    'ready', 'buy_sell', 'Bought at auction. New Metzeler tyres fitted, full valet.', null
  );

-- Tasks (mix of overdue, due today, and upcoming)
INSERT INTO tasks (job_id, title, due_date, completed) VALUES
  -- Mike's job — 1 overdue, 1 due today
  (
    (SELECT id FROM jobs WHERE customer_description='Full service + brake pads replacement'),
    'Call Mike — confirm estimated completion date',
    CURRENT_DATE - INTERVAL '1 day',
    false
  ),
  (
    (SELECT id FROM jobs WHERE customer_description='Full service + brake pads replacement'),
    'Order brake pads from supplier',
    CURRENT_DATE,
    false
  ),
  -- Dave's job — 1 due today, 1 upcoming
  (
    (SELECT id FROM jobs WHERE customer_description='Electrical fault — intermittent starting issue'),
    'Diagnose starting issue — check relay and battery',
    CURRENT_DATE,
    false
  ),
  (
    (SELECT id FROM jobs WHERE customer_description='Electrical fault — intermittent starting issue'),
    'Get quote for replacement starter motor',
    CURRENT_DATE + INTERVAL '1 day',
    false
  ),
  -- Linda's job — 2 overdue
  (
    (SELECT id FROM jobs WHERE customer_description='Clutch plates and gear oil change'),
    'Source clutch plate kit — confirm ETA from supplier',
    CURRENT_DATE - INTERVAL '2 days',
    false
  ),
  (
    (SELECT id FROM jobs WHERE customer_description='Clutch plates and gear oil change'),
    'Call Linda with update',
    CURRENT_DATE - INTERVAL '1 day',
    false
  ),
  -- Harley buy & sell — due today
  (
    (SELECT id FROM jobs WHERE customer_description='Bought at auction. New Metzeler tyres fitted, full valet.'),
    'Post listing on Gumtree and Facebook Marketplace',
    CURRENT_DATE,
    false
  );
