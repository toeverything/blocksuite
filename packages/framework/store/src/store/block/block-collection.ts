import type { Disposable } from '@blocksuite/global/utils';

import type { BlockModel, Schema } from '../../schema/index.js';
import type { Doc } from '../doc.js';
import type { DocCRUD } from '../doc/crud.js';
import type { BlockOptions } from './block.js';
import { Block } from './block.js';

export type BlockSelector = (block: Block) => boolean;

type BlockCollectionOptions = {
  schema: Schema;
  doc: Doc;
  crud: DocCRUD;
  selector: BlockSelector;
};

export class BlockCollection {
  protected readonly _schema: Schema;
  protected readonly _blocks: Map<string, Block> = new Map();
  protected readonly _doc: Doc;
  protected readonly _crud: DocCRUD;
  protected readonly _selector: BlockSelector;
  protected readonly _disposeBlockUpdated: Disposable;

  constructor({ schema, doc, crud, selector }: BlockCollectionOptions) {
    this._doc = doc;
    this._crud = crud;
    this._schema = schema;
    this._selector = selector;

    this._yBlocks.forEach((_, id) => {
      if (!this._blocks.has(id)) {
        this._onBlockAdded(id);
      }
    });

    this._disposeBlockUpdated = this._doc.slots.blockUpdated.on(
      ({ type, id }) => {
        switch (type) {
          case 'add': {
            this._onBlockAdded(id);
            return;
          }
          case 'delete': {
            this._onBlockRemoved(id);
            return;
          }
        }
      }
    );
  }

  dispose() {
    this._disposeBlockUpdated.dispose();
  }

  get doc() {
    return this._doc;
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
    const targetId = typeof target === 'string' ? target : target.id;
    const parentId = this._crud.getParent(targetId);
    if (!parentId) return null;

    const parent = this._blocks.get(parentId);
    if (!parent) return null;

    return parent.model;
  }

  getPrev(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index - 1] ?? null
    );
  }

  getPrevs(block: BlockModel | string) {
    return (
      this._getSiblings(block, (parent, index) =>
        parent.children.slice(0, index)
      ) ?? []
    );
  }

  getNext(block: BlockModel | string) {
    return this._getSiblings(
      block,
      (parent, index) => parent.children[index + 1] ?? null
    );
  }

  getNexts(block: BlockModel | string) {
    return (
      this._getSiblings(block, (parent, index) =>
        parent.children.slice(index + 1)
      ) ?? []
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

  private _onBlockAdded(id: string) {
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

    const shouldAdd = this._selector(block);

    if (!shouldAdd) return;

    this._blocks.set(id, block);
    block.model.created.emit();
  }

  private _onBlockRemoved(id: string) {
    if (!this._blocks.has(id)) {
      return;
    }

    const block = this._blocks.get(id)!;
    block.model.dispose();
    this._blocks.delete(id);
    block.model.deleted.emit();
  }
}
