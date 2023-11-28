import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { UnRecord } from '../../reactive/index.js';
import { BaseBlockModel, internalPrimitives } from '../../schema/base.js';
import type { Schema } from '../../schema/index.js';
import { propsToValue, valueToProps } from './utils.js';

export type YBlock = Y.Map<unknown>;

export type BlockOptions = Partial<{
  onChange: (block: Block, key: string, value: unknown) => void;
  onYBlockUpdated: (block: Block) => void;
}>;

export class Block {
  readonly model: BaseBlockModel;
  readonly id: string;
  readonly flavour: string;
  readonly yChildren: Y.Array<string[]>;
  private _byPassProxy: boolean = false;

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

    this.yBlock.observeDeep(() => {
      this.options.onYBlockUpdated?.(this);
    });
  }

  private _byPassUpdate = (fn: () => void) => {
    this._byPassProxy = true;
    fn();
    this._byPassProxy = false;
  };

  private _getPropsProxy = (name: string, value: unknown) => {
    return valueToProps(value, {
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
        const proxy = this._getPropsProxy(keyName, value);
        props[keyName] = proxy;
      }

      if (key === 'sys:id' && typeof value === 'string') {
        id = value;
      }
      if (key === 'sys:flavour' && typeof value === 'string') {
        flavour = value;
      }
      if (key === 'sys:children' && value instanceof Y.Array) {
        yChildren = value;
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

        const yValue = propsToValue(value);
        this.yBlock.set(`prop:${key}`, yValue);
        const proxy = this._getPropsProxy(key, yValue);
        props[key] = proxy;
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

    const model = schema.model.toModel?.() ?? new BaseBlockModel<object>();
    Object.assign(model, props);

    model.id = this.id;
    model.keys = Object.keys(props);
    model.flavour = schema.model.flavour;
    model.role = schema.model.role;
    model.yBlock = this.yBlock;

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
          const yValue = propsToValue(value);
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
          this.model.propsUpdated.emit({ key: p });
        }

        return Reflect.deleteProperty(target, p);
      },
    });
  }
}
