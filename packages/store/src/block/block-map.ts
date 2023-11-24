import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { BaseBlockModel, Schema } from '../schema/index.js';
import { internalPrimitives } from '../schema/index.js';
import type { YBlock } from './block.js';
import { Block } from './block.js';
import { propsToValue } from './utils.js';

export interface BlockCurd {
  get(id: string): YBlock | undefined;
  set(id: string, block: YBlock): void;
  delete(id: string): void;
}

export type BlockMapOptions = {
  blockCurd: BlockCurd;
  schema: Schema;
};

export class BlockMap {
  protected readonly _schema: Schema;
  protected readonly _blockCurd: BlockCurd;
  protected _blocks: Map<string, Block> = new Map();

  constructor({ schema, blockCurd }: BlockMapOptions) {
    this._blockCurd = blockCurd;
    this._schema = schema;
  }

  onBlockAdded(id: string) {
    if (this._blocks.has(id)) {
      return;
    }
    const yBlock = this._blockCurd.get(id);
    if (!yBlock) {
      console.warn(`Could not find block with id ${id}`);
      return;
    }

    const block = new Block(this._schema, yBlock);
    this._blocks.set(id, block);
  }

  onBlockRemoved(id: string) {
    if (!this._blocks.has(id)) {
      return;
    }

    const block = this._blocks.get(id)!;
    block.model.deleted.emit();
    block.model.dispose();
    this._blocks.delete(id);
  }

  addBlock(id: string, flavour: string, initialProps: Record<string, unknown>) {
    const schema = this._schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Could not find schema for flavour ${flavour}`);

    const yBlock = new Y.Map();
    this._blockCurd.set(id, yBlock);

    yBlock.set('sys:id', id);
    yBlock.set('sys:flavour', flavour);

    const defaultProps = schema.model.props?.(internalPrimitives) ?? {};
    const props = {
      ...defaultProps,
      ...initialProps,
    };

    const yChildren = Y.Array.from(
      (props.children ?? []).map((child: BaseBlockModel) => child.id)
    );
    yBlock.set('sys:children', yChildren);

    delete props.children;
    delete props.id;
    delete props.flavour;

    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined) return;

      yBlock.set(`prop:${key}`, propsToValue(value));
    });

    return yBlock;
  }

  removeBlock(id: string) {
    this._blockCurd.delete(id);
  }

  getBlock(id: string) {
    return this._blocks.get(id);
  }

  hasBlock(id: string) {
    return this._blocks.has(id);
  }

  getBlocksByFlavour(blockFlavour: string | string[]): Block[] {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return Array.from(this._blocks.values()).filter(({ flavour }) =>
      flavours.includes(flavour)
    );
  }
}
