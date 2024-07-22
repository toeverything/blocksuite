/* eslint-disable lit/binding-positions, lit/no-invalid-html */

import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { type TemplateResult, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { literal, html as staticHtml, unsafeStatic } from 'lit/static-html.js';

import type { FrameBlockModel } from '../frame-block/index.js';
import type { BlockNode } from '../root-block/edgeless/edgeless-block-node.js';
import type { GroupElementModel } from '../surface-block/element-model/group.js';
import type { BlockLayer } from '../surface-block/managers/layer-manager.js';

import './portal/generic-block.js';
import './portal/note.js';

const portalMap = {
  'affine:note': 'surface-ref-note-portal',
} as Record<BlockSuite.EdgelessModelKeyType, string>;

const getPortalTag = (model: BlockModel) => {
  const tag = portalMap[model.flavour as BlockSuite.EdgelessModelKeyType];
  return tag ?? 'surface-ref-generic-block-portal';
};

@customElement('surface-ref-portal')
export class SurfaceRefPortal extends WithDisposable(ShadowlessElement) {
  private _getBlocksInFrame = (model: FrameBlockModel): BlockNode[] => {
    const bound = model.elementBound;
    const candidates =
      this.surfaceService?.layer.blocksGrid.search(bound) ?? [];

    return candidates;
  };

  private _renderEdgelessBlocks = () => {
    const refModel = this.refModel;
    const blocks =
      'flavour' in refModel
        ? this._getBlocksInFrame(refModel)
        : this._getBlocksInGroup(refModel);
    const blockLayers = (this.surfaceService?.layer.layers.filter(
      layer => layer.type === 'block'
    ) ?? []) as BlockLayer[];
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
  };

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

  private _getBlocksInGroup(model: GroupElementModel): BlockNode[] {
    return Array.from(model.childIds)
      .map(id => this.doc.getBlockById(id) as BlockNode)
      .filter(el => el);
  }

  override render() {
    return html`<div class="surface-blocks-portal">
      <div class="stacking-canvas"></div>
      ${this._renderEdgelessBlocks()}
    </div>`;
  }

  setStackingCanvas(canvases: HTMLCanvasElement[]) {
    if (this.canvasSlot) {
      this.canvasSlot.replaceChildren(...canvases);
    }
  }

  get surfaceService() {
    return this.host.std.spec.getService('affine:surface');
  }

  @query('.stacking-canvas')
  accessor canvasSlot!: HTMLDivElement;

  @property({ attribute: false })
  accessor doc!: Doc;

  @property({ attribute: false })
  accessor host!: EditorHost;

  @query('.surface-blocks-portal')
  accessor portal!: HTMLDivElement;

  @property({ attribute: false })
  accessor refModel!: GroupElementModel | FrameBlockModel;

  @property({ attribute: false })
  accessor renderModel!: (model: BlockModel) => TemplateResult;
}

declare global {
  interface HTMLElementTagNameMap {
    'surface-ref-portal': SurfaceRefPortal;
  }
}
