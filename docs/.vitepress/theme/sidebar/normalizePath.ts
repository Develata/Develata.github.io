export function normalizeSidebarPath(path?: string): string {
  if (!path) return '';

  const decodedPath = decodePathSafely(path);
  return decodedPath.replace(/\/index(?:\.html)?$/u, '/').replace(/\/$/u, '') || '/';
}

function decodePathSafely(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
