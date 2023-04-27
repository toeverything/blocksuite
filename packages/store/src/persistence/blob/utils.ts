import { Buffer } from 'buffer';

export async function sha(input: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', input);
  const buffer = Buffer.from(hash);

  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
