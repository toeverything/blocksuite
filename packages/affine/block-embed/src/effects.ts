import type { EmbedFigmaBlockService } from './embed-figma-block/embed-figma-service.js';

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
import { EmbedEdgelessLoomBlockComponent } from './embed-loom-block/embed-edgeless-loom-bock.js';
import {
  EmbedLoomBlockComponent,
  type EmbedLoomBlockService,
} from './embed-loom-block/index.js';
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
  }

  namespace BlockSuite {
    interface BlockServices {
      'affine:embed-figma': EmbedFigmaBlockService;
      'affine:embed-github': EmbedGithubBlockService;
      'affine:embed-loom': EmbedLoomBlockService;
      'affine:embed-youtube': EmbedYoutubeBlockService;
    }
  }
}
