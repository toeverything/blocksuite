import { WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../_common/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../note-block/index.js';
import { deserializeXYWH } from '../../surface-block/index.js';

@customElement('surface-ref-note-portal')
export class SurfaceRefNotePortal extends WithDisposable(LitElement) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: NoteBlockModel;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  renderModel!: (model: NoteBlockModel) => ReturnType<LitElement['render']>;

  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    // this._disposables.add(
    //   this.model.propsUpdated.on(() => {
    //     this.requestUpdate();
    //   })
    // );

    // this._disposables.add(
    //   this.model.childrenUpdated.on(() => {
    //     this.requestUpdate();
    //   })
    // );

    // this._disposables.add(
    //   this.page.slots.yBlockUpdated.on(e => {
    //     if (e.id === this.model.id) {
    //       this.requestUpdate();
    //     }
    //   })
    // );
  }

  override render() {
    const { model, index } = this;
    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const isHiddenNote = model.hidden;
    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: modelW + 'px',
      transform: `translate(${modelX}px, ${modelY}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px ${
        isHiddenNote ? 'dashed' : 'solid'
      } var(--affine-black-10)`,
      borderRadius: '8px',
      boxSizing: 'border-box',
      background: isHiddenNote
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      boxShadow: isHiddenNote ? undefined : 'var(--affine-shadow-3)',
      pointerEvents: 'all',
      overflow: 'hidden',
      transformOrigin: '0 0',
    };

    return html`
      <div
        class="edgeless-block-portal-note"
        style=${styleMap(style)}
        data-model-height="${modelH}"
      >
        ${this.renderModel(model)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-note-portal': SurfaceRefNotePortal;
  }
}
