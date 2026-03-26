export function normalizePermissionList<T extends string = string>(
  permissions: unknown
): T[] {
  if (Array.isArray(permissions)) {
    return permissions.filter(
      (permission): permission is T => typeof permission === 'string'
    );
  }

  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (permission): permission is T => typeof permission === 'string'
        );
      }
    } catch {
      return [];
    }
  }

  return [];
}
