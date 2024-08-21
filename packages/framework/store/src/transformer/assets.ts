import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

interface BlobCRUD {
  get: (key: string) => Promise<Blob | null> | Blob | null;
  set: (key: string, value: Blob) => Promise<string> | string;
  delete: (key: string) => Promise<void> | void;
  list: () => Promise<string[]> | string[];
}

type AssetsManagerConfig = {
  blob: BlobCRUD;
};

function makeNewNameWhenConflict(names: Set<string>, name: string) {
  let i = 1;
  const ext = name.split('.').at(-1) ?? '';
  let newName = name.replace(new RegExp(`.${ext}$`), ` (${i}).${ext}`);
  while (names.has(newName)) {
    newName = name.replace(new RegExp(`.${ext}$`), ` (${i}).${ext}`);
    i++;
  }
  return newName;
}

export class AssetsManager {
  private readonly _assetsMap = new Map<string, Blob>();

  private readonly _blob: BlobCRUD;

  private readonly _names = new Set<string>();

  private readonly _pathBlobIdMap = new Map<string, string>();

  constructor(options: AssetsManagerConfig) {
    this._blob = options.blob;
  }

  cleanup() {
    this._assetsMap.clear();
    this._names.clear();
  }

  getAssets() {
    return this._assetsMap;
  }

  getPathBlobIdMap() {
    return this._pathBlobIdMap;
  }

  isEmpty() {
    return this._assetsMap.size === 0;
  }

  async readFromBlob(blobId: string) {
    let blob = await this._blob.get(blobId);
    if (!blob) {
      console.error(`Blob ${blobId} not found in blob manager`);
      return;
    }
    const name = (blob as File).name;
    if (name && this._names.has(name)) {
      const newName = makeNewNameWhenConflict(this._names, name);
      this._names.add(newName);
      blob = new File([blob], newName, {
        type: blob.type,
      }) as Blob;
    }
    this._assetsMap.set(blobId, blob);
  }

  async writeToBlob(blobId: string) {
    const blob = this._assetsMap.get(blobId);
    if (!blob) {
      throw new BlockSuiteError(
        ErrorCode.TransformerError,
        'Blob ${blobId} not found in assets manager'
      );
    }

    const exists = (await this._blob.get(blobId)) !== null;
    if (exists) {
      return;
    }

    await this._blob.set(blobId, blob);
  }
}
