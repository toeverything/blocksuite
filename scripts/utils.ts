import { promisify } from 'node:util';
import { brotliCompress, gzip } from 'node:zlib';

export const gzipAsync = promisify(gzip);
export const brotliAsync = promisify(brotliCompress);
