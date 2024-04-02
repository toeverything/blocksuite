import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import { native2Y } from '../../reactive/index.js';
import type { BlockModel, Schema } from '../../schema/index.js';
import { internalPrimitives } from '../../schema/index.js';
import type { Doc } from '../doc.js';
import type { BlockOptions } from './block.js';
import { Block } from './block.js';

export type BlockSelector = (block: Block) => boolean;

type BlockTreeOptions = {
  schema: Schema;
  doc: Doc;
};

export class BlockTree {
  protected readonly _schema: Schema;
  protected readonly _blocks: Map<string, Block> = new Map();
  protected readonly _doc: Doc;
  protected _selector?: BlockSelector;

  get _root() {
    const rootBlock = Array.from(this._blocks.values()).find(block => {
      return block.model.role === 'root';
    });
    if (!rootBlock) {
      return null;
    }

    return rootBlock;
  }

  hasBlock(id: string) {
    return this._blocks.has(id);
  }

  /**
   * @deprecated
   * Use `hasBlock` instead.
   */
  hasBlockById(id: string) {
    return this.hasBlock(id);
  }

  getBlock(id: string) {
    return this._blocks.get(id);
  }

  /**
   * @deprecated
   * Use `getBlock` instead.
   */
  getBlockById(id: string) {
    return this.getBlock(id)?.model ?? null;
  }

  /**
   * @deprecated
   * Use `getBlocksByFlavour` instead.
   */
  getBlockByFlavour(blockFlavour: string | string[]) {
    return this.getBlocksByFlavour(blockFlavour).map(x => x.model);
  }

  getBlocksByFlavour(blockFlavour: string | string[]) {
    const flavours =
      typeof blockFlavour === 'string' ? [blockFlavour] : blockFlavour;

    return Array.from(this._blocks.values()).filter(({ flavour }) =>
      flavours.includes(flavour)
    );
  }

  getParent(target: BlockModel | string): BlockModel | null {
    const root = this._root;
    const targetId = typeof target === 'string' ? target : target.id;
    if (!root || root.id === targetId) return null;

    const findParent = (parentId: string): BlockModel | null => {
      const parentBlock = this.getBlock(parentId);
      if (!parentBlock) return null;

      for (const [childId] of parentBlock.model.childMap) {
        if (childId === targetId) return parentBlock.model;

        const parent = findParent(childId);
        if (parent !== null) return parent;
      }

      return null;
    };

    return findParent(root.id);
  }

  getPrev(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index - 1] ?? null
    );
  }

  getPrevs(block: BlockModel | string) {
    return this._getSiblings(block, (parent, index) =>
      parent.children.slice(0, index)
    );
  }

  getNext(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index + 1] ?? null
    );
  }

  getNexts(block: BlockModel | string) {
    return this._getSiblings(block, (parent, index) =>
      parent.children.slice(index + 1)
    );
  }

  getBlocks() {
    return Array.from(this._blocks.values());
  }

  get blocks() {
    return this._blocks;
  }

  private get _yBlocks() {
    return this._doc.yBlocks;
  }

  private _getSiblings<T>(
    block: BlockModel | string,
    fn: (parent: BlockModel, index: number) => T
  ) {
    const parent = this.getParent(block);
    if (!parent) return null;

    const blockModel =
      typeof block === 'string' ? this.getBlock(block)?.model : block;
    if (!blockModel) return null;

    const index = parent.children.indexOf(blockModel);
    if (index === -1) return null;

    return fn(parent, index);
  }

  constructor({ schema, doc }: BlockTreeOptions) {
    this._doc = doc;
    this._schema = schema;
  }

  updateSelector(selector?: BlockSelector) {
    this._selector = selector;
    this._blocks.forEach(block => {
      const shouldAdd = selector?.(block) ?? true;
      if (!shouldAdd) {
        this.onBlockRemoved(block.id);
      }
    });

    this._yBlocks.forEach((_, id) => {
      if (!this._blocks.has(id)) {
        this.onBlockAdded(id);
      }
    });

    this._doc.slots.selectorUpdated.emit(selector);
  }

  onBlockAdded(id: string) {
    if (this._blocks.has(id)) {
      return;
    }
    const yBlock = this._yBlocks.get(id);
    if (!yBlock) {
      console.warn(`Could not find block with id ${id}`);
      return;
    }

    const options: BlockOptions = {
      onChange: (block, key) => {
        if (key) {
          block.model.propsUpdated.emit({ key });
        }

        this._doc.slots.blockUpdated.emit({
          type: 'update',
          id,
          flavour: block.flavour,
          props: { key },
        });
      },
    };
    const block = new Block(this._schema, yBlock, this._doc, options);

    const shouldAdd = this._selector ? this._selector(block) : true;

    if (!shouldAdd) {
      return;
    }

    this._blocks.set(id, block);
    block.model.created.emit();
  }

  onBlockRemoved(id: string) {
    if (!this._blocks.has(id)) {
      return;
    }

    const block = this._blocks.get(id)!;
    block.model.dispose();
    this._blocks.delete(id);
    block.model.deleted.emit();
  }

  addBlock(id: string, flavour: string, initialProps: Record<string, unknown>) {
    const schema = this._schema.flavourSchemaMap.get(flavour);
    assertExists(schema, `Could not find schema for flavour ${flavour}`);

    const yBlock = new Y.Map();
    this._yBlocks.set(id, yBlock);

    const version = schema.version;
    yBlock.set('sys:id', id);
    yBlock.set('sys:flavour', flavour);
    yBlock.set('sys:version', version);

    const defaultProps = schema.model.props?.(internalPrimitives) ?? {};
    const props = {
      ...defaultProps,
      ...initialProps,
    };

    const yChildren = Y.Array.from(
      (props.children ?? []).map((child: BlockModel) => child.id)
    );
    yBlock.set('sys:children', yChildren);

    delete props.children;
    delete props.id;
    delete props.flavour;

    Object.entries(props).forEach(([key, value]) => {
      if (value === undefined) return;

      yBlock.set(`prop:${key}`, native2Y(value));
    });

    return yBlock;
  }

  removeBlock(id: string) {
    this._yBlocks.delete(id);
  }
}
