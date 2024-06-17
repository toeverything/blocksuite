export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError';
}
