import { Store, StoreOptions } from './store';
import type { BlockProps, Space } from './space';
import type { BaseBlockModel } from './base';
import { PrelimText, Text } from './text-adapter';
import type Quill from 'quill';

export class Page {
  private _space: Space;

  constructor(space: Space) {
    this._space = space;
  }

  /** Should only be used for passing page to store entities that require space instances. */
  getUnderlyingSpace() {
    return this._space;
  }

  get signals() {
    return this._space.signals;
  }

  get id() {
    return this._space.id;
  }

  get doc() {
    return this._space.doc;
  }

  get awareness() {
    return this._space.awareness;
  }

  get richTextAdapters() {
    return this._space.richTextAdapters;
  }

  get root() {
    return this._space.root;
  }

  get isEmpty() {
    return this._space.isEmpty;
  }

  get canUndo() {
    return this._space.canUndo;
  }

  get canRedo() {
    return this._space.canRedo;
  }

  get Text() {
    return Text;
  }

  undo() {
    this._space.undo();
  }

  redo() {
    this._space.redo();
  }

  captureSync() {
    this._space.captureSync();
  }

  resetHistory() {
    this._space.resetHistory();
  }

  register(blockSchema: Record<string, typeof BaseBlockModel>) {
    this._space.register(blockSchema);
    return this;
  }

  getBlockById(id: string) {
    return this._space.getBlockById(id);
  }

  getBlockByFlavour(blockFlavour: string) {
    return this._space.getBlockByFlavour(blockFlavour);
  }

  getParentById(rootId: string, target: BaseBlockModel): BaseBlockModel | null {
    return this._space.getParentById(rootId, target);
  }

  getParent(block: BaseBlockModel) {
    return this._space.getParent(block);
  }

  getPreviousSibling(block: BaseBlockModel) {
    return this._space.getPreviousSibling(block);
  }

  getNextSibling(block: BaseBlockModel) {
    return this._space.getNextSibling(block);
  }

  addBlock<T extends BlockProps>(
    blockProps: Partial<T>,
    parent?: BaseBlockModel | string,
    parentIndex?: number
  ): string {
    return this._space.addBlock(blockProps, parent, parentIndex);
  }

  updateBlockById(id: string, props: Partial<BlockProps>) {
    this._space.updateBlockById(id, props);
  }

  updateBlock<T extends Partial<BlockProps>>(model: BaseBlockModel, props: T) {
    this._space.updateBlock(model, props);
  }

  deleteBlockById(id: string) {
    this._space.deleteBlockById(id);
  }

  deleteBlock(model: BaseBlockModel) {
    this._space.deleteBlock(model);
  }

  attachRichText(id: string, quill: Quill) {
    this._space.attachRichText(id, quill);
  }

  detachRichText(id: string) {
    this._space.detachRichText(id);
  }

  markTextSplit(base: Text, left: PrelimText, right: PrelimText) {
    this._space.markTextSplit(base, left, right);
  }
}

export class Workspace {
  private _store: Store;
  pages = new Map<string, Page>();

  get providers() {
    return this._store.providers;
  }

  get doc() {
    return this._store.doc;
  }

  constructor(options: StoreOptions) {
    this._store = new Store(options);
  }

  createPage(pageId: string) {
    const space = this._store.createSpace(pageId);
    const page = new Page(space);
    this.pages.set(pageId, page);
    return page;
  }

  serializeDoc() {
    return this._store.serializeDoc();
  }

  search(query: string) {
    return this._store.search(query);
  }

  toJSXElement(id = '0') {
    return this._store.toJSXElement(id);
  }
}
