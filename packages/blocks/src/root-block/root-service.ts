import type { RootBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import {
  type PeekViewService,
  getSelectedPeekableBlocksCommand,
  peekSelectedBlockCommand,
} from '@blocksuite/affine-components/peek';
import {
  type EmbedCardStyle,
  type NoteBlockModel,
  NoteDisplayMode,
} from '@blocksuite/affine-model';
import { registerCommands } from '@blocksuite/affine-shared/commands';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { BlockService } from '@blocksuite/block-std';
import { Bound, Vec } from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';

import type { EdgelessRootBlockComponent } from './edgeless/edgeless-root-block.js';
import type { RootBlockComponent } from './types.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import {
  type DocModeService,
  type NotificationService,
  createDocModeService,
} from '../_common/components/index.js';
import {
  DEFAULT_IMAGE_PROXY_ENDPOINT,
  EMBED_CARD_HEIGHT,
  EMBED_CARD_WIDTH,
} from '../_common/consts.js';
import { ExportManager } from '../_common/export-manager/export-manager.js';
import {
  HtmlTransformer,
  MarkdownTransformer,
  ZipTransformer,
} from '../_common/transformers/index.js';
import { getRootByEditorHost } from '../_common/utils/index.js';
import { asyncFocusRichText } from '../_common/utils/selection.js';
import { CommunityCanvasTextFonts } from '../surface-block/consts.js';
import { EditPropsStore } from '../surface-block/managers/edit-session.js';
import { FontLoader } from './font-loader/font-loader.js';

export type EmbedOptions = {
  flavour: string;
  urlRegex: RegExp;
  styles: EmbedCardStyle[];
  viewType: 'card' | 'embed';
};

export type QuickSearchResult =
  | { docId: string; isNewDoc?: boolean }
  | { userInput: string }
  | null;

export interface QuickSearchService {
  searchDoc: (options: {
    action?: 'insert';
    userInput?: string;
    skipSelection?: boolean;
    trigger?: 'edgeless-toolbar' | 'slash-command' | 'shortcut';
  }) => Promise<QuickSearchResult>;
}

export interface TelemetryEvent {
  page?: string;
  segment?: string;
  module?: string;
  control?: string;
  type?: string;
  category?: string;
  other?: unknown;
}

interface DocCreatedEvent extends TelemetryEvent {
  page?: 'doc editor' | 'whiteboard editor';
  segment?: 'whiteboard' | 'note' | 'doc';
  module?:
    | 'slash commands'
    | 'format toolbar'
    | 'edgeless toolbar'
    | 'inline @';
  category?: 'page' | 'whiteboard';
}

export interface TelemetryEventMap {
  DocCreated: DocCreatedEvent;
  LinkedDocCreated: TelemetryEvent;
  SplitNote: TelemetryEvent;
}

export interface TelemetryService {
  track<T extends keyof TelemetryEventMap>(
    eventName: T,
    props: TelemetryEventMap[T]
  ): void;
}

export class RootService extends BlockService<RootBlockModel> {
  private _embedBlockRegistry = new Set<EmbedOptions>();

