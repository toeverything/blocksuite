/**
 * The options for the embed iframe url validation
 */
export interface EmbedIframeUrlValidationOptions {
  protocols: string[]; // Allowed protocols, e.g. ['https']
  hostnames: string[]; // Allowed hostnames, e.g. ['docs.google.com']
}

/**
 * Validate the url is allowed to embed in the iframe
 * @param url URL to validate
 * @param options Validation options
 * @returns Whether the url is valid
 */
export function validateEmbedIframeUrl(
  url: string,
  options: EmbedIframeUrlValidationOptions
): boolean {
  try {
    const parsedUrl = new URL(url);

    const { protocols, hostnames } = options;
    return (
      protocols.includes(parsedUrl.protocol) &&
      hostnames.includes(parsedUrl.hostname)
    );
  } catch (e) {
    console.warn(`Invalid embed iframe url: ${url}`, e);
    return false;
  }
}
