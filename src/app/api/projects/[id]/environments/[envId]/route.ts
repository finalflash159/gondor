import { NextRequest } from 'next/server';
import { requireProjectAdmin, handleAuthError } from '@/backend/middleware/auth';
import { success, error } from '@/backend/utils/api-response';
import { environmentService } from '@/backend/services';

/**
 * DELETE /api/projects/[id]/environments/[envId] - Delete environment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; envId: string }> }
) {
  try {
    const { id: projectId, envId } = await params;
    const { user } = await requireProjectAdmin(projectId);

    await environmentService.delete(envId, user.id);
    return success({ success: true });
  } catch (err) {
    console.error('Delete environment error:', err);
    const response = handleAuthError(err);
    if (response) return response;

    if (err instanceof Error && err.message === 'Environment not found') {
      return error(err.message, 404);
    }
    return error('Internal server error', 500);
  }
}
