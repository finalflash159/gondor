import { NextRequest } from 'next/server';
import { requireProjectAccess } from '@/lib/api-auth';
import { success, handleZodError, error } from '@/lib/api-response';
import { createFolderSchema, listFoldersQuerySchema } from '@/lib/schemas';
import { folderService } from '@/lib/services';

/**
 * GET /api/projects/[id]/folders - List folders
 * POST /api/projects/[id]/folders - Create folder
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    await requireProjectAccess(projectId, 'secret:read');

    const { searchParams } = new URL(req.url);
    const query = listFoldersQuerySchema.parse({
      envId: searchParams.get('envId'),
    });

    const folders = await folderService.getFolders(projectId, query);
    return success(folders);
  } catch (err) {
    console.error('Get folders error:', err);
    const response = handleAuthError(err);
    if (response) return response;
    return error('Internal server error', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { user } = await requireProjectAccess(projectId, 'folder:manage');

    const body = await req.json();
    const data = createFolderSchema.parse(body);

    const folder = await folderService.create(data, user.id, projectId);
    return success(folder, 201);
  } catch (err) {
    console.error('Create folder error:', err);
    const response = handleAuthError(err);
    if (response) return response;

    if (err instanceof Error) {
      if (err.message.includes('already exists') || err.message === 'Invalid parent folder') {
        return error(err.message, 400);
      }
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
    if (err.message === 'Access denied') {
      return error(err.message, 403);
    }
  }
  return null;
}