  private _exportOptions = {
    imageProxyEndpoint: DEFAULT_IMAGE_PROXY_ENDPOINT,
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

  private _getParentModelBySelection = (): {
    index: number | undefined;
    model: BlockModel | null;
  } => {
    const currentMode = this.docModeService.getMode();
    const root = this.doc.root;
    if (!root)
      return {
        index: undefined,
        model: null,
      };

    if (currentMode === 'edgeless') {
      const surface =
        root.children.find(child => child.flavour === 'affine:surface') ?? null;
      return { index: undefined, model: surface };
    }

    if (currentMode === 'page') {
      let selectedBlock: BlockModel | null = this.selectedBlocks[0]?.model;
      let index: undefined | number = undefined;

      if (!selectedBlock) {
        // if no block is selected, append to the last note block
        selectedBlock = this._getLastNoteBlock();
      }

      while (selectedBlock && selectedBlock.flavour !== 'affine:note') {
        // selectedBlock = this.doc.getParent(selectedBlock.id);
        const parent = this.doc.getParent(selectedBlock.id);
        index = parent?.children.indexOf(selectedBlock);
        selectedBlock = parent;
      }

      return { index, model: selectedBlock };
    }

    return {
      index: undefined,
      model: null,
    };
  };

  private _insertCard = (
    flavour: string,
    targetStyle: EmbedCardStyle,
    props: Record<string, unknown>
  ) => {
    const host = this.host;

    const mode = this.docModeService.getMode();
    const { model, index } = this._getParentModelBySelection();

    if (mode === 'page') {
      host.doc.addBlock(flavour as never, props, model, index);
      return;
    }
    if (mode === 'edgeless') {
      const edgelessRoot = getRootByEditorHost(
        host
      ) as EdgelessRootBlockComponent | null;
      if (!edgelessRoot) return;

      edgelessRoot.service.viewport.smoothZoom(1);
      const surface = edgelessRoot.surface;
      const center = Vec.toVec(surface.renderer.viewport.center);
      const cardId = edgelessRoot.service.addBlock(
        flavour,
        {
          ...props,
          xywh: Bound.fromCenter(
            center,
            EMBED_CARD_WIDTH[targetStyle],
            EMBED_CARD_HEIGHT[targetStyle]
          ).serialize(),
          style: targetStyle,
        },
        surface.model
      );

      edgelessRoot.service.selection.set({
        elements: [cardId],
        editing: false,
      });

      edgelessRoot.tools.setEdgelessTool({
        type: 'default',
      });
      return;
    }
  };

  private _insertDoc = (docId: string) => {
    const flavour = 'affine:embed-linked-doc';
    const targetStyle: EmbedCardStyle = 'vertical';
    const props: Record<string, unknown> = { pageId: docId };

    this._insertCard(flavour, targetStyle, props);
    return flavour;
  };

  private _insertLink = (url: string) => {
    const embedOptions = this.getEmbedBlockOptions(url);

    let flavour = 'affine:bookmark';
    let targetStyle: EmbedCardStyle = 'vertical';
    const props: Record<string, unknown> = { url };
    if (embedOptions) {
      flavour = embedOptions.flavour;
      targetStyle = embedOptions.styles[0];
    }

    this._insertCard(flavour, targetStyle, props);
    return flavour;
  };

  appendParagraph = (text: string = '') => {
    const { doc } = this;
    if (!doc.root) return;
    if (doc.readonly) return;
    let noteId = this._getLastNoteBlock()?.id;
    if (!noteId) {
      noteId = doc.addBlock('affine:note', {}, doc.root.id);
    }
    const id = doc.addBlock(
      'affine:paragraph',
      { text: new doc.Text(text) },
      noteId
    );

    asyncFocusRichText(this.host, id, text.length)?.catch(console.error);
  };

  docModeService: DocModeService = createDocModeService(this.doc.id);

  readonly editPropsStore: EditPropsStore = new EditPropsStore(this);

  readonly exportManager = new ExportManager(this, this._exportOptions);

  readonly fileDropManager = new FileDropManager(this, this._fileDropOptions);

  readonly fontLoader = new FontLoader();

  getEmbedBlockOptions = (url: string): EmbedOptions | null => {
    const entries = this._embedBlockRegistry.entries();
    for (const [options] of entries) {
      const regex = options.urlRegex;
      if (regex.test(url)) return options;
    }
    return null;
  };

  insertLinkByQuickSearch = async (
    userInput?: string,
    skipSelection?: boolean
  ): Promise<
    | {
        flavour: string;
        isNewDoc?: boolean;
      }
    | undefined
  > => {
    if (!this.quickSearchService) return;

    const result = await this.quickSearchService.searchDoc({
      action: 'insert',
      userInput,
      skipSelection,
    });
    if (!result) return;

    // add linked doc
    if ('docId' in result) {
      this._insertDoc(result.docId);
      return { flavour: 'affine:embed-linked-doc', isNewDoc: result.isNewDoc };
    }

    // add normal link;
    if ('userInput' in result) {
      this._insertLink(result.userInput);
      return {
        flavour: 'affine:bookmark',
      };
    }

    return;
  };

  // implements provided by affine
  notificationService: NotificationService | null = null;

  peekViewService: PeekViewService | null = null;

  quickSearchService: QuickSearchService | null = null;

  registerEmbedBlockOptions = (options: EmbedOptions): void => {
    this._embedBlockRegistry.add(options);
  };

  telemetryService: TelemetryService | null = null;

  readonly themeObserver = ThemeObserver.instance;

  transformers = {
    markdown: MarkdownTransformer,
    html: HtmlTransformer,
    zip: ZipTransformer,
  };

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

  loadFonts() {
    this.fontLoader.load(CommunityCanvasTextFonts);
  }

  override mounted() {
    super.mounted();

    registerCommands(this.std);
    this.std.command
      .add('peekSelectedBlock', peekSelectedBlockCommand)
      .add('getSelectedPeekableBlocks', getSelectedPeekableBlocksCommand);

    this.loadFonts();

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

  override unmounted() {
    this.editPropsStore.dispose();
    this.fontLoader.clear();
  }

  get selectedBlocks() {
    let result: BlockComponent[] = [];
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

  get viewportElement() {
    const rootComponent = this.std.view.viewFromPath('block', [
      this.std.doc.root?.id ?? '',
    ]) as RootBlockComponent | null;
    assertExists(rootComponent);
    const viewportElement = rootComponent.viewportElement as HTMLElement | null;
    assertExists(viewportElement);
    return viewportElement;
  }
}
