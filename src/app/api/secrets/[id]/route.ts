import { NextRequest } from 'next/server';
import { requireProjectAccess } from '@/lib/api-auth';
import { success, handleZodError, error, notFound } from '@/lib/api-response';
import { updateSecretSchema } from '@/lib/schemas';
import { secretService } from '@/lib/services';

/**
 * GET /api/secrets/[id] - Get a single secret
 * PUT /api/secrets/[id] - Update a secret
 * DELETE /api/secrets/[id] - Delete a secret
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const secret = await secretService.getSecretById(id);

    if (!secret) {
      return notFound('Secret not found');
    }

    // Check access to the project
    await requireProjectAccess(secret.projectId, 'secret:read');

    return success(secret);
  } catch (err) {
    console.error('Get secret error:', err);
    const response = handleAuthError(err);
    if (response) return response;
    return error('Internal server error', 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First get the secret to check access
    const existingSecret = await secretService.getSecretById(id);
    if (!existingSecret) {
      return notFound('Secret not found');
    }

    // Check write access
    await requireProjectAccess(existingSecret.projectId, 'secret:write');

    const body = await req.json();
    const data = updateSecretSchema.parse(body);

    const secret = await secretService.update(id, data, existingSecret.projectId);
    return success(secret);
  } catch (err) {
    console.error('Update secret error:', err);
    const response = handleAuthError(err);
    if (response) return response;

    if (err instanceof Error && err.message === 'Secret not found') {
      return notFound();
    }

    return handleZodError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First get the secret to check access
    const existingSecret = await secretService.getSecretById(id);
    if (!existingSecret) {
      return notFound('Secret not found');
    }

    // Check delete access
    await requireProjectAccess(existingSecret.projectId, 'secret:delete');

    await secretService.delete(id, existingSecret.projectId);
    return success({ success: true });
  } catch (err) {
    console.error('Delete secret error:', err);
    const response = handleAuthError(err);
    if (response) return response;

    if (err instanceof Error && err.message === 'Secret not found') {
      return notFound();
    }

    return handleZodError(err);
  }
}

/**
 * Helper to handle auth errors
 */
function handleAuthError(err: unknown) {
  if (err instanceof Error) {
    if (err.message === 'Unauthorized') {
      return error('Unauthorized', 401);
    }
    if (err.message === 'Access denied' || err.message === 'Insufficient permissions') {
      return error(err.message, 403);
    }
  }
  return null;
}
