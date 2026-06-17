-- Demo HR + employee portal data for tenant-hr-dev (idempotent).
-- Run after migrations 007_hr_module.sql and 008_employee_portal.sql.

INSERT INTO tenants (id, name, slug)
VALUES ('tenant-hr-dev', 'HR Workspace', 'hr-workspace')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_onboarding (tenant_id)
VALUES ('tenant-hr-dev')
ON CONFLICT DO NOTHING;

-- Employees (upsert by tenant + email so dev-bypass rows are reused)
INSERT INTO hr_employees (
  id, tenant_id, employee_code, full_name, email, department, designation,
  join_date, status, salary_monthly, currency
) VALUES
  ('emp-demo-alex', 'tenant-hr-dev', 'EMP-DEV01', 'Alex Employee', 'employee@cortex.local',
   'Engineering', 'Software Engineer', '2024-03-15', 'active', 85000, 'INR'),
  ('emp-demo-priya', 'tenant-hr-dev', 'EMP-1002', 'Priya Sharma', 'priya.sharma@cortex.local',
   'Engineering', 'Senior Engineer', '2023-01-10', 'active', 120000, 'INR'),
  ('emp-demo-rahul', 'tenant-hr-dev', 'EMP-1003', 'Rahul Mehta', 'rahul.mehta@cortex.local',
   'Sales', 'Account Executive', '2022-08-01', 'active', 95000, 'INR'),
  ('emp-demo-sneha', 'tenant-hr-dev', 'EMP-1004', 'Sneha Iyer', 'sneha.iyer@cortex.local',
   'People Ops', 'HR Generalist', '2021-06-20', 'active', 78000, 'INR'),
  ('emp-demo-vikram', 'tenant-hr-dev', 'EMP-1005', 'Vikram Patel', 'vikram.patel@cortex.local',
   'Product', 'Product Manager', '2023-11-05', 'active', 110000, 'INR')
ON CONFLICT (tenant_id, email) DO UPDATE SET
  employee_code = EXCLUDED.employee_code,
  full_name = EXCLUDED.full_name,
  department = EXCLUDED.department,
  designation = EXCLUDED.designation,
  status = EXCLUDED.status,
  salary_monthly = EXCLUDED.salary_monthly,
  updated_at = NOW();

