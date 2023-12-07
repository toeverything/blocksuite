/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import './portal/image.js';
import './portal/note.js';

import type { BlockSuiteRoot } from '@blocksuite/lit';
import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { css, type TemplateResult } from 'lit';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { html as staticHtml, literal, unsafeStatic } from 'lit/static-html.js';

import type { TopLevelBlockModel } from '../_common/utils/types.js';
import type { FrameBlockModel } from '../models.js';
import { getBlocksInFrame } from '../page-block/edgeless/frame-manager.js';
import { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type { GroupElement } from '../surface-block/elements/group/group-element.js';
import { compare } from '../surface-block/managers/group-manager.js';

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

  @property({ attribute: false })
  root!: BlockSuiteRoot;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  containerModel!: GroupElement | FrameBlockModel;

  @query('.surface-blocks-portal')
  portal!: HTMLDivElement;

  @property({ attribute: false })
  renderModel!: (model: BaseBlockModel) => TemplateResult;

  private _getBlocksInChildren(model: GroupElement): TopLevelBlockModel[] {
    return Array.from(model.children.keys())
      .map(id => this.page.getBlockById(id) as TopLevelBlockModel)
      .filter(el => el);
  }

  private _renderTopLevelBlocks() {
    const containerModel = this.containerModel;
    let topLevelBlocks =
      'flavour' in containerModel
        ? getBlocksInFrame(
            this.page,
            this.containerModel as FrameBlockModel,
            false
          )
        : this._getBlocksInChildren(containerModel);

    topLevelBlocks = topLevelBlocks
      .sort(compare)
      .filter(
        model =>
          (model.flavour as EdgelessBlockType) !== EdgelessBlockType.FRAME
      );

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

  setViewport = (viewport: {
    translateX: number;
    translateY: number;
    zoom: number;
  }) => {
    this.requestUpdate();
    this.updateComplete.then(() => {
      this.portal?.style.setProperty(
        'transform',
        `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.zoom})`
      );
      this.portal?.style.setProperty('transform-origin', '0 0');
    });
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
