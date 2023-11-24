class SessionStore {
  private static _instance: SessionStore;
  private _storage = globalThis.sessionStorage;
  private readonly _prefix = 'blocksuite';

  private constructor() {}

  public static getInstance(): SessionStore {
    if (!SessionStore._instance) {
      SessionStore._instance = new SessionStore();
    }

    return SessionStore._instance;
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

const sessionStore = SessionStore.getInstance();

export { sessionStore };
