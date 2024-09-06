import { BlockSuiteError, ErrorCode } from '@blocksuite/global/exceptions';
import { effect, signal } from '@preact/signals-core';
import { createMutex } from 'lib0/mutex.js';
import * as Y from 'yjs';

import type { Schema } from '../../../schema/schema.js';
import type { Doc } from '../doc.js';
import type { YBlock } from './types.js';

import {
  Boxed,
  createYProxy,
  native2Y,
  type UnRecord,
  y2Native,
} from '../../../reactive/index.js';
import { BlockModel, internalPrimitives } from '../../../schema/base.js';

/**
 * @internal
 * SyncController is responsible for syncing the block data with Yjs.
 * It creates a proxy model that syncs with Yjs and provides a reactive interface.
 * It also handles the stashing and popping of props.
 * It will also provide signals for block props.
 *
 */
export class SyncController {
  private _byPassProxy: boolean = false;

  private readonly _byPassUpdate = (fn: () => void) => {
    this._byPassProxy = true;
    fn();
    this._byPassProxy = false;
  };

  private readonly _mutex = createMutex();

  private readonly _observeYBlockChanges = () => {
    this.yBlock.observe(event => {
      event.keysChanged.forEach(key => {
        const type = event.changes.keys.get(key);
        if (!type) {
          return;
        }
        if (type.action === 'update' || type.action === 'add') {
          const value = this.yBlock.get(key);
          const keyName = key.replace('prop:', '');
          const proxy = this._getPropsProxy(keyName, value);
          this._byPassUpdate(() => {
            // @ts-ignore
            this.model[keyName] = proxy;
            const signalKey = `${keyName}$`;
            this._mutex(() => {
              // @ts-ignore
              if (signalKey in this.model) {
                // @ts-ignore
                this.model[signalKey].value = y2Native(value);
              }
            });
          });
          this.onChange?.(keyName, value);
          return;
        }
        if (type.action === 'delete') {
          const keyName = key.replace('prop:', '');
          this._byPassUpdate(() => {
            // @ts-ignore
            delete this.model[keyName];
            // @ts-ignore
            if (`${keyName}$` in this.model) {
              // @ts-ignore
              this.model[`${keyName}$`].value = undefined;
            }
          });
          this.onChange?.(keyName, undefined);
          return;
        }
      });
    });
  };

  private readonly _stashed = new Set<string | number>();

  readonly flavour: string;

  readonly id: string;

  readonly model: BlockModel;

  readonly pop = (prop: string) => {
    if (!this._stashed.has(prop)) return;
    this._popProp(prop);
  };

  readonly stash = (prop: string) => {
    if (this._stashed.has(prop)) return;

    this._stashed.add(prop);
    this._stashProp(prop);
  };

  readonly version: number;

  readonly yChildren: Y.Array<string[]>;

  constructor(
    readonly schema: Schema,
    readonly yBlock: YBlock,
    readonly doc?: Doc,
    readonly onChange?: (key: string, value: unknown) => void
  ) {
    const { id, flavour, version, yChildren, props } = this._parseYBlock();

    this.id = id;
    this.flavour = flavour;
    this.yChildren = yChildren;
    this.version = version;

    this.model = this._createModel(props);

    this._observeYBlockChanges();
  }

