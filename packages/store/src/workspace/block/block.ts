import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import { Boxed, type UnRecord, y2Native } from '../../reactive/index.js';
import { createYProxy, native2Y } from '../../reactive/index.js';
import { BlockModel, internalPrimitives } from '../../schema/base.js';
import type { Schema } from '../../schema/index.js';

export type YBlock = Y.Map<unknown>;

export type BlockOptions = Partial<{
  onChange: (block: Block, key: string, value: unknown) => void;
}>;

export class Block {
  readonly model: BlockModel;
  readonly id: string;
  readonly flavour: string;
  readonly yChildren: Y.Array<string[]>;
  private _byPassProxy: boolean = false;
  private readonly _stashed: Set<string | number> = new Set();

  constructor(
    readonly schema: Schema,
    readonly yBlock: YBlock,
    readonly options: BlockOptions = {}
  ) {
    const { id, flavour, yChildren, props } = this._parseYBlock();

    this.id = id;
    this.flavour = flavour;
    this.yChildren = yChildren;

    this.model = this._createModel(props);

    this.yChildren.observe(() => {
      this.model.childrenUpdated.emit();
    });

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
          });
          this.model.propsUpdated.emit({ key: keyName });
          return;
        }
        if (type.action === 'delete') {
          const keyName = key.replace('prop:', '');
          this._byPassUpdate(() => {
            // @ts-ignore
            delete this.model[keyName];
          });
          this.model.propsUpdated.emit({ key: keyName });
          return;
        }
      });
    });
  }

  stash = (prop: string) => {
    if (this._stashed.has(prop)) return;

    this._stashed.add(prop);
    // @ts-ignore
    this.model[prop] = y2Native(this.yBlock.get(`prop:${prop}`), {
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
              this.options.onChange?.(this, prop, value);
              return result;
            },
            deleteProperty: (target, p) => {
              const result = Reflect.deleteProperty(target, p);
              this.options.onChange?.(this, prop, undefined);
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
              this.options.onChange?.(this, prop, value);
              return result;
            },
            deleteProperty: (target, p) => {
              const result = Reflect.deleteProperty(target, p);
              this.options.onChange?.(this, p as string, undefined);
              return result;
            },
          });
        }

        return value;
      },
    });
  };

  pop = (prop: string) => {
    if (!this._stashed.has(prop)) return;

    // @ts-ignore
    const value = this.model[prop];

    this._stashed.delete(prop);

    // @ts-ignore
    this.model[prop] = value;
  };

  private _byPassUpdate = (fn: () => void) => {
    this._byPassProxy = true;
    fn();
    this._byPassProxy = false;
  };

  private _getPropsProxy = (name: string, value: unknown) => {
    return createYProxy(value, {
      onChange: () => {
        this.options.onChange?.(this, name, value);
      },
    });
  };

  private _parseYBlock() {
    let id: string | undefined;
    let flavour: string | undefined;
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
    });

    assertExists(id, 'Block id is not found');
    assertExists(flavour, 'Block flavour is not found');
    assertExists(yChildren, 'Block children is not found');

    const schema = this.schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Cannot find schema for flavour ${flavour}`);
    const defaultProps = schema.model.props?.(internalPrimitives);

    // Set default props if not exists
    if (defaultProps) {
      Object.entries(defaultProps).forEach(([key, value]) => {
        if (props[key] !== undefined) return;

        const yValue = native2Y(value);
        this.yBlock.set(`prop:${key}`, yValue);
        props[key] = this._getPropsProxy(key, yValue);
      });
    }

    return {
      id,
      flavour,
      props,
      yChildren,
    };
  }

  private _createModel(props: UnRecord) {
    const schema = this.schema.flavourSchemaMap.get(this.flavour);
    assertExists(schema, `Cannot find schema for flavour ${this.flavour}`);

    const model = schema.model.toModel?.() ?? new BlockModel<object>();
    Object.assign(model, props);

    model.id = this.id;
    model.keys = Object.keys(props);
    model.flavour = schema.model.flavour;
    model.role = schema.model.role;
    model.yBlock = this.yBlock;
    model.stash = this.stash;
    model.pop = this.pop;

    return new Proxy(model, {
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
            const result = Reflect.set(target, p, value, receiver);
            this.options.onChange?.(this, p, value);
            return result;
          }

          const yValue = native2Y(value);
          this.yBlock.set(`prop:${p}`, yValue);
          const proxy = this._getPropsProxy(p, yValue);
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
        }

        return Reflect.deleteProperty(target, p);
      },
    });
  }
}
