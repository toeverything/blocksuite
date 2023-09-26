import '../components/note-slicer/index.js';

import { WithDisposable } from '@blocksuite/lit';
import type { TemplateResult } from 'lit';
import { html, LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  EDGELESS_BLOCK_CHILD_BORDER_WIDTH,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../__internal__/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../../note-block/note-model.js';
import { deserializeXYWH } from '../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../surface-block/surface-block.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';

@customElement('edgeless-note-mask')
export class EdgelessNoteMask extends WithDisposable(LitElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  model!: NoteBlockModel;

  protected override createRenderRoot() {
    return this;
  }

  get edgeless() {
    return this.surface.edgeless;
  }

  protected override firstUpdated() {
    this._disposables.add(
      this.edgeless.selectionManager.slots.updated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override render() {
    if (
      this.edgeless.selectionManager.state.editing &&
      this.edgeless.selectionManager.state.elements.includes(this.model.id)
    ) {
      return nothing;
    }

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

@customElement('edgeless-note')
export class EdgelessNote extends WithDisposable(LitElement) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: NoteBlockModel;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  protected override createRenderRoot() {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._disposables.add(
      this.model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );

    this._disposables.add(
      this.surface.page.slots.yBlockUpdated.on(e => {
        if (e.id === this.model.id) {
          this.requestUpdate();
        }
      })
    );
  }

  override render() {
    const { model, surface, index } = this;
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
        ${surface.edgeless.renderModel(model)}
        <edgeless-note-mask
          .surface=${surface}
          .model=${this.model}
        ></edgeless-note-mask>
      </div>
    `;
  }
}

@customElement('edgeless-notes-container')
export class EdgelessNotesContainer extends WithDisposable(LitElement) {
  @property({ attribute: false })
  notes!: NoteBlockModel[];

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  renderer!: (model: NoteBlockModel) => TemplateResult;

  protected override createRenderRoot() {
    return this;
  }

  protected override firstUpdated() {
    this.style.position = 'absolute';
    this.style.zIndex = '1';
  }

  override render() {
    const { renderer, edgeless } = this;
    const readonly = edgeless.page.readonly;
    const noteSlicer = readonly
      ? nothing
      : html`<affine-note-slicer
          .edgelessPage=${edgeless}
        ></affine-note-slicer>`;
    const notes = repeat(
      this.notes,
      child => child.id,
      (child, index) =>
        html`<edgeless-child-note
          .index=${index}
          .model=${child}
          .renderer=${renderer}
          .edgeless=${this.edgeless}
        ></edgeless-child-note>`
    );

    return html`${noteSlicer}${notes}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-notes-container': EdgelessNotesContainer;
    'edgeless-note': EdgelessNote;
    'edgeless-note-mask': EdgelessNoteMask;
  }
}
