import type { PeekViewService } from '@blocksuite/affine-components/peek';
import type { RefNodeSlots } from '@blocksuite/affine-components/rich-text';
import type { RootBlockModel } from '@blocksuite/affine-model';
import type { EmbedCardStyle } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import { BlockService } from '@blocksuite/block-std';

import type { NotificationService } from '../_common/components/index.js';
import type { RootBlockComponent } from './types.js';

import {
  FileDropManager,
  type FileDropOptions,
} from '../_common/components/file-drop-manager.js';
import { DEFAULT_IMAGE_PROXY_ENDPOINT } from '../_common/consts.js';
import { ExportManager } from '../_common/export-manager/export-manager.js';
import {
  HtmlTransformer,
  MarkdownTransformer,
  ZipTransformer,
} from '../_common/transformers/index.js';
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

export abstract class RootService extends BlockService<RootBlockModel> {
  private _embedBlockRegistry = new Set<EmbedOptions>();

  private _exportOptions = {
    imageProxyEndpoint: DEFAULT_IMAGE_PROXY_ENDPOINT,
  };

  private _fileDropOptions: FileDropOptions = {
    flavour: this.flavour,
  };

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

  loadFonts() {
    this.fontLoader.load(CommunityCanvasTextFonts);
  }

  override mounted() {
    super.mounted();

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
    if (!rootComponent) return null;
    const viewportElement = rootComponent.viewportElement;
    return viewportElement;
  }

  abstract slots: RefNodeSlots;
}

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:page': RootService;
    }
  }
}
