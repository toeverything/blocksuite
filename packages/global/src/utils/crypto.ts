export async function sha(input: ArrayBufferLike): Promise<string> {
  let sha256: Buffer;
  if (typeof window === 'undefined') {
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256');
    hash.update(Buffer.from(input));
    sha256 = hash.digest();
  } else {
    const hash = await crypto.subtle.digest('SHA-256', input);
    sha256 = Buffer.from(hash);
  }
  return sha256.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
