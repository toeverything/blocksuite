import { toBase64 } from 'lib0/buffer.js';
import { digest } from 'lib0/hash/sha256';

export async function sha(input: ArrayBuffer): Promise<string> {
  const hash =
    crypto.subtle === undefined // crypto.subtle is not available without a secure context (HTTPS)
      ? digest(new Uint8Array(input))
      : await crypto.subtle.digest('SHA-256', input);

  // faster conversion from ArrayBuffer to base64 in browser
  return toBase64(new Uint8Array(hash)).replace(/\+/g, '-').replace(/\//g, '_');
}
