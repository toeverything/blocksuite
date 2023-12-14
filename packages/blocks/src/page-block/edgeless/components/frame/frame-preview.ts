import { assertExists, DisposableGroup } from '@blocksuite/global/utils';
import {
  type EditorHost,
  ShadowlessElement,
  WithDisposable,
} from '@blocksuite/lit';
import type { Page, Y } from '@blocksuite/store';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { EdgelessPresentationConsts as PresentationConsts } from '../../../../_common/edgeless/frame/consts.js';
import {
  type CssVariableName,
  isCssVariable,
} from '../../../../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../../../../_common/theme/utils.js';
import type {
  EdgelessElement,
  TopLevelBlockModel,
} from '../../../../_common/types.js';
import type { FrameBlockModel } from '../../../../frame-block/frame-model.js';
import type { NoteBlockModel } from '../../../../note-block/note-model.js';
import { ConnectorElement } from '../../../../surface-block/elements/connector/connector-element.js';
import type { CanvasElementType } from '../../../../surface-block/elements/edgeless-element.js';
import { ElementCtors } from '../../../../surface-block/elements/index.js';
import type { SurfaceElement } from '../../../../surface-block/elements/surface-element.js';
import {
  getGroupParent,
  setGroupParent,
} from '../../../../surface-block/managers/group-manager.js';
import { LayerManager } from '../../../../surface-block/managers/layer-manager.js';
import { Renderer } from '../../../../surface-block/renderer.js';
import type { SurfaceBlockModel } from '../../../../surface-block/surface-model.js';
import { Bound } from '../../../../surface-block/utils/bound.js';
import { deserializeXYWH } from '../../../../surface-block/utils/xywh.js';
import type { SurfaceRefPortal } from '../../../../surface-ref-block/surface-ref-portal.js';
import { getSurfaceBlock } from '../../../../surface-ref-block/utils.js';
import { ConnectorPathGenerator } from '../../connector-manager.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

const DEFAULT_PREVIEW_CONTAINER_WIDTH = 280;
const DEFAULT_PREVIEW_CONTAINER_HEIGHT = 166;

const styles = css`
  .frame-preview-container {
    display: block;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
  }

  .frame-preview-surface-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    overflow: hidden;
  }

  .frame-preview-surface-viewport {
    max-width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
  }

  .frame-preview-surface-canvas-container {
    height: 100%;
    width: 100%;
    position: relative;
  }
`;

