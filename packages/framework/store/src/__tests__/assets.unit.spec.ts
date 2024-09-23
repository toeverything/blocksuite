import { BlockSuiteError } from '@blocksuite/global/exceptions';
import { describe, expect, test } from 'vitest';

import { getAssetName } from '../adapter/assets.js';

describe('getAssetName', () => {
  test('should return the name if it exists', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new File([], 'image.png', { type: 'image/png' })],
      ['blobId2', new File([], 'image', { type: 'image/png' })],
      // inconsistent name with type
      ['blobId3', new File([], 'image.jpg', { type: 'image/png' })],
      // empty name
      ['blobId4', new File([], '', { type: 'image/png' })],
    ]);
    expect(getAssetName(assets, 'blobId')).toBe('image.png');
    expect(getAssetName(assets, 'blobId2')).toBe('image.png');
    // respect the original name
    expect(getAssetName(assets, 'blobId3')).toBe('image.jpg');
    expect(getAssetName(assets, 'blobId4')).toBe('blobId4.png');
  });

  test('should return blobId with extension if name does not exist', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new Blob([], { type: 'image/jpeg' })],
    ]);
    const result = getAssetName(assets, 'blobId');
    expect(result).toBe('blobId.jpeg');
  });

  test('should return the name if it exists but type is empty', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new File([], 'document.test', { type: '' })],
    ]);
    const result = getAssetName(assets, 'blobId');
    expect(result).toBe('document.test');
  });

  test('should return the original name even not ext found', () => {
    const assets = new Map<string, Blob>([['blobId', new File([], 'blob.')]]);
    const result = getAssetName(assets, 'blobId');
    expect(result).toBe('blob.');
  });

  test('should return blobId with "blob" extension if type is empty', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new Blob([])],
      ['blobId2', new Blob([], { type: '' })],
    ]);
    expect(getAssetName(assets, 'blobId')).toBe('blobId.blob');
    expect(getAssetName(assets, 'blobId2')).toBe('blobId2.blob');
  });

  test('should return blobId with last part of mime type if extension is not found', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new Blob([], { type: 'application/unknown' })],
    ]);
    const result = getAssetName(assets, 'blobId');
    expect(result).toBe('blobId.unknown');
  });

  test('should return blobId with bin if type is octet-stream', () => {
    const assets = new Map<string, Blob>([
      ['blobId', new Blob([], { type: 'application/octet-stream' })],
    ]);
    const result = getAssetName(assets, 'blobId');
    expect(result).toBe('blobId.bin');
  });

  test('should throw BlockSuiteError if blob is not found', () => {
    const assets = new Map<string, Blob>();
    expect(() => getAssetName(assets, 'blobId')).toThrow(BlockSuiteError);
    expect(() => getAssetName(assets, 'blobId')).toThrowError(
      'blob not found for blobId: blobId'
    );
  });
});
