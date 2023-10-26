/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import './portal/image.js';
import './portal/note.js';

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { css, nothing, type TemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html as staticHtml, literal, unsafeStatic } from 'lit/static-html.js';

import { compare } from '../index.js';
import type { FrameBlockModel } from '../models.js';
import { getBlocksInFrame } from '../page-block/edgeless/frame-manager.js';
import { EdgelessBlockType } from '../surface-block/edgeless-types.js';

const portalMap = {
  [EdgelessBlockType.NOTE]: 'surface-ref-note-portal',
  [EdgelessBlockType.IMAGE]: 'surface-ref-image-portal',
} as Record<EdgelessBlockType, string>;

@customElement('surface-ref-portal')
export class SurfaceRefPortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .surface-blocks-portal {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
    }
  `;

  @property({ attribute: true })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  frameModel!: FrameBlockModel;

  @query('.surface-blocks-portal')
  portal!: HTMLDivElement;

  private _renderTopLevelBlocks() {
    const topLevelBlocks = getBlocksInFrame(
      this.page,
      this.frameModel as FrameBlockModel,
      false
    );

    topLevelBlocks.sort(compare);

    return repeat(
      topLevelBlocks,
      model => model.id,
      (model, index) => {
        const tag = literal`${unsafeStatic(
          portalMap[model.flavour as EdgelessBlockType]
        )}`;

        return staticHtml`<${tag}
          .index=${index}
          .model=${model}
          .page=${this.page}
          .root=${this.root}
          .renderModel=${this.renderModel}
        ></${tag}>`;
      }
    );
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

  setViewport = (viewport: {
    translateX: number;
    translateY: number;
    zoom: number;
  }) => {
    this.portal?.style.setProperty(
      'transform',
      `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.zoom})`
    );
  };

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
      ? staticHtml`${repeat(
          children,
          child => child.id,
          child => this.renderModel(child)
        )}`
      : null;

    this._onLoadModel(model);

    return staticHtml`<${tag}
      portal-reference-block-id=${model.id}
      .root=${this.root}
      .page=${this.page}
      .model=${model}
      .content=${content}
    ></${tag}>`;
  };

  override render() {
    return html`<div class="surface-blocks-portal">
      ${this._renderTopLevelBlocks()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-portal': SurfaceRefPortal;
  }
}
