import '../../note-slicer/index.js';

import { sleep } from '@blocksuite/global/utils';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  ACTIVE_NOTE_EXTRA_PADDING,
  EDGELESS_BLOCK_CHILD_PADDING,
} from '../../../../../_common/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  type NoteBlockModel,
} from '../../../../../note-block/note-model.js';
import { deserializeXYWH } from '../../../../../surface-block/index.js';
import type { SurfaceBlockComponent } from '../../../../../surface-block/surface-block.js';

@customElement('edgeless-note-mask')
export class EdgelessNoteMask extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @property({ attribute: false })
  model!: NoteBlockModel;

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

@customElement('edgeless-block-portal-note')
export class EdgelessBlockPortalNote extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: NoteBlockModel;

  @property({ attribute: false })
  surface!: SurfaceBlockComponent;

  @state()
  private _editing = false;

  @state()
  private _transition = 'none';

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

  override firstUpdated() {
    const selection = this.surface.edgeless.selectionManager;
    selection.slots.updated.on(async () => {
      if (
        selection.state.editing &&
        selection.state.elements.includes(this.model.id)
      ) {
        this._editing = true;
        this._transition = 'transform 0.4s, padding 0.4s, width 0.4s';
      } else {
        this._editing = false;
        if (this._transition !== 'none') {
          // waiting for animation done
          await sleep(400);
          this._transition = 'none';
        }
      }
    });
  }

  override render() {
    const { model, surface, index } = this;
    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const isHiddenNote = model.hidden;

    const extra = this._editing ? ACTIVE_NOTE_EXTRA_PADDING : 0;
    const width = modelW + extra * 2;
    const translateX = modelX - extra;
    const translateY = modelY - extra;
    const padding = EDGELESS_BLOCK_CHILD_PADDING + extra;

    const border = this._editing
      ? `1px solid var(--affine-blue-600)`
      : isHiddenNote
      ? `2px dashed var(--affine-black-10)`
      : 'none';

    const boxShadow = this._editing
      ? 'var(--affine-active-shadow)'
      : isHiddenNote
      ? 'none'
      : 'var(--affine-note-shadow-box)';

    const style = {
      position: 'absolute',
      zIndex: `${index}`,
      width: `${width}px`,
      transform: `translate(${translateX}px, ${translateY}px)`,
      padding: `${padding}px`,
      border: border,
      borderRadius: '8px',
      boxSizing: 'border-box',
      background: isHiddenNote
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      boxShadow: boxShadow,
      pointerEvents: 'all',
      overflow: 'hidden',
      transformOrigin: '0 0',
      transition: this._transition,
    };

    return html`
      <div
        class="edgeless-block-portal-note"
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

declare global {
  interface HTMLElementTagNameMap {
    'edgeless-block-portal-note': EdgelessBlockPortalNote;
    'edgeless-note-mask': EdgelessNoteMask;
  }
}
