import type { EmbedFigmaBlockService } from './embed-figma-block/embed-figma-service.js';
import type { insertEmbedLinkedDocCommand } from './embed-linked-doc-block/commands/insert-embed-linked-doc.js';
import type {
  InsertedLinkType,
  insertLinkByQuickSearchCommand,
} from './embed-linked-doc-block/commands/insert-link-by-quick-search.js';
import type { EmbedLinkedDocBlockConfig } from './embed-linked-doc-block/embed-linked-doc-config.js';

import { EmbedEdgelessBlockComponent } from './embed-figma-block/embed-edgeless-figma-block.js';
import { EmbedFigmaBlockComponent } from './embed-figma-block/index.js';
import { EmbedEdgelessGithubBlockComponent } from './embed-github-block/embed-edgeless-github-block.js';
import {
  EmbedGithubBlockComponent,
  type EmbedGithubBlockService,
} from './embed-github-block/index.js';
import { EmbedHtmlFullscreenToolbar } from './embed-html-block/components/fullscreen-toolbar.js';
import { EmbedEdgelessHtmlBlockComponent } from './embed-html-block/embed-edgeless-html-block.js';
import { EmbedHtmlBlockComponent } from './embed-html-block/index.js';
import { EmbedEdgelessLinkedDocBlockComponent } from './embed-linked-doc-block/embed-edgeless-linked-doc-block.js';
import { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block/index.js';
import { EmbedEdgelessLoomBlockComponent } from './embed-loom-block/embed-edgeless-loom-bock.js';
import {
  EmbedLoomBlockComponent,
  type EmbedLoomBlockService,
} from './embed-loom-block/index.js';
import { EmbedSyncedDocCard } from './embed-synced-doc-block/components/embed-synced-doc-card.js';
import { EmbedEdgelessSyncedDocBlockComponent } from './embed-synced-doc-block/embed-edgeless-synced-doc-block.js';
import { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block/index.js';
import { EmbedEdgelessYoutubeBlockComponent } from './embed-youtube-block/embed-edgeless-youtube-block.js';
import {
  EmbedYoutubeBlockComponent,
  type EmbedYoutubeBlockService,
} from './embed-youtube-block/index.js';

export function effects() {
  customElements.define(
    'affine-embed-edgeless-figma-block',
    EmbedEdgelessBlockComponent
  );
  customElements.define('affine-embed-figma-block', EmbedFigmaBlockComponent);

  customElements.define('affine-embed-html-block', EmbedHtmlBlockComponent);
  customElements.define(
    'affine-embed-edgeless-html-block',
    EmbedEdgelessHtmlBlockComponent
  );

  customElements.define(
    'embed-html-fullscreen-toolbar',
    EmbedHtmlFullscreenToolbar
  );
  customElements.define(
    'affine-embed-edgeless-github-block',
    EmbedEdgelessGithubBlockComponent
  );
  customElements.define('affine-embed-github-block', EmbedGithubBlockComponent);

  customElements.define(
    'affine-embed-edgeless-youtube-block',
    EmbedEdgelessYoutubeBlockComponent
  );
  customElements.define(
    'affine-embed-youtube-block',
    EmbedYoutubeBlockComponent
  );

  customElements.define(
    'affine-embed-edgeless-loom-block',
    EmbedEdgelessLoomBlockComponent
  );
  customElements.define('affine-embed-loom-block', EmbedLoomBlockComponent);

  customElements.define('affine-embed-synced-doc-card', EmbedSyncedDocCard);

  customElements.define(
    'affine-embed-edgeless-linked-doc-block',
    EmbedEdgelessLinkedDocBlockComponent
  );
  customElements.define(
    'affine-embed-linked-doc-block',
    EmbedLinkedDocBlockComponent
  );

  customElements.define(
    'affine-embed-edgeless-synced-doc-block',
    EmbedEdgelessSyncedDocBlockComponent
  );
  customElements.define(
    'affine-embed-synced-doc-block',
    EmbedSyncedDocBlockComponent
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-embed-figma-block': EmbedFigmaBlockComponent;
    'affine-embed-edgeless-figma-block': EmbedEdgelessBlockComponent;
    'affine-embed-github-block': EmbedGithubBlockComponent;
    'affine-embed-edgeless-github-block': EmbedEdgelessGithubBlockComponent;
    'affine-embed-html-block': EmbedHtmlBlockComponent;
    'affine-embed-edgeless-html-block': EmbedEdgelessHtmlBlockComponent;
    'embed-html-fullscreen-toolbar': EmbedHtmlFullscreenToolbar;
    'affine-embed-edgeless-loom-block': EmbedEdgelessLoomBlockComponent;
    'affine-embed-loom-block': EmbedLoomBlockComponent;
    'affine-embed-youtube-block': EmbedYoutubeBlockComponent;
    'affine-embed-edgeless-youtube-block': EmbedEdgelessYoutubeBlockComponent;
    'affine-embed-synced-doc-card': EmbedSyncedDocCard;
    'affine-embed-synced-doc-block': EmbedSyncedDocBlockComponent;
    'affine-embed-edgeless-synced-doc-block': EmbedEdgelessSyncedDocBlockComponent;
    'affine-embed-linked-doc-block': EmbedLinkedDocBlockComponent;
    'affine-embed-edgeless-linked-doc-block': EmbedEdgelessLinkedDocBlockComponent;
  }

  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-figma': EmbedFigmaBlockService;
      'affine:embed-github': EmbedGithubBlockService;
      'affine:embed-loom': EmbedLoomBlockService;
      'affine:embed-youtube': EmbedYoutubeBlockService;
    }
    interface BlockConfigs {
      'affine:embed-linked-doc': EmbedLinkedDocBlockConfig;
    }
    interface CommandContext {
      insertedLinkType?: Promise<InsertedLinkType>;
    }
    interface Commands {
      insertEmbedLinkedDoc: typeof insertEmbedLinkedDocCommand;
      insertLinkByQuickSearch: typeof insertLinkByQuickSearchCommand;
    }
  }
}
