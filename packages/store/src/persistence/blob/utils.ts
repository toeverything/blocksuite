import { toBase64 } from 'lib0/buffer.js';

export async function sha(input: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', input);

  // faster conversion from ArrayBuffer to base64 in browser
  return toBase64(new Uint8Array(hash)).replace(/\+/g, '-').replace(/\//g, '_');
}
