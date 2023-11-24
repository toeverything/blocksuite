class Storage {
  private static _instance: Storage;
  private _storage = sessionStorage;
  private readonly _prefix = 'blocksuite';

  private constructor() {}

  public static getInstance(): Storage {
    if (!Storage._instance) {
      Storage._instance = new Storage();
    }

    return Storage._instance;
  }

  public get(key: string, suffix?: string): string | null {
    key = `${this._prefix}:${key}`;
    if (suffix) {
      key = `${key}:${suffix}`;
    }
    return this._storage.getItem(key);
  }

  public set(key: string, value: string, suffix?: string): void {
    key = `${this._prefix}:${key}`;
    if (suffix) {
      key = `${key}:${suffix}`;
    }
    this._storage.setItem(key, value);
  }

  public remove(key: string): void {
    this._storage.removeItem(key);
  }

  public clear(): void {
    this._storage.clear();
  }

  public get length(): number {
    return this._storage.length;
  }

  public key(index: number): string | null {
    return this._storage.key(index);
  }
}

const storage = Storage.getInstance();

export { storage };