@customElement('frame-preview')
export class FramePreview extends WithDisposable(ShadowlessElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless: EdgelessPageBlockComponent | null = null;

  @property({ attribute: false })
  frame!: FrameBlockModel;

  @property({ attribute: false })
  page!: Page;

  @property({ attribute: false })
  host!: EditorHost;

  @property({ attribute: false })
  surfaceWidth: number = DEFAULT_PREVIEW_CONTAINER_WIDTH;

  @property({ attribute: false })
  surfaceHeight: number = DEFAULT_PREVIEW_CONTAINER_HEIGHT;

  @state()
  fillScreen = false;

  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  private _surfaceRenderer = new Renderer({
    layerManager: new LayerManager(),
  });
  private _connectorManager = new ConnectorPathGenerator({
    pickById: id => this.getModel(id),
    refresh: () => this._surfaceRenderer.refresh(),
  });
  private _elements = new Map<string, SurfaceElement>();
  private _edgelessDisposables: DisposableGroup | null = null;
  private _pageDisposables: DisposableGroup | null = null;
  private _frameDisposables: DisposableGroup | null = null;

  @query('.frame-preview-surface-canvas-container')
  container!: HTMLDivElement;

  @query('.frame-preview-surface-container surface-ref-portal')
  blocksPortal!: SurfaceRefPortal;

  override createRenderRoot() {
    // Do not use shadow root, use the element itself as the render root.
    // This will allow the element to use global styles.
    return this;
  }

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  private _attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  private _initSurfaceRenderer(
    page: Page,
    surfaceModel: SurfaceBlockModel | null
  ) {
    this.surfaceRenderer.layerManager.init([
      ...this._elements.values(),
      ...((surfaceModel?.children || []) as EdgelessElement[]),
      ...(page.getBlockByFlavour('affine:note') as EdgelessElement[]),
    ]);
  }

  private _initSurfaceModel(page: Page, disposables: DisposableGroup) {
    this._surfaceModel = null;
    this._elements.clear();

    const init = () => {
      this._surfaceModel = getSurfaceBlock(page);

      if (!this._surfaceModel) return;

      const elementsMap = this._surfaceModel.elements.getValue() as Y.Map<
        Y.Map<unknown>
      >;
      const onElementsChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
        this._onElementsChange(event, elementsMap);
      };
      elementsMap.observe(onElementsChange);
      disposables.add(() => elementsMap.unobserve(onElementsChange));

      this._syncFromExistingContainer(elementsMap);
    };

    init();

    if (!this._surfaceModel) {
      disposables.add(
        page.slots.blockUpdated.on(({ type }) => {
          if (
            type === 'add' &&
            !this._surfaceModel &&
            getSurfaceBlock(this.page)
          ) {
            init();
          }
        })
      );
    }
  }

  private _onElementUpdatedOrAdded(id: string) {
    const element = this.getModel(id);

    if (
      element instanceof ConnectorElement &&
      this._connectorManager.hasRelatedElement(element)
    ) {
      this._connectorManager.updatePath(element);
    }
  }

  private _refreshViewport() {
    if (!this.frame) {
      return;
    }

    const referencedModel = this.frame;

    // trigger a rerender to update element's size
    // and set viewport after element's size has been updated
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._surfaceRenderer.onResize();
      this._surfaceRenderer.setViewportByBound(
        Bound.fromXYWH(deserializeXYWH(referencedModel.xywh))
      );

      this.blocksPortal?.setViewport(this._surfaceRenderer);
    });
  }

  private getModel(id: string): RefElement | null {
    return (
      (this.page.getBlockById(id) as Exclude<
        TopLevelBlockModel,
        NoteBlockModel
      >) ??
      this._elements.get(id) ??
      null
    );
  }

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      const yGroups: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as CanvasElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        if (type === 'group') {
          yGroups.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
      yGroups.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as CanvasElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: () => undefined,
      onElementUpdated: ({ id }) => {
        const element = this.getModel(id);

        if (
          element instanceof ConnectorElement &&
          !this._connectorManager.hasRelatedElement(element)
        ) {
          this._connectorManager.updatePath(element);
        }
      },
      removeElement: () => {},
      updateElementLocalRecord: () => {},
      pickById: id => this.getModel(id),
      getGroupParent: getGroupParent,
      setGroupParent: setGroupParent,
    });
    element.computedValue = this._getCSSPropertyValue;
    element.mount(this._surfaceRenderer);
    this._elements.set(element.id, element);
    this._onElementUpdatedOrAdded(element.id);
  }

  private _onElementsChange = (
    event: Y.YMapEvent<Y.Map<unknown>>,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    // skip empty event
    if (event.changes.keys.size === 0) return;
    const connectors: {
      change: (typeof event)['changes']['keys'] extends Map<string, infer V>
        ? V
        : never;
      id: string;
    }[] = [];
    event.keysChanged.forEach(id => {
      const change = event.changes.keys.get(id);
      if (!change) {
        console.error('invalid event', event);
        return;
      }

      if (
        change.action === 'add' &&
        elementsMap.get(id)?.get('type') === 'connector'
      ) {
        connectors.push({ change, id });
        return;
      } else {
        this._onYEvent(change, id, elementsMap);
      }
    });
    connectors.forEach(({ change, id }) =>
      this._onYEvent(change, id, elementsMap)
    );
  };

  private _onYEvent = (
    type: Y.YMapEvent<Y.Map<unknown>>['changes']['keys'] extends Map<
      string,
      infer V
    >
      ? V
      : never,
    id: string,
    elementsMap: Y.Map<Y.Map<unknown>>
  ) => {
    if (type.action === 'add') {
      const yElement = elementsMap.get(id) as Y.Map<unknown>;
      const type = yElement.get('type') as CanvasElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        getLocalRecord: () => undefined,
        updateElementLocalRecord: () => {},
        pickById: id => this.getModel(id),
        getGroupParent: getGroupParent,
        setGroupParent: setGroupParent,
        removeElement: () => {},
      });
      element.computedValue = this._getCSSPropertyValue;
      element.mount(this._surfaceRenderer);
      this.surfaceRenderer.layerManager.add(element);
      this._elements.set(element.id, element);
      this._onElementUpdatedOrAdded(element.id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);

      if (element) {
        this.surfaceRenderer.layerManager.delete(element);
        element.unmount();
        this._elements.delete(id);
      }
    }

    this._surfaceRenderer.refresh();
    this.requestUpdate();
  };

  private _tryLoadFillScreen() {
    const fillScreen = sessionStorage.getItem(PresentationConsts.FillScreen);
    this.fillScreen = fillScreen === 'true';
  }

  private _getCSSPropertyValue = (value: string) => {
    const host = this.host;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(host, value as CssVariableName);
      if (cssValue === undefined) {
        console.error(
          new Error(
            `All variables should have a value. Please check for any dirty data or variable renaming.Variable: ${value}`
          )
        );
      }
      return cssValue ?? value;
    }

    return value;
  };

  private _getViewportWH = (referencedModel: RefElement) => {
    const [, , w, h] = deserializeXYWH(referencedModel.xywh);

    let scale = 1;
    if (this.fillScreen) {
      scale = Math.max(this.surfaceWidth / w, this.surfaceHeight / h);
    } else {
      scale = Math.min(this.surfaceWidth / w, this.surfaceHeight / h);
    }

    return {
      width: w * scale,
      height: h * scale,
    };
  };

  private _clearEdgelessDisposables = () => {
    this._edgelessDisposables?.dispose();
    this._edgelessDisposables = null;
  };

  private _clearPageDisposables = () => {
    this._pageDisposables?.dispose();
    this._pageDisposables = null;
  };

  private _clearFrameDisposables = () => {
    this._frameDisposables?.dispose();
    this._frameDisposables = null;
  };

  private _setEdgelessDisposables(edgeless: EdgelessPageBlockComponent | null) {
    this._clearEdgelessDisposables();
    if (!edgeless) return;
    this._edgelessDisposables = new DisposableGroup();
    this._edgelessDisposables.add(
      edgeless.slots.navigatorSettingUpdated.on(({ fillScreen }) => {
        if (fillScreen !== undefined) {
          this.fillScreen = fillScreen;
          this._refreshViewport();
        }
      })
    );
  }

  private _setPageDisposables(page: Page) {
    this._clearPageDisposables();
    this._pageDisposables = new DisposableGroup();
    this._initSurfaceModel(page, this._pageDisposables);
    this._initSurfaceRenderer(page, this._surfaceModel);
    this._connectorManager = new ConnectorPathGenerator({
      pickById: id => this.getModel(id),
      refresh: () => this._surfaceRenderer.refresh(),
    });

    this._pageDisposables.add(
      page.slots.blockUpdated.on(event => {
        const { type, flavour } = event;
        const isTopLevelBlock = ['affine:image', 'affine:note'].includes(
          flavour
        );
        if (!isTopLevelBlock) return;

        const frameBound = Bound.deserialize(this.frame.xywh);
        if (type === 'delete') {
          const deleteModel = event.model as TopLevelBlockModel;
          const deleteBound = Bound.deserialize(deleteModel.xywh);
          if (frameBound.containsPoint([deleteBound.x, deleteBound.y])) {
            this._refreshViewport();
          }
        } else {
          const topLevelBlock = page.getBlockById(event.id);
          if (!topLevelBlock) return;
          const newBound = Bound.deserialize(
            (topLevelBlock as TopLevelBlockModel).xywh
          );
          if (frameBound.containsPoint([newBound.x, newBound.y])) {
            this._refreshViewport();
          }
        }
      })
    );
  }

  private _setFrameDisposables(frame: FrameBlockModel) {
    this._clearFrameDisposables();
    this._frameDisposables = new DisposableGroup();
    this._frameDisposables.add(
      frame.propsUpdated.on(() => {
        this._refreshViewport();
      })
    );
  }

  private _renderSurfaceContent(referencedModel: FrameBlockModel) {
    const { width, height } = this._getViewportWH(referencedModel);
    return html`<div
      class="frame-preview-surface-container"
      style=${styleMap({
        width: `${this.surfaceWidth}px`,
        height: `${this.surfaceHeight}px`,
      })}
    >
      <div
        class="frame-preview-surface-viewport"
        style=${styleMap({
          width: `${width}px`,
          height: `${height}px`,
          aspectRatio: `${width} / ${height}`,
        })}
      >
        <surface-ref-portal
          .page=${this.page}
          .host=${this.host}
          .containerModel=${referencedModel}
          .renderModel=${this.host.renderModel}
        ></surface-ref-portal>
        <div class="frame-preview-surface-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._tryLoadFillScreen();
    this._setPageDisposables(this.page);
    this._setEdgelessDisposables(this.edgeless);
    this._setFrameDisposables(this.frame);
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this._refreshViewport();
      this._setFrameDisposables(this.frame);
    }

    if (_changedProperties.has('edgeless')) {
      if (this.edgeless) {
        this._setEdgelessDisposables(this.edgeless);
      } else {
        this._clearEdgelessDisposables();
      }
    }

    if (_changedProperties.has('page')) {
      this._setPageDisposables(this.page);
    }
    this._attachRenderer();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearEdgelessDisposables();
    this._clearPageDisposables();
    this._clearFrameDisposables();
  }

  override render() {
    const { _surfaceModel, frame, host } = this;
    const noContent = !_surfaceModel || !frame || !frame.xywh || !host;

    return html`<div class="frame-preview-container">
      ${noContent ? nothing : this._renderSurfaceContent(frame)}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frame-preview': FramePreview;
  }
}
