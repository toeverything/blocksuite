import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { BaseBlockModel, Schema } from '../../schema/index.js';
import { internalPrimitives } from '../../schema/index.js';
import type { AwarenessStore, BlockSuiteDoc } from '../../yjs/index.js';
import { Space } from '../space.js';
import type { BlockOptions, YBlock } from './block.js';
import { Block } from './block.js';
import { propsToValue } from './utils.js';

type FlatBlockMap = Record<string, YBlock>;
type BlockTreeOptions = {
  id: string;
  doc: BlockSuiteDoc;
  awarenessStore: AwarenessStore;
  schema: Schema;
};

export class BlockTree extends Space<FlatBlockMap> {
  protected readonly _schema: Schema;
  protected _blocks: Map<string, Block> = new Map();

  getBlock(id: string) {
    return this._blocks.get(id);
  }

  constructor({ id, schema, doc, awarenessStore }: BlockTreeOptions) {
    super(id, doc, awarenessStore);
    this._schema = schema;
  }

  protected _onBlockAdded(id: string, options: BlockOptions = {}) {
    if (this._blocks.has(id)) {
      return;
    }
    const yBlock = this._yBlocks.get(id);
    if (!yBlock) {
      console.warn(`Could not find block with id ${id}`);
      return;
    }

    const block = new Block(this._schema, yBlock, options);
    this._blocks.set(id, block);
  }

  protected _onBlockRemoved(id: string) {
    if (!this._blocks.has(id)) {
      return;
    }

    const block = this._blocks.get(id)!;
    block.model.deleted.emit();
    block.model.dispose();
    this._blocks.delete(id);
  }

  protected _addBlock(
    id: string,
    flavour: string,
    initialProps: Record<string, unknown>
  ) {
    const schema = this._schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Could not find schema for flavour ${flavour}`);

    const yBlock = new Y.Map();
    this._yBlocks.set(id, yBlock);

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

  protected _removeBlock(id: string) {
    this._yBlocks.delete(id);
  }
}
