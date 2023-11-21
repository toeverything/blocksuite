import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { Schema } from '../schema/index.js';
import { BaseBlockModel } from '../schema/index.js';
import { propsToValue, valueToProps } from '../utils/utils.js';
import type { UnRecord } from '../yjs/index.js';
import type { BlockTree } from './block-tree.js';

export type YBlock = Y.Map<unknown>;

export class Block {
  readonly model: BaseBlockModel;
  readonly id: string;
  readonly flavour: string;
  readonly yChildren: Y.Array<string[]>;
  private _byPassProxy: boolean = false;

  constructor(
    readonly tree: BlockTree,
    readonly schema: Schema,
    readonly yBlock: YBlock
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
        if (type.action === 'update') {
          const value = this.yBlock.get(key);
          const keyName = key.replace('prop:', '');
          const proxy = valueToProps(value, this.tree.doc.proxy, {
            onChange: () => {
              this.model.propsUpdated.emit();
            },
          });
          this._byPassProxy = true;
          // @ts-ignore
          this.model[keyName] = proxy;
          this._byPassProxy = false;
          return;
        }
        console.error('Cannot add or delete props');
      });
      this.model.propsUpdated.emit();
    });
  }

  private _parseYBlock() {
    let id: string | undefined;
    let flavour: string | undefined;
    let yChildren: Y.Array<string[]> | undefined;
    const props: Record<string, unknown> = {};

    this.yBlock.forEach((value, key) => {
      if (key.startsWith('prop:')) {
        const keyName = key.replace('prop:', '');
        const proxy = valueToProps(value, this.tree.doc.proxy, {
          onChange: () => {
            this.model.propsUpdated.emit();
          },
        });
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
          this.yBlock.set(`prop:${p}`, propsToValue(value));
        }

        return Reflect.set(target, p, value, receiver);
      },
      get: (target, p, receiver) => {
        return Reflect.get(target, p, receiver);
      },
      deleteProperty: (target, p) => {
        if (typeof p === 'string' && model.keys.includes(p)) {
          throw new Error('Cannot delete props');
        }

        return Reflect.deleteProperty(target, p);
      },
    });
  }
}
