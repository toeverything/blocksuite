import type { EditorHost } from '@blocksuite/block-std';
import type { Block } from '@blocksuite/store';

import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import {
  type BlockModel,
  type BlockSelector,
  BlockViewType,
} from '@blocksuite/store';
import { css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

import type { NoteBlockModel } from '../../note-block/index.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../_common/consts.js';
import { DEFAULT_NOTE_BACKGROUND_COLOR } from '../../_common/edgeless/note/consts.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { SpecProvider } from '../../specs/utils/spec-provider.js';
import { deserializeXYWH } from '../../surface-block/index.js';

@customElement('surface-ref-note-portal')
export class SurfaceRefNotePortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    surface-ref-note-portal {
      position: relative;
    }
  `;

  ancestors = new Set<string>();

  selector: BlockSelector = (block, doc) => {
    let currentBlock: Block | BlockModel | null = block;

    if (this.ancestors.has(block.id)) {
      return BlockViewType.Display;
    }

    while (currentBlock) {
      if (currentBlock.id === this.model.id) {
        return BlockViewType.Display;
      }

      currentBlock = doc.getParent(currentBlock.id);
    }

    return BlockViewType.Hidden;
  };

  override connectedCallback() {
    super.connectedCallback();

    let parent: BlockModel | null = this.model;
    while (parent) {
      this.ancestors.add(parent.id);
      parent = this.model.doc.getParent(parent.id);
    }

    const doc = this.model.doc;
    this._disposables.add(() => {
      doc.blockCollection.clearSelector(this.selector, true);
    });
  }

  override firstUpdated() {
    this.disposables.add(
      this.model.propsUpdated.on(() => this.requestUpdate())
    );
  }

  override render() {
    const { index, model } = this;
    const { displayMode, edgeless } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    const { background, xywh } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const style = {
      background: `var(${background ?? DEFAULT_NOTE_BACKGROUND_COLOR})`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px none var(--affine-black-10)`,
      borderRadius: '0px',
      boxShadow: 'var(--affine-note-shadow-sticker)',
      boxSizing: 'border-box',
      height:
        edgeless.collapse && edgeless.collapsedHeight
          ? edgeless.collapsedHeight + 'px'
          : undefined,
      overflow: 'hidden',
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      pointerEvents: 'none',
      position: 'absolute',
      transform: `translate(${modelX}px, ${modelY}px)`,
      transformOrigin: '0 0',
      userSelect: 'none',
      width: modelW + 'px',
      zIndex: `${index}`,
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
    const doc = this.model.doc.blockCollection.getDoc({
      readonly: true,
      selector: this.selector,
    });
    const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
    return this.host.renderSpecPortal(doc, previewSpec.value.slice());
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

  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor index!: number;

  @property({ attribute: false })
  accessor model!: NoteBlockModel;
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-note-portal': SurfaceRefNotePortal;
  }
}
