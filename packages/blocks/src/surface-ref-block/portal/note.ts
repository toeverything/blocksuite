import type { EditorHost } from '@blocksuite/block-std';
import type { Block } from '@blocksuite/store';

import {
  RangeManager,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/block-std';
import { deserializeXYWH } from '@blocksuite/global/utils';
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
import type { Renderer } from '../../surface-block/canvas-renderer/renderer.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../_common/consts.js';
import { DEFAULT_NOTE_BACKGROUND_COLOR } from '../../_common/edgeless/note/consts.js';
import { NoteDisplayMode } from '../../_common/types.js';
import { SpecProvider } from '../../specs/utils/spec-provider.js';

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
    const { model, index } = this;
    const { displayMode, edgeless, doc } = model;
    if (!!displayMode && displayMode === NoteDisplayMode.DocOnly)
      return nothing;

    let background = `${DEFAULT_NOTE_BACKGROUND_COLOR}`;
    if (doc.awarenessStore.getFlag('enable_color_picker')) {
      background = this.renderer.getColor(model.background, background);
    } else if (typeof model.background === 'string') {
      background = model.background;
    }

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
      background: background.startsWith('--')
        ? `var(${background})`
        : background,
      boxShadow: 'var(--affine-note-shadow-sticker)',
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
    const doc = this.model.doc.blockCollection.getDoc({
      selector: this.selector,
      readonly: true,
    });
    const previewSpec = SpecProvider.getInstance().getSpec('page:preview');
    return this.host.renderSpecPortal(doc, previewSpec.value.slice());
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

  @property({ attribute: false })
  accessor renderer!: Renderer;
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-note-portal': SurfaceRefNotePortal;
  }
}