  private _createModel(props: UnRecord) {
    const _mutex = this._mutex;
    const schema = this.schema.flavourSchemaMap.get(this.flavour);
    if (!schema) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        `schema for flavour: ${this.flavour} not found`
      );
    }

    const model = schema.model.toModel?.() ?? new BlockModel<object>();
    const signalWithProps = Object.entries(props).reduce(
      (acc, [key, value]) => {
        const data = signal(value);
        const dispose = effect(() => {
          const value = data.value;
          if (!this.model) return;
          _mutex(() => {
            // @ts-ignore
            this.model[key] = value;
          });
        });
        model.deleted.once(dispose);
        return {
          ...acc,
          [`${key}$`]: data,
          [key]: value,
        };
      },
      {} as Record<string, unknown>
    );
    Object.assign(model, signalWithProps);

    model.id = this.id;
    model.version = this.version;
    model.keys = Object.keys(props);
    model.flavour = schema.model.flavour;
    model.role = schema.model.role;
    model.yBlock = this.yBlock;
    model.stash = this.stash;
    model.pop = this.pop;
    if (this.doc) {
      model.doc = this.doc;
    }

    const proxy = new Proxy(model, {
      has: (target, p) => {
        return Reflect.has(target, p);
      },
      set: (target, p, value, receiver) => {
        if (
          !this._byPassProxy &&
          typeof p === 'string' &&
          model.keys.includes(p)
        ) {
          if (this._stashed.has(p)) {
            setValue(target, p, value);
            const result = Reflect.set(target, p, value, receiver);
            this.onChange?.(p, value);
            return result;
          }

          const yValue = native2Y(value);
          this.yBlock.set(`prop:${p}`, yValue);
          const proxy = this._getPropsProxy(p, yValue);
          setValue(target, p, value);
          return Reflect.set(target, p, proxy, receiver);
        }

        return Reflect.set(target, p, value, receiver);
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target, p) => {
        if (
          !this._byPassProxy &&
          typeof p === 'string' &&
          model.keys.includes(p)
        ) {
          this.yBlock.delete(`prop:${p}`);
          setValue(target, p, undefined);
        }

        return Reflect.deleteProperty(target, p);
      },
    });

    function setValue(target: BlockModel, p: string, value: unknown) {
      _mutex(() => {
        // @ts-ignore
        target[`${p}$`].value = value;
      });
    }
    return proxy;
  }

  private _getPropsProxy(name: string, value: unknown) {
    return createYProxy(value, {
      onChange: () => {
        this.onChange?.(name, value);
        const signalKey = `${name}$`;
        if (signalKey in this.model) {
          this._mutex(() => {
            // @ts-ignore
            this.model[signalKey].value = this.model[name];
          });
        }
      },
    });
  }

  private _parseYBlock() {
    let id: string | undefined;
    let flavour: string | undefined;
    let version: number | undefined;
    let yChildren: Y.Array<string[]> | undefined;
    const props: Record<string, unknown> = {};

    this.yBlock.forEach((value, key) => {
      if (key.startsWith('prop:')) {
        const keyName = key.replace('prop:', '');
        props[keyName] = this._getPropsProxy(keyName, value);
        return;
      }
      if (key === 'sys:id' && typeof value === 'string') {
        id = value;
        return;
      }
      if (key === 'sys:flavour' && typeof value === 'string') {
        flavour = value;
        return;
      }
      if (key === 'sys:children' && value instanceof Y.Array) {
        yChildren = value;
        return;
      }
      if (key === 'sys:version' && typeof value === 'number') {
        version = value;
        return;
      }
    });

    if (!id) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        'block id is not found when creating model'
      );
    }
    if (!flavour) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        'block flavour is not found when creating model'
      );
    }
    if (!yChildren) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        'block children is not found when creating model'
      );
    }

    const schema = this.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      throw new BlockSuiteError(
        ErrorCode.ModelCRUDError,
        `schema for flavour: ${flavour} not found`
      );
    }
    const defaultProps = schema.model.props?.(internalPrimitives);

    if (typeof version !== 'number') {
      // no version found in data, set to schema version
      version = schema.version;
    }

    // Set default props if not exists
    if (defaultProps) {
      Object.entries(defaultProps).forEach(([key, value]) => {
        if (key in props) return;

        const yValue = native2Y(value);
        this.yBlock.set(`prop:${key}`, yValue);
        props[key] = this._getPropsProxy(key, yValue);
      });
    }

    return {
      id,
      flavour,
      version,
      props,
      yChildren,
    };
  }

  private _popProp(prop: string) {
    const model = this.model as BlockModel<Record<string, unknown>>;

    const value = model[prop];
    this._stashed.delete(prop);
    model[prop] = value;
  }

  private _stashProp(prop: string) {
    (this.model as BlockModel<Record<string, unknown>>)[prop] = y2Native(
      this.yBlock.get(`prop:${prop}`),
      {
        transform: (value, origin) => {
          if (Boxed.is(origin)) {
            return value;
          }
          if (origin instanceof Y.Map) {
            return new Proxy(value as UnRecord, {
              get: (target, p, receiver) => {
                return Reflect.get(target, p, receiver);
              },
              set: (target, p, value, receiver) => {
                const result = Reflect.set(target, p, value, receiver);
                this.onChange?.(prop, value);
                return result;
              },
              deleteProperty: (target, p) => {
                const result = Reflect.deleteProperty(target, p);
                this.onChange?.(prop, undefined);
                return result;
              },
            });
          }
          if (origin instanceof Y.Array) {
            return new Proxy(value as unknown[], {
              get: (target, p, receiver) => {
                return Reflect.get(target, p, receiver);
              },
              set: (target, p, value, receiver) => {
                const index = Number(p);
                if (Number.isNaN(index)) {
                  return Reflect.set(target, p, value, receiver);
                }
                const result = Reflect.set(target, p, value, receiver);
                this.onChange?.(prop, value);
                return result;
              },
              deleteProperty: (target, p) => {
                const result = Reflect.deleteProperty(target, p);
                this.onChange?.(p as string, undefined);
                return result;
              },
            });
          }

          return value;
        },
      }
    );
  }
}
