import { Slot } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';

import { pick } from '../../../_common/utils/iterable.js';

export class LocalRecordManager<T> {
  private _localRecords = new Map<string, Partial<T>>();
  private _wrappedModelCache = new WeakMap<BaseBlockModel, BaseBlockModel>();

  slots = {
    updated: new Slot<{
      id: string;
      data: {
        old: { [key in keyof Partial<T>]: Partial<T>[keyof T] } | undefined;
        new: Partial<T>;
      };
    }>(),
    deleted: new Slot<string>(),
  };

  constructor() {}

  update(id: string, newRecords: Partial<T>) {
    const currentRecord = this._localRecords.get(id);

    if (currentRecord) {
      this._localRecords.set(id, { ...currentRecord, ...newRecords });
    } else {
      this._localRecords.set(id, newRecords);
    }

    this.slots.updated.emit({
      id,
      data: {
        old: currentRecord
          ? pick(currentRecord, Object.keys(newRecords) as (keyof T)[])
          : undefined,
        new: newRecords,
      },
    });
  }

  get(id: string): Partial<T> | undefined {
    return this._localRecords.get(id);
  }

  delete(id: string) {
    this._localRecords.delete(id);
    this.slots.deleted.emit(id);
  }

  each(callback: (id: string, record: Partial<T>, idx: number) => void) {
    const data = Array.from(this._localRecords.entries());

    data.forEach(([id, record], idx) => callback(id, record, idx));
  }

  wrap(model: BaseBlockModel) {
    if (!this._wrappedModelCache.has(model)) {
      this._wrappedModelCache.set(model, localRecordWrapper(model, this));
    }

    return this._wrappedModelCache.get(model) as BaseBlockModel;
  }

  destroy() {
    this.slots.updated.dispose();
    this.slots.deleted.dispose();
  }
}

/**
 * This wraps block tree model with local record, so that its props can be temporarily shadowed.
 * Useful for cases like batch dragging, where per-frame update could be too expensive.
 */
export function localRecordWrapper<T>(
  model: BaseBlockModel,
  localRecord: LocalRecordManager<T>
) {
  return new Proxy(model, {
    get: (target, prop, receiver) => {
      return localRecord.get(target.id) &&
        Object.hasOwn(localRecord.get(target.id) as T as object, prop)
        ? localRecord.get(target.id)![prop as keyof T]
        : Reflect.get(target, prop, receiver);
    },
  });
}
