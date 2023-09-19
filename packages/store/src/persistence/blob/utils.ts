export async function sha(input: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', input);
  const decoder = new TextDecoder('utf8');
  return decoder.decode(hash);
}
