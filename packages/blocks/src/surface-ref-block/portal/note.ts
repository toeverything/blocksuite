import type { EditorHost } from '@blocksuite/block-std';
import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { type BlockModel } from '@blocksuite/store';
import { css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../_common/consts.js';
import { DEFAULT_NOTE_COLOR } from '../../_common/edgeless/note/consts.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { type NoteBlockModel } from '../../note-block/index.js';
import { SpecProvider } from '../../specs/utils/spec-provider.js';
import { deserializeXYWH } from '../../surface-block/index.js';

@customElement('surface-ref-note-portal')
export class SurfaceRefNotePortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    surface-ref-note-portal {
      position: relative;
    }
  `;

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor model!: NoteBlockModel;

  @property({ attribute: false })
  accessor host!: EditorHost;

  ancestors: Set<string> = new Set();

  renderPreview() {
    const doc = this.model.doc.blockCollection.getDoc();
    const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
    return this.host.renderSpecPortal(doc, previewSpec.value.slice());
  }

  override connectedCallback() {
    super.connectedCallback();

    let parent: BlockModel | null = this.model;
    while (parent) {
      this.ancestors.add(parent.id);
      parent = this.model.doc.getParent(parent.id);
    }
  }

  override firstUpdated() {
    this.disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
  }

  override updated() {
    setTimeout(() => {
      const editableElements = Array.from<HTMLDivElement>(
        this.querySelectorAll('[contenteditable]')
      );
      const blockElements = Array.from(
        this.querySelectorAll(`[data-block-id]`)
      );

      editableElements.forEach(element => {
        if (element.contentEditable === 'true')
          element.contentEditable = 'false';
      });

      blockElements.forEach(element => {
        element.setAttribute(RangeManager.rangeQueryExcludeAttr, 'true');
      });
    }, 500);
  }

  override render() {
    const { model, index } = this;
    const { displayMode, edgeless } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const style = {
      zIndex: `${index}`,
      width: modelW + 'px',
      height:
        edgeless.collapse && edgeless.collapsedHeight
          ? edgeless.collapsedHeight + 'px'
          : undefined,
      transform: `translate(${modelX}px, ${modelY}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px ${'solid'} var(--affine-black-10)`,
      background: `var(${background ?? DEFAULT_NOTE_COLOR})`,
      boxShadow: 'var(--affine-shadow-3)',
      position: 'absolute',
      borderRadius: '8px',
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
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-note-portal': SurfaceRefNotePortal;
  }
}
