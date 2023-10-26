/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { css, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html } from 'lit/static-html.js';

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
export class SurfaceRefNotePortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .edgeless-block-portal-note {
      position: absolute;
      border-radius: 8px;
      box-sizing: border-box;
      pointer-events: all;
      overflow: hidden;
      transform-origin: 0 0;
      user-select: none;
    }
  `;

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  index!: number;

  @property({ attribute: false })
  model!: NoteBlockModel;

  @property({ attribute: false })
  page!: Page;

  override connectedCallback(): void {
    super.connectedCallback();
  }

  private _onLoadModel(model: BaseBlockModel) {
    this._disposables.add(
      model.propsUpdated.on(() => {
        this.requestUpdate();
      })
    );
    this._disposables.add(
      model.childrenUpdated.on(() => {
        this.requestUpdate();
      })
    );
  }

  override firstUpdated() {
    setTimeout(() => {
      const editiableElements = Array.from<HTMLDivElement>(
        this.querySelectorAll('[contenteditable]')
      );

      editiableElements.forEach(element => {
        element.contentEditable = 'false';
      });
    }, 500);
  }

  renderModel = (model: BaseBlockModel): TemplateResult => {
    const { flavour, children } = model;
    const schema = this.page.schema.flavourSchemaMap.get(flavour);
    if (!schema) {
      console.warn(`Cannot find schema for ${flavour}.`);
      return html`${nothing}`;
    }

    const view = this.root.std.spec.getView(flavour);
    if (!view) {
      console.warn(`Cannot find view for ${flavour}.`);
      return html`${nothing}`;
    }

    const tag = view.component;
    const content = children.length
      ? html`${repeat(
          children,
          child => child.id,
          child => this.renderModel(child)
        )}`
      : null;

    this._onLoadModel(model);

    return html`<${tag}
      portal-reference-block-id=${model.id}
      .root=${this.root}
      .page=${this.page}
      .model=${model}
      .content=${content}
    ></${tag}>`;
  };

  override render() {
    const { model, index } = this;
    const { xywh, background } = model;
    const [modelX, modelY, modelW, modelH] = deserializeXYWH(xywh);
    const isHiddenNote = model.hidden;
    const style = {
      zIndex: `${index}`,
      width: modelW + 'px',
      transform: `translate(${modelX}px, ${modelY}px)`,
      padding: `${EDGELESS_BLOCK_CHILD_PADDING}px`,
      border: `${EDGELESS_BLOCK_CHILD_BORDER_WIDTH}px ${
        isHiddenNote ? 'dashed' : 'solid'
      } var(--affine-black-10)`,
      background: isHiddenNote
        ? 'transparent'
        : `var(${background ?? DEFAULT_NOTE_COLOR})`,
      boxShadow: isHiddenNote ? undefined : 'var(--affine-shadow-3)',
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
