-- Add call log table for per-job notes/call history
CREATE TABLE IF NOT EXISTS call_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon full access" ON call_log FOR ALL TO anon USING (true) WITH CHECK (true);
