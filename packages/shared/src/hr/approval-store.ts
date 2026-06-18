import { randomUUID } from 'node:crypto';

import { queryWithTenant } from '../db/tenant-pool';
import type { TenantContext } from '../tenant/types';
import type { HrEmployee } from './types';
import { upsertHrEmployee } from './hr-store';

export type HrEmployeeApproval = {
  id: string;
  tenantId: string;
  employeeData: Omit<HrEmployee, 'id'>;
  status: 'pending' | 'approved' | 'denied';
  requestedBy: string;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapApproval(row: Record<string, unknown>): HrEmployeeApproval {
  const data = row.employee_data as Record<string, unknown>;
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    employeeData: {
      employeeCode: String(data.employeeCode ?? data.employee_code ?? ''),
      fullName: String(data.fullName ?? data.full_name ?? ''),
      email: String(data.email ?? ''),
      department: String(data.department ?? ''),
      designation: String(data.designation ?? ''),
      joinDate: data.joinDate ? String(data.joinDate).slice(0, 10) : null,
      status: (data.status as HrEmployee['status']) ?? 'active',
      salaryMonthly: Number(data.salaryMonthly ?? data.salary_monthly ?? 0),
      currency: String(data.currency ?? 'INR'),
      emergencyContact: (data.emergencyContact as Record<string, string>) ?? {},
    },
    status: row.status as HrEmployeeApproval['status'],
    requestedBy: String(row.requested_by),
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function createEmployeeApprovalRequest(
  tenant: TenantContext,
  requestedBy: string,
  employeeData: Omit<HrEmployee, 'id'>,
): Promise<HrEmployeeApproval> {
  const approvalId = `apr-${randomUUID().slice(0, 12)}`;
  await queryWithTenant(
    tenant,
    `INSERT INTO hr_employee_approvals (
       id, tenant_id, employee_data, status, requested_by, updated_at
     ) VALUES ($1, $2, $3::jsonb, 'pending', $4, NOW())`,
    [approvalId, tenant.tenantId, JSON.stringify(employeeData), requestedBy],
  );
  const r = await queryWithTenant(tenant, `SELECT * FROM hr_employee_approvals WHERE id = $1`, [
    approvalId,
  ]);
  return mapApproval(r.rows[0] as Record<string, unknown>);
}

export async function listPendingApprovalsForTenant(
  tenant: TenantContext,
): Promise<HrEmployeeApproval[]> {
  const r = await queryWithTenant(
    tenant,
    `SELECT * FROM hr_employee_approvals
     WHERE tenant_id = $1 AND status = 'pending'
     ORDER BY created_at DESC`,
    [tenant.tenantId],
  );
  return r.rows.map((row) => mapApproval(row as Record<string, unknown>));
}

export async function listApprovalsByRequester(
  tenant: TenantContext,
  requestedBy: string,
): Promise<HrEmployeeApproval[]> {
  const r = await queryWithTenant(
    tenant,
    `SELECT * FROM hr_employee_approvals
     WHERE tenant_id = $1 AND requested_by = $2
     ORDER BY created_at DESC`,
    [tenant.tenantId, requestedBy],
  );
  return r.rows.map((row) => mapApproval(row as Record<string, unknown>));
}

export async function listAllPendingApprovals(): Promise<HrEmployeeApproval[]> {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await pool.query(
      `SELECT * FROM hr_employee_approvals WHERE status = 'pending' ORDER BY created_at DESC`,
    );
    return r.rows.map((row) => mapApproval(row as Record<string, unknown>));
  } finally {
    await pool.end();
  }
}

export async function getEmployeeApprovalById(id: string): Promise<HrEmployeeApproval | null> {
  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const r = await pool.query(`SELECT * FROM hr_employee_approvals WHERE id = $1 LIMIT 1`, [id]);
    if (!r.rows.length) return null;
    return mapApproval(r.rows[0] as Record<string, unknown>);
  } finally {
    await pool.end();
  }
}

export async function reviewEmployeeApproval(
  tenant: TenantContext,
  approvalId: string,
  decision: 'approved' | 'denied',
  approvedBy: string,
): Promise<{ approval: HrEmployeeApproval; employee?: HrEmployee }> {
  const existing = await queryWithTenant(
    tenant,
    `SELECT * FROM hr_employee_approvals WHERE id = $1 AND status = 'pending' LIMIT 1`,
    [approvalId],
  );
  if (!existing.rows.length) {
    throw new Error('Approval not found or already reviewed');
  }

  await queryWithTenant(
    tenant,
    `UPDATE hr_employee_approvals
     SET status = $2, approved_by = $3, updated_at = NOW()
     WHERE id = $1`,
    [approvalId, decision, approvedBy],
  );

  const row = existing.rows[0] as Record<string, unknown>;
  const approval = mapApproval({
    ...row,
    status: decision,
    approved_by: approvedBy,
  });

  if (decision === 'denied') {
    return { approval };
  }

  const employee = await upsertHrEmployee(tenant, approval.employeeData);
  return { approval, employee };
}
