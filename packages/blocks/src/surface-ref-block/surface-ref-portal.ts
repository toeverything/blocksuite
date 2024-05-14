/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import './portal/note.js';
import './portal/generic-block.js';

import type { EditorHost } from '@blocksuite/block-std';
import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';
import { css, html, type TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { html as staticHtml, literal, unsafeStatic } from 'lit/static-html.js';

import type { FrameBlockModel } from '../frame-block/index.js';
import type { EdgelessBlockModel } from '../root-block/edgeless/type.js';
import { type EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type { GroupElementModel } from '../surface-block/element-model/group.js';
import type { BlockLayer } from '../surface-block/managers/layer-manager.js';

const portalMap = {
  'affine:note': 'surface-ref-note-portal',
} as Record<EdgelessBlockType, string>;

const getPortalTag = (model: BlockModel) => {
  const tag = portalMap[model.flavour as EdgelessBlockType];
  return tag ?? 'surface-ref-generic-block-portal';
};

@customElement('surface-ref-portal')
export class SurfaceRefPortal extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .surface-blocks-portal {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
      transform-origin: 0 0;
    }
    .stacking-canvas {
      position: absolute;
      left: 0;
      top: 0;
    }

    .stacking-canvas > canvas {
      transform: var(--stacking-canvas-transform);
      transform-origin: 0 0;
      position: absolute;
      left: 0;
      top: 0;
    }
  `;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  doc!: Doc;

  @property({ attribute: false })
  refModel!: GroupElementModel | FrameBlockModel;

  @property({ attribute: false })
  renderModel!: (model: BlockModel) => TemplateResult;

  @query('.surface-blocks-portal')
  portal!: HTMLDivElement;

  @query('.stacking-canvas')
  canvasSlot!: HTMLDivElement;

  get surfaceService() {
    return this.host.std.spec.getService('affine:surface');
  }

  setStackingCanvas(canvases: HTMLCanvasElement[]) {
    if (this.canvasSlot) {
      this.canvasSlot.replaceChildren(...canvases);
    }
  }

  private _getBlocksInFrame(model: FrameBlockModel): EdgelessBlockModel[] {
    const bound = model.elementBound;
    const candidates = this.surfaceService.layer.blocksGrid.search(bound);

    return candidates;
  }

  private _getBlocksInGroup(model: GroupElementModel): EdgelessBlockModel[] {
    return Array.from(model.childIds)
      .map(id => this.doc.getBlockById(id) as EdgelessBlockModel)
      .filter(el => el);
  }

  private _renderEdgelessBlocks() {
    const refModel = this.refModel;
    const blocks =
      'flavour' in refModel
        ? this._getBlocksInFrame(refModel)
        : this._getBlocksInGroup(refModel);
    const blockLayers = this.surfaceService.layer.layers.filter(
      layer => layer.type === 'block'
    ) as BlockLayer[];
    let currentLayerIdx = 0;
    let currentIdxOffset = 0;

    return repeat(
      blocks,
      model => model.id,
      (model, index) => {
        const tag = literal`${unsafeStatic(getPortalTag(model))}`;

        let currentLayer = blockLayers[currentLayerIdx];
        if (!blockLayers[currentLayerIdx].set.has(model)) {
          while (!currentLayer.set.has(model)) {
            currentLayer = blockLayers[++currentLayerIdx];
          }

          currentIdxOffset = 0;
        }

        const zIndex = currentLayer.zIndex + currentIdxOffset++;

        return staticHtml`<${tag}
          .index=${index}
          .model=${model}
          .doc=${this.doc}
          .host=${this.host}
          .renderModel=${this.renderModel}
          style=${styleMap({
            'z-index': zIndex,
          })}
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
    this.updateComplete
      .then(() => {
        this.portal?.style.setProperty(
          'transform',
          `translate(${viewport.translateX}px, ${viewport.translateY}px) scale(${viewport.zoom})`
        );
        this.portal?.style.setProperty('transform-origin', '0 0');
        this.canvasSlot?.style.setProperty(
          '--stacking-canvas-transform',
          `scale(${
            1 / viewport.zoom
          }) translate(${-viewport.translateX}px, ${-viewport.translateY}px)`
        );
      })
      .catch(console.error);
  };

  override render() {
    return html`<div class="surface-blocks-portal">
      <div class="stacking-canvas"></div>
      ${this._renderEdgelessBlocks()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-portal': SurfaceRefPortal;
  }
}
