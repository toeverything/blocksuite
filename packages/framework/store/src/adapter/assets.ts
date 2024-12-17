import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { sha } from '@blocksuite/global/utils';

/**
 * @internal just for test
 */
export class MemoryBlobCRUD {
  private readonly _map = new Map<string, Blob>();

  delete(key: string) {
    this._map.delete(key);
  }

  get(key: string) {
    return this._map.get(key) ?? null;
  }

  list() {
    return Array.from(this._map.keys());
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
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        'value is required'
      );
    }

    this._map.set(key, value);
    return key;
  }
}

export const mimeExtMap = new Map([
  ['application/epub+zip', 'epub'],
  ['application/gzip', 'gz'],
  ['application/java-archive', 'jar'],
  ['application/json', 'json'],
  ['application/ld+json', 'jsonld'],
  ['application/msword', 'doc'],
  ['application/octet-stream', 'bin'],
  ['application/ogg', 'ogx'],
  ['application/pdf', 'pdf'],
  ['application/rtf', 'rtf'],
  ['application/vnd.amazon.ebook', 'azw'],
  ['application/vnd.apple.installer+xml', 'mpkg'],
  ['application/vnd.mozilla.xul+xml', 'xul'],
  ['application/vnd.ms-excel', 'xls'],
  ['application/vnd.ms-fontobject', 'eot'],
  ['application/vnd.ms-powerpoint', 'ppt'],
  ['application/vnd.oasis.opendocument.presentation', 'odp'],
  ['application/vnd.oasis.opendocument.spreadsheet', 'ods'],
  ['application/vnd.oasis.opendocument.text', 'odt'],
  [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptx',
  ],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'docx',
  ],
  ['application/vnd.rar', 'rar'],
  ['application/vnd.visio', 'vsd'],
  ['application/x-7z-compressed', '7z'],
  ['application/x-abiword', 'abw'],
  ['application/x-bzip', 'bz'],
  ['application/x-bzip2', 'bz2'],
  ['application/x-cdf', 'cda'],
  ['application/x-csh', 'csh'],
  ['application/x-freearc', 'arc'],
  ['application/x-httpd-php', 'php'],
  ['application/x-sh', 'sh'],
  ['application/x-tar', 'tar'],
  ['application/xhtml+xml', 'xhtml'],
  ['application/xml', 'xml'],
  ['application/zip', 'zip'],
  ['application/zstd', 'zst'],
  ['audio/3gpp', '3gp'],
  ['audio/3gpp2', '3g2'],
  ['audio/aac', 'aac'],
  ['audio/midi', 'mid'],
  ['audio/mpeg', 'mp3'],
  ['audio/ogg', 'oga'],
  ['audio/opus', 'opus'],
  ['audio/wav', 'wav'],
  ['audio/webm', 'weba'],
  ['audio/x-midi', 'midi'],
  ['font/otf', 'otf'],
  ['font/ttf', 'ttf'],
  ['font/woff', 'woff'],
  ['font/woff2', 'woff2'],
  ['image/apng', 'apng'],
  ['image/avif', 'avif'],
  ['image/bmp', 'bmp'],
  ['image/gif', 'gif'],
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/svg+xml', 'svg'],
  ['image/tiff', 'tiff'],
  ['image/vnd.microsoft.icon', 'ico'],
  ['image/webp', 'webp'],
  ['text/calendar', 'ics'],
  ['text/css', 'css'],
  ['text/csv', 'csv'],
  ['text/html', 'html'],
  ['text/javascript', 'js'],
  ['text/plain', 'txt'],
  ['text/xml', 'xml'],
  ['video/3gpp', '3gp'],
  ['video/3gpp2', '3g2'],
  ['video/mp2t', 'ts'],
  ['video/mp4', 'mp4'],
  ['video/mpeg', 'mpeg'],
  ['video/ogg', 'ogv'],
  ['video/webm', 'webm'],
  ['video/x-msvideo', 'avi'],
]);

export const extMimeMap = new Map(
  Array.from(mimeExtMap.entries()).map(([mime, ext]) => [ext, mime])
);

const getExt = (type: string) => {
  if (type === '') return 'blob';
  const ext = mimeExtMap.get(type);
  if (ext) return ext;
  const guessExt = type.split('/');
  return guessExt.at(-1) ?? 'blob';
};

export function getAssetName(assets: Map<string, Blob>, blobId: string) {
  const blob = assets.get(blobId);
  if (!blob) {
    throw new BlockSuiteError(
      ErrorCode.TransformerError,
      `blob not found for blobId: ${blobId}`
    );
  }

  const name =
    'name' in blob && typeof blob.name === 'string' ? blob.name : undefined;
  if (name) {
    if (name.includes('.')) return name;
    return `${name}.${getExt(blob.type)}`;
  }
  return `${blobId}.${getExt(blob.type)}`;
}
