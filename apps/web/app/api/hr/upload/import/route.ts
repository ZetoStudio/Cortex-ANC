import { NextResponse } from 'next/server';

import { withHrAuth } from '@/lib/hr-auth';
import { notifySuperAdminEmployeeApproval } from '@/lib/notify-super-admin';
import { buildUploadValidation, clearHrUpload, loadHrUpload } from '@/lib/hr-upload-server';
import { importHrEmployeesBatch, listHrEmployeeEmails } from '@cortex/shared';

export const POST = withHrAuth(async (request, { tenant, user }) => {
  const body = (await request.json()) as { uploadId?: string };
  const uploadId = body.uploadId?.trim();
  if (!uploadId) {
    return NextResponse.json({ error: 'uploadId is required' }, { status: 400 });
  }

  const payload = await loadHrUpload(tenant.tenantId, uploadId);
  if (!payload || payload.tenantId !== tenant.tenantId) {
    return NextResponse.json({ error: 'Upload not found or expired' }, { status: 404 });
  }

  const existingEmails = await listHrEmployeeEmails(tenant);
  const { validations, summary } = buildUploadValidation(payload.rows, existingEmails);

  if (summary.errors > 0) {
    return NextResponse.json(
      {
        error: 'Fix remaining errors and try again',
        validations: validations.filter((v) => v.errors.length > 0),
        summary,
      },
      { status: 400 },
    );
  }

  const { pending, approvals } = await importHrEmployeesBatch(tenant, payload.rows, user.id);
  for (const approval of approvals) {
    await notifySuperAdminEmployeeApproval(tenant.tenantId, approval, user.name);
  }

  await clearHrUpload(tenant.tenantId, uploadId);

  return NextResponse.json({
    success: true,
    pending,
    message: `${pending} employee requests submitted for approval`,
  });
});
