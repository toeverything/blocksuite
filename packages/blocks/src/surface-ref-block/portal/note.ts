import type { CanvasRenderer } from '@blocksuite/affine-block-surface';
import type { NoteBlockModel } from '@blocksuite/affine-model';

import {
  DEFAULT_NOTE_BACKGROUND_COLOR,
  NoteDisplayMode,
  NoteShadow,
} from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import { SpecProvider } from '@blocksuite/affine-shared/utils';
import {
  BlockStdScope,
  type EditorHost,
  RANGE_QUERY_EXCLUDE_ATTR,
} from '@blocksuite/block-std';
import { ShadowlessElement } from '@blocksuite/block-std';
import { deserializeXYWH, WithDisposable } from '@blocksuite/global/utils';
import { type BlockModel, BlockViewType, type Query } from '@blocksuite/store';
import { css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../_common/consts.js';

export class SurfaceRefNotePortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    surface-ref-note-portal {
      position: relative;
    }
  `;

  ancestors = new Set<string>();

  query: Query | null = null;

  override connectedCallback() {
    super.connectedCallback();

    const ancestors = new Set<string>();
    let parent: BlockModel | null = this.model;
    while (parent) {
      this.ancestors.add(parent.id);
      parent = this.model.doc.getParent(parent.id);
    }
    const query: Query = {
      mode: 'include',
      match: Array.from(ancestors).map(id => ({
        id,
        viewType: BlockViewType.Display,
      })),
    };
    this.query = query;

    const doc = this.model.doc;
    this._disposables.add(() => {
      doc.blockCollection.clearQuery(query, true);
    });
  }

  override firstUpdated() {
    this.disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
  }

  override render() {
    const { model, index } = this;
    const { displayMode, edgeless } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    const backgroundColor = this.host.std
      .get(ThemeProvider)
      .generateColorProperty(model.background, DEFAULT_NOTE_BACKGROUND_COLOR);

    const [modelX, modelY, modelW, modelH] = deserializeXYWH(model.xywh);
    const style = {
      zIndex: `${index}`,
      width: modelW + 'px',
      height:
        edgeless.collapse && edgeless.collapsedHeight
          ? edgeless.collapsedHeight + 'px'
          : undefined,
      transform: `translate(${modelX}px, ${modelY}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px none var(--affine-black-10)`,
      backgroundColor,
      boxShadow: `var(${NoteShadow.Sticker})`,
      position: 'absolute',
      borderRadius: '0px',
      boxSizing: 'border-box',
      pointerEvents: 'none',
      overflow: 'hidden',
      transformOrigin: '0 0',
      userSelect: 'none',
    };

    return html`
      <div
        class="surface-ref-note-portal"
        style=${styleMap(style)}
        data-model-height="${modelH}"
        data-portal-reference-block-id="${model.id}"
      >
        ${this.renderPreview()}
      </div>
    `;
  }

  renderPreview() {
    if (!this.query) {
      console.error('Query is not set before rendering note preview');
      return nothing;
    }
    const doc = this.model.doc.blockCollection.getDoc({
      query: this.query,
      readonly: true,
    });
    const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
    return new BlockStdScope({
      doc,
      extensions: previewSpec.value.slice(),
    }).render();
  }

  override updated() {
    setTimeout(() => {
      const editableElements = Array.from<HTMLDivElement>(
        this.querySelectorAll('[contenteditable]')
      );
      const blocks = Array.from(this.querySelectorAll(`[data-block-id]`));

      editableElements.forEach(element => {
        if (element.contentEditable === 'true')
          element.contentEditable = 'false';
      });

      blocks.forEach(element => {
        element.setAttribute(RANGE_QUERY_EXCLUDE_ATTR, 'true');
      });
    }, 500);
  }

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor model!: NoteBlockModel;

  @property({ attribute: false })
  accessor renderer!: CanvasRenderer;
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-note-portal': SurfaceRefNotePortal;
  }
}
