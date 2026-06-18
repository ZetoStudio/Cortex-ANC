-- Remove demo HR / employee portal data for tenant-hr-dev (keeps tenant + dev users).

DELETE FROM employee_todos WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM employee_settings WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_payslips WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_leave_requests WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_payroll_runs WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_emergency_notices WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_plugin_connections WHERE tenant_id = 'tenant-hr-dev';
DELETE FROM hr_employees WHERE tenant_id = 'tenant-hr-dev';

UPDATE "user"
SET "employeeId" = NULL
WHERE email = 'employee@cortex.local';
