import { assertExists, sha } from '@blocksuite/global/utils';

/**
 * @internal just for test
 */
export class MemoryBlobCRUD {
  private readonly _map = new Map<string, Blob>();

  get(key: string) {
    return this._map.get(key) ?? null;
  }

  async set(value: Blob): Promise<string>;
  async set(key: string, value: Blob): Promise<string>;
  async set(valueOrKey: string | Blob, _value?: Blob) {
    const key =
      typeof valueOrKey === 'string'
        ? valueOrKey
        : await sha(await valueOrKey.arrayBuffer());
    const value = typeof valueOrKey === 'string' ? _value : valueOrKey;

    if (!value) {
      throw new Error('value is required');
    }

    this._map.set(key, value);
    return key;
  }

  delete(key: string) {
    this._map.delete(key);
  }

  list() {
    return Array.from(this._map.keys());
  }
}

export const mimeExtMap = new Map([
  ['audio/aac', 'aac'],
  ['application/x-abiword', 'abw'],
  ['image/apng', 'apng'],
  ['application/x-freearc', 'arc'],
  ['image/avif', 'avif'],
  ['video/x-msvideo', 'avi'],
  ['application/vnd.amazon.ebook', 'azw'],
  ['application/octet-stream', 'bin'],
  ['image/bmp', 'bmp'],
  ['application/x-bzip', 'bz'],
  ['application/x-bzip2', 'bz2'],
  ['application/x-cdf', 'cda'],
  ['application/x-csh', 'csh'],
  ['text/css', 'css'],
  ['text/csv', 'csv'],
  ['application/msword', 'doc'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'docx',
  ],
  ['application/vnd.ms-fontobject', 'eot'],
  ['application/epub+zip', 'epub'],
  ['application/gzip', 'gz'],
  ['image/gif', 'gif'],
  ['text/html', 'html'],
  ['image/vnd.microsoft.icon', 'ico'],
  ['text/calendar', 'ics'],
  ['application/java-archive', 'jar'],
  ['image/jpeg', 'jpeg'],
  ['text/javascript', 'js'],
  ['application/json', 'json'],
  ['application/ld+json', 'jsonld'],
  ['audio/midi', 'mid'],
  ['audio/x-midi', 'midi'],
  ['audio/mpeg', 'mp3'],
  ['video/mp4', 'mp4'],
  ['video/mpeg', 'mpeg'],
  ['application/vnd.apple.installer+xml', 'mpkg'],
  ['application/vnd.oasis.opendocument.presentation', 'odp'],
  ['application/vnd.oasis.opendocument.spreadsheet', 'ods'],
  ['application/vnd.oasis.opendocument.text', 'odt'],
  ['audio/ogg', 'oga'],
  ['video/ogg', 'ogv'],
  ['application/ogg', 'ogx'],
  ['audio/opus', 'opus'],
  ['font/otf', 'otf'],
  ['image/png', 'png'],
  ['application/pdf', 'pdf'],
  ['application/x-httpd-php', 'php'],
  ['application/vnd.ms-powerpoint', 'ppt'],
  [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptx',
  ],
  ['application/vnd.rar', 'rar'],
  ['application/rtf', 'rtf'],
  ['application/x-sh', 'sh'],
  ['image/svg+xml', 'svg'],
  ['application/x-tar', 'tar'],
  ['image/tiff', 'tiff'],
  ['video/mp2t', 'ts'],
  ['font/ttf', 'ttf'],
  ['text/plain', 'txt'],
  ['application/vnd.visio', 'vsd'],
  ['audio/wav', 'wav'],
  ['audio/webm', 'weba'],
  ['video/webm', 'webm'],
  ['image/webp', 'webp'],
  ['font/woff', 'woff'],
  ['font/woff2', 'woff2'],
  ['application/xhtml+xml', 'xhtml'],
  ['application/vnd.ms-excel', 'xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  ['application/xml', 'xml'],
  ['text/xml', 'xml'],
  ['application/vnd.mozilla.xul+xml', 'xul'],
  ['application/zip', 'zip'],
  ['application/zstd', 'zst'],
  ['video/3gpp', '3gp'],
  ['audio/3gpp', '3gp'],
  ['video/3gpp2', '3g2'],
  ['audio/3gpp2', '3g2'],
  ['application/x-7z-compressed', '7z'],
]);

export const extMimeMap = new Map(
  Array.from(mimeExtMap.entries()).map(([mime, ext]) => [ext, mime])
);

export function getAssetName(assets: Map<string, Blob>, blobId: string) {
  const getExt = (type: string) => {
    if (type === '') return 'blob';
    const ext = mimeExtMap.get(type);
    if (ext) return ext;
    const exts = type.split('/');
    return exts.at(-1) ?? 'blob';
  };
  const blob = assets.get(blobId);
  assertExists(blob);
  const name = (blob as File).name ?? undefined;
  const ext =
    name !== undefined && name.includes('.')
      ? name.split('.').at(-1)
      : getExt(blob.type);
  return `${name?.split('.').at(0) ?? blobId}.${ext}`;
}
