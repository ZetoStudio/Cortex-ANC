-- Employee onboarding approvals (HR submits → super admin approves).

CREATE TABLE IF NOT EXISTS hr_employee_approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hr_employee_approvals_tenant_idx
  ON hr_employee_approvals (tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS hr_employee_approvals_requester_idx
  ON hr_employee_approvals (tenant_id, requested_by, status);

ALTER TABLE hr_employee_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hr_employee_approvals_policy ON hr_employee_approvals;
CREATE POLICY hr_employee_approvals_policy ON hr_employee_approvals
  USING (tenant_id = current_setting('app.current_tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true));