-- Payroll run (May 2026)
INSERT INTO hr_payroll_runs (
  id, tenant_id, period_label, period_start, period_end, status,
  total_gross, total_net, employee_count, processed_at
) VALUES (
  'payroll-run-2026-05', 'tenant-hr-dev', 'May 2026', '2026-05-01', '2026-05-31', 'processed',
  488000, 439200, 5, NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  total_gross = EXCLUDED.total_gross,
  total_net = EXCLUDED.total_net,
  employee_count = EXCLUDED.employee_count,
  processed_at = EXCLUDED.processed_at,
  updated_at = NOW();

-- Payslips (Alex uses whatever employee id matches employee@cortex.local)
INSERT INTO hr_payslips (
  id, tenant_id, employee_id, payroll_run_id, period_label,
  gross_pay, deductions, net_pay, status, issued_at
)
SELECT
  v.id, 'tenant-hr-dev', e.id, 'payroll-run-2026-05', v.period_label,
  v.gross_pay, v.deductions::jsonb, v.net_pay, 'issued', NOW()
FROM (VALUES
  ('payslip-alex-2026-05', 'employee@cortex.local', 'May 2026', 85000,
   '[{"label":"PF","amount":8500},{"label":"Tax","amount":4250}]', 72250),
  ('payslip-priya-2026-05', 'priya.sharma@cortex.local', 'May 2026', 120000,
   '[{"label":"PF","amount":12000},{"label":"Tax","amount":9600}]', 98400),
  ('payslip-rahul-2026-05', 'rahul.mehta@cortex.local', 'May 2026', 95000,
   '[{"label":"PF","amount":9500},{"label":"Tax","amount":5700}]', 79800),
  ('payslip-sneha-2026-05', 'sneha.iyer@cortex.local', 'May 2026', 78000,
   '[{"label":"PF","amount":7800},{"label":"Tax","amount":3900}]', 66300),
  ('payslip-vikram-2026-05', 'vikram.patel@cortex.local', 'May 2026', 110000,
   '[{"label":"PF","amount":11000},{"label":"Tax","amount":7700}]', 91300)
) AS v(id, email, period_label, gross_pay, deductions, net_pay)
JOIN hr_employees e ON e.tenant_id = 'tenant-hr-dev' AND e.email = v.email
ON CONFLICT (id) DO UPDATE SET
  gross_pay = EXCLUDED.gross_pay,
  net_pay = EXCLUDED.net_pay,
  status = EXCLUDED.status,
  issued_at = EXCLUDED.issued_at,
  updated_at = NOW();

-- Leave requests
INSERT INTO hr_leave_requests (
  id, tenant_id, employee_id, leave_type, start_date, end_date, days, reason, status
)
SELECT v.id, 'tenant-hr-dev', e.id, v.leave_type, v.start_date::date, v.end_date::date,
       v.days, v.reason, v.status
FROM (VALUES
  ('leave-alex-pending', 'employee@cortex.local', 'casual', '2026-06-20', '2026-06-21', 2,
   'Family event in Pune', 'pending'),
  ('leave-priya-pending', 'priya.sharma@cortex.local', 'earned', '2026-07-01', '2026-07-05', 5,
   'Summer vacation', 'pending'),
  ('leave-vikram-approved', 'vikram.patel@cortex.local', 'sick', '2026-06-10', '2026-06-11', 2,
   'Medical rest', 'approved')
) AS v(id, email, leave_type, start_date, end_date, days, reason, status)
JOIN hr_employees e ON e.tenant_id = 'tenant-hr-dev' AND e.email = v.email
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  reason = EXCLUDED.reason,
  updated_at = NOW();

-- Emergency notice
INSERT INTO hr_emergency_notices (
  id, tenant_id, title, body, severity, target_scope, published_by, expires_at
) VALUES (
  'notice-fire-drill-2026',
  'tenant-hr-dev',
  'Fire drill — June 18',
  'Mandatory fire evacuation drill on Wednesday, 18 June at 4:00 PM IST. Gather at Parking Lot B. Remote employees: no action required.',
  'info',
  'all',
  'HR Admin',
  '2026-06-30T00:00:00Z'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  severity = EXCLUDED.severity,
  expires_at = EXCLUDED.expires_at,
  updated_at = NOW();

-- Employee todos (Alex)
INSERT INTO employee_todos (
  id, tenant_id, employee_id, title, description, due_date, priority, completed
)
SELECT v.id, 'tenant-hr-dev', e.id, v.title, v.description, v.due_date::date, v.priority, v.completed
FROM (VALUES
  ('todo-alex-1', 'employee@cortex.local', 'Complete security training',
   'Finish the annual security awareness module in the LMS.', '2026-06-15', 'high', false),
  ('todo-alex-2', 'employee@cortex.local', 'Submit May timesheet',
   'Log any remaining hours before payroll lock.', '2026-06-12', 'medium', false),
  ('todo-alex-3', 'employee@cortex.local', 'Review Q2 goals with manager',
   'Prepare self-assessment notes for 1:1.', '2026-06-25', 'low', false),
  ('todo-alex-4', 'employee@cortex.local', 'Update emergency contact',
   'Confirm phone number on file is current.', '2026-05-30', 'medium', true)
) AS v(id, email, title, description, due_date, priority, completed)
JOIN hr_employees e ON e.tenant_id = 'tenant-hr-dev' AND e.email = v.email
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  due_date = EXCLUDED.due_date,
  priority = EXCLUDED.priority,
  completed = EXCLUDED.completed,
  updated_at = NOW();

INSERT INTO employee_settings (employee_id, tenant_id, theme)
SELECT e.id, 'tenant-hr-dev', 'dark'
FROM hr_employees e
WHERE e.tenant_id = 'tenant-hr-dev' AND e.email = 'employee@cortex.local'
ON CONFLICT (employee_id) DO NOTHING;

-- Link dev portal users
UPDATE "user" u
SET "employeeId" = e.id, "tenantId" = 'tenant-hr-dev', role = 'employee'
FROM hr_employees e
WHERE u.email = 'employee@cortex.local'
  AND e.tenant_id = 'tenant-hr-dev'
  AND e.email = 'employee@cortex.local';

UPDATE "user"
SET "tenantId" = 'tenant-hr-dev', role = 'hr'
WHERE email = 'hr@cortex.local';
