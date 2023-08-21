import { WithDisposable } from '@blocksuite/lit';
import { deserializeXYWH } from '@blocksuite/phasor';
import type { TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../__internal__/consts.js';
import type { TopLevelBlockModel } from '../../../__internal__/utils/types.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../../note-block/note-model.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-note-mask')
export class EdgelessNoteMask extends WithDisposable(LitElement) {
  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  protected override createRenderRoot() {
    return this;
  }

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (this.edgeless.selectionManager.state.editing) return nothing;
    const style = {
      position: 'absolute',
      top: '0',
      left: '0',
      bottom: '0',
      right: '0',
      zIndex: '1',
      pointerEvents: 'auto',
    };
    return html`
      <div class="affine-note-mask" style=${styleMap(style)}></div>
    `;
  }
}

@customElement('edgeless-child-note')
export class EdgelessChildNote extends LitElement {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: NoteBlockModel;

  @property({ attribute: false })
  renderer!: (model: TopLevelBlockModel) => TemplateResult;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;
  protected override createRenderRoot() {
    return this;
  }
  override render() {
    const { model, renderer, index } = this;
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
        class="affine-edgeless-child-note"
        style=${styleMap(style)}
        data-model-height="${modelH}"
      >
        ${renderer(model)}
        <edgeless-note-mask .edgeless=${this.edgeless}></edgeless-note-mask>
      </div>
    `;
  }
}

@customElement('edgeless-notes-container')
export class EdgelessNotesContainer extends WithDisposable(LitElement) {
  @property({ attribute: false })
  notes!: TopLevelBlockModel[];

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  renderer!: (model: TopLevelBlockModel) => TemplateResult;

  protected override createRenderRoot() {
    return this;
  }

  override render() {
    const { notes, renderer } = this;
    return html`
      ${repeat(
        notes,
        child => child.id,
        (child, index) => html`<edgeless-child-note
          .index=${index}
          .model=${child}
          .renderer=${renderer}
          .edgeless=${this.edgeless}
        ></edgeless-child-note>`
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-notes-container': EdgelessNotesContainer;
    'edgeless-child-note': EdgelessChildNote;
    'edgeless-note-mask': EdgelessNoteMask;
  }
}
