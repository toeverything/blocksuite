import type { BlockElement, EditorHost } from '@blocksuite/block-std';
import { BlockService } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { DEFAULT_IMAGE_PROXY_ENDPOINT } from '../_common/consts.js';
import { Copilot } from '../_common/copilot/model/index.js';
import { ExportManager } from '../_common/export-manager/export-manager.js';
import {
  HtmlTransformer,
  MarkdownTransformer,
  ZipTransformer,
} from '../_common/transformers/index.js';
import { type EmbedCardStyle, NoteDisplayMode } from '../_common/types.js';
import { matchFlavours } from '../_common/utils/model.js';
import { asyncFocusRichText } from '../_common/utils/selection.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import { CanvasTextFonts } from '../surface-block/consts.js';
import { EditSessionStorage } from '../surface-block/managers/edit-session.js';
import {
  copySelectedModelsCommand,
  deleteSelectedModelsCommand,
  deleteTextCommand,
  formatBlockCommand,
  formatNativeCommand,
  formatTextCommand,
  getBlockIndexCommand,
  getBlockSelectionsCommand,
  getImageSelectionsCommand,
  getNextBlockCommand,
  getPrevBlockCommand,
  getSelectedBlocksCommand,
  getSelectedModelsCommand,
  getTextSelectionCommand,
} from './commands/index.js';
import { FontLoader } from './font-loader/font-loader.js';
import type { RootBlockModel } from './root-model.js';
import type { RootBlockComponent } from './types.js';

export type EmbedOptions = {
  flavour: string;
  urlRegex: RegExp;
  styles: EmbedCardStyle[];
  viewType: 'card' | 'embed';
};

export class RootService extends BlockService<RootBlockModel> {
  readonly fontLoader = new FontLoader();
  readonly editSession: EditSessionStorage = new EditSessionStorage(this);
  public readonly copilot = new Copilot();

  fileDropManager!: FileDropManager;
  exportManager!: ExportManager;

  transformers = {
    markdown: MarkdownTransformer,
    html: HtmlTransformer,
    zip: ZipTransformer,
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

  private _exportOptions = {
    imageProxyEndpoint: DEFAULT_IMAGE_PROXY_ENDPOINT,
  };

  get viewportElement() {
    const rootElement = this.std.view.viewFromPath('block', [
      this.std.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootElement);
    const viewportElement = rootElement.viewportElement as HTMLElement | null;
    assertExists(viewportElement);
    return viewportElement;
  }

  private _getEditorMode: (docId: string) => 'page' | 'edgeless' = docId =>
    docId.endsWith('edgeless') ? 'edgeless' : 'page';

  get getEditorMode() {
    return this._getEditorMode;
  }

  set getEditorMode(value) {
    this._getEditorMode = value;
  }

  private _getDocUpdatedAt: (docId: string) => Date = () => new Date();

  get getDocUpdatedAt() {
    return this._getDocUpdatedAt;
  }

  set getDocUpdatedAt(value) {
    this._getDocUpdatedAt = value;
  }

  private _embedBlockRegistry = new Set<EmbedOptions>();

  registerEmbedBlockOptions = (options: EmbedOptions): void => {
    this._embedBlockRegistry.add(options);
  };

  getEmbedBlockOptions = (url: string): EmbedOptions | null => {
    const entries = this._embedBlockRegistry.entries();
    for (const [options] of entries) {
      const regex = options.urlRegex;
      if (regex.test(url)) return options;
    }
    return null;
  };

  override unmounted() {
    this.editSession.dispose();
  }

  override mounted() {
    super.mounted();

    this.std.command
      .add('getBlockIndex', getBlockIndexCommand)
      .add('getNextBlock', getNextBlockCommand)
      .add('getPrevBlock', getPrevBlockCommand)
      .add('getSelectedBlocks', getSelectedBlocksCommand)
      .add('copySelectedModels', copySelectedModelsCommand)
      .add('deleteSelectedModels', deleteSelectedModelsCommand)
      .add('getSelectedModels', getSelectedModelsCommand)
      .add('getBlockSelections', getBlockSelectionsCommand)
      .add('getImageSelections', getImageSelectionsCommand)
      .add('getTextSelection', getTextSelectionCommand)
      .add('deleteText', deleteTextCommand)
      .add('formatBlock', formatBlockCommand)
      .add('formatNative', formatNativeCommand)
      .add('formatText', formatTextCommand);

    this.loadFonts();

    this.exportManager = new ExportManager(this, this._exportOptions);

    this.fileDropManager = new FileDropManager(this, this._fileDropOptions);
    this.disposables.addFromEvent(
      this.host,
      'dragover',
      this.fileDropManager.onDragOver
    );

    this.disposables.addFromEvent(
      this.host,
      'dragleave',
      this.fileDropManager.onDragLeave
    );

    this.disposables.add(
      this.std.event.add('pointerDown', ctx => {
        const state = ctx.get('pointerState');
        state.raw.stopPropagation();
      })
    );
  }

  get selectedBlocks() {
    let result: BlockElement[] = [];
    this.std.command
      .chain()
      .tryAll(chain => [
        chain.getTextSelection(),
        chain.getImageSelections(),
        chain.getBlockSelections(),
      ])
      .getSelectedBlocks()
      .inline(({ selectedBlocks }) => {
        if (!selectedBlocks) return;
        result = selectedBlocks;
      })
      .run();
    return result;
  }

  get selectedModels() {
    return this.selectedBlocks.map(block => block.model);
  }

  loadFonts() {
    this.fontLoader.load(CanvasTextFonts);
  }

  private _getLastNoteBlock() {
    const { doc } = this;
    let note: NoteBlockModel | null = null;
    if (!doc.root) return null;
    const { children } = doc.root;
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      if (
        matchFlavours(child, ['affine:note']) &&
        child.displayMode !== NoteDisplayMode.EdgelessOnly
      ) {
        note = child as NoteBlockModel;
        break;
      }
    }
    return note;
  }

  appendParagraph = () => {
    const { doc } = this;
    if (!doc.root) return;
    let noteId = this._getLastNoteBlock()?.id;
    if (!noteId) {
      noteId = doc.addBlock('affine:note', {}, doc.root.id);
    }
    const id = doc.addBlock('affine:paragraph', {}, noteId);
    asyncFocusRichText(this.host as EditorHost, id)?.catch(console.error);
  };
}
