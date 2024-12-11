import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';

export interface RcRef<T> {
  obj: T;
  release: () => void;
}

export class ObjectPool<Key, T> {
  objects = new Map<Key, { obj: T; rc: number }>();

  timeoutToGc: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly options: {
      onDelete?: (obj: T) => void;
      onDangling?: (obj: T) => boolean;
    } = {}
  ) {}

  private gc() {
    for (const [key, { obj, rc }] of new Map(
      this.objects /* clone the map, because the origin will be modified during iteration */
    )) {
      if (
        rc === 0 &&
        (!this.options.onDangling || this.options.onDangling(obj))
      ) {
        this.options.onDelete?.(obj);

        this.objects.delete(key);
      }
    }

    for (const [_, { rc }] of this.objects) {
      if (rc === 0) return;
    }

    // if all object has referrer, stop gc
    if (this.timeoutToGc) {
      clearInterval(this.timeoutToGc);
    }
  }

  private requestGc() {
    if (this.timeoutToGc) {
      clearInterval(this.timeoutToGc);
    }

    // do gc every 1s
    this.timeoutToGc = setInterval(() => {
      this.gc();
    }, 1000);
  }

  clear() {
    for (const { obj } of this.objects.values()) {
      this.options.onDelete?.(obj);
    }

    this.objects.clear();
  }

  get(key: Key): RcRef<T> | null {
    const exist = this.objects.get(key);
    if (exist) {
      exist.rc++;
      // console.trace('get', key, 'current rc', exist.rc);
      let released = false;
      return {
        obj: exist.obj,
        release: () => {
          // avoid double release
          if (released) return;
          released = true;
          exist.rc--;
          this.requestGc();
        },
      };
    } else {
      // console.log('get', key, 'not found');
    }

    return null;
  }

  put(key: Key, obj: T) {
    // console.trace('put', key);
    const ref = { obj, rc: 0 };
    this.objects.set(key, ref);

    const r = this.get(key);
    if (!r) {
      throw new BlockSuiteError(
        ErrorCode.DocCollectionError,
        'Object not found'
      );
    }

    return r;
  }
}
