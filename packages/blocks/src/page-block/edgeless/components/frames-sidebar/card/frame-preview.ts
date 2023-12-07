import { assertExists, type Disposable } from '@blocksuite/global/utils';
import { WithDisposable } from '@blocksuite/lit';
import type { Y } from '@blocksuite/store';
import { css, html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { FILL_SCREEN_KEY } from '../../../../../_common/edgeless/frame/consts.js';
import {
  type CssVariableName,
  isCssVariable,
} from '../../../../../_common/theme/css-variables.js';
import { getThemePropertyValue } from '../../../../../_common/theme/utils.js';
import type {
  EdgelessElement,
  TopLevelBlockModel,
} from '../../../../../_common/utils/types.js';
import type { FrameBlockModel } from '../../../../../frame-block/frame-model.js';
import type { NoteBlockModel } from '../../../../../note-block/note-model.js';
import type { SurfaceElement } from '../../../../../surface-block/elements/surface-element.js';
import {
  Bound,
  type CanvasElementType,
  ConnectorElement,
  deserializeXYWH,
  ElementCtors,
} from '../../../../../surface-block/index.js';
import {
  getGroupParent,
  setGroupParent,
} from '../../../../../surface-block/managers/group-manager.js';
import { LayerManager } from '../../../../../surface-block/managers/layer-manager.js';
import { Renderer } from '../../../../../surface-block/renderer.js';
import type { SurfaceBlockModel } from '../../../../../surface-block/surface-model.js';
import type { SurfaceRefPortal } from '../../../../../surface-ref-block/surface-ref-portal.js';
import { getSurfaceBlock } from '../../../../../surface-ref-block/utils.js';
import { ConnectorPathGenerator } from '../../../connector-manager.js';
import type { EdgelessPageBlockComponent } from '../../../edgeless-page-block.js';

type RefElement = Exclude<EdgelessElement, NoteBlockModel>;

const DEFAULT_PREVIEW_CONTAINER_WIDTH = 280;
const DEFAULT_PREVIEW_CONTAINER_HEIGHT = 166;

const styles = css`
  .frame-preview-container {
    display: block;
    width: calc(100% - 4px);
    height: calc(100% - 4px);
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }

  .surface-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }

  .surface-viewport {
    max-width: 100%;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    pointer-events: none;
    user-select: none;
  }

  .surface-canvas-container {
    height: 100%;
    width: 100%;
    position: relative;
  }
`;
export class FramePreview extends WithDisposable(LitElement) {
  static override styles = styles;

  @property({ attribute: false })
  edgeless!: EdgelessPageBlockComponent;

  @property({ attribute: false })
  frame!: FrameBlockModel;

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

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  @query('surface-ref-portal')
  blocksPortal!: SurfaceRefPortal;

  get surfaceRenderer() {
    return this._surfaceRenderer;
  }

  get root() {
    return this.edgeless.root;
  }

  get page() {
    return this.edgeless.page;
  }

  private _attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  private _initSurfaceRenderer() {
    this.surfaceRenderer.layerManager.init([
      ...this._elements.values(),
      ...((this._surfaceModel?.children || []) as EdgelessElement[]),
      ...(this.page.getBlockByFlavour('affine:note') as EdgelessElement[]),
    ]);
  }

  private _initReferencedModel() {
    let refWathcer: Disposable | null = null;
    const init = () => {
      refWathcer?.dispose();

      const referencedModel = this.frame;

      if (!referencedModel) return;

      if ('propsUpdated' in referencedModel) {
        refWathcer = referencedModel.propsUpdated.on(() => {
          this.updateComplete.then(() => {
            this._refreshViewport();
          });
        });
      }

      this._refreshViewport();
    };

    init();

    this._disposables.add(() => {
      refWathcer?.dispose();
    });
  }

  private _initSurfaceModel() {
    const init = () => {
      this._surfaceModel = getSurfaceBlock(this.page);

      if (!this._surfaceModel) return;

      const elementsMap = this._surfaceModel.elements.getValue() as Y.Map<
        Y.Map<unknown>
      >;
      const onElementsChange = (event: Y.YMapEvent<Y.Map<unknown>>) => {
        this._onElementsChange(event, elementsMap);
      };
      elementsMap.observe(onElementsChange);
      this._disposables.add(() => elementsMap.unobserve(onElementsChange));

      this._syncFromExistingContainer(elementsMap);
    };

    init();

    if (!this._surfaceModel) {
      this._disposables.add(
        this.page.slots.blockUpdated.on(({ type }) => {
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
      console.log('add event on yElements: ', id);
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
      this._elements.set(element.id, element);
      this._onElementUpdatedOrAdded(element.id);
    } else if (type.action === 'update') {
      console.error('update event on yElements is not supported', event);
    } else if (type.action === 'delete') {
      const element = this._elements.get(id);

      if (element) {
        element.unmount();
        this._elements.delete(id);
      }
    }

    this._surfaceRenderer.refresh();
    this.requestUpdate();
  };

  private _tryLoadFillScreen() {
    const fillScreen = sessionStorage.getItem(FILL_SCREEN_KEY);
    this.fillScreen = fillScreen === 'true';
  }

  private _getCSSPropertyValue = (value: string) => {
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(
        this.root,
        value as CssVariableName
      );
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

  private _renderSurfaceContent(referencedModel: FrameBlockModel) {
    const { width, height } = this._getViewportWH(referencedModel);
    return html`<div
      class="surface-container"
      style=${styleMap({
        width: `${this.surfaceWidth}px`,
        height: `${this.surfaceHeight}px`,
      })}
    >
      <div
        class="surface-viewport"
        style=${styleMap({
          width: `${width}px`,
          height: `${height}px`,
          aspectRatio: `${width} / ${height}`,
        })}
      >
        <surface-ref-portal
          .page=${this.page}
          .root=${this.root}
          .containerModel=${referencedModel}
          .renderModel=${this.root.renderModel}
        ></surface-ref-portal>
        <div class="surface-canvas-container">
          <!-- attach canvas here -->
        </div>
      </div>
    </div>`;
  }

  override connectedCallback() {
    super.connectedCallback();
    this._tryLoadFillScreen();
    this._initSurfaceModel();
    this._initReferencedModel();
    this._initSurfaceRenderer();

    this._disposables.add(
      this.edgeless.slots.navigatorSettingUpdated.on(({ fillScreen }) => {
        if (fillScreen !== undefined) {
          this.fillScreen = fillScreen;
          this._refreshViewport();
        }
      })
    );
  }

  override updated(_changedProperties: PropertyValues) {
    if (_changedProperties.has('frame')) {
      this.requestUpdate();
      this._refreshViewport();
    }
    this._attachRenderer();
  }

  override firstUpdated() {
    // When top level blocks are added, deleted or moved inside the frame
    // we need to refresh the viewport
    this._disposables.add(
      this.page.slots.blockUpdated.on(event => {
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
          const topLevelBlock = this.page.getBlockById(event.id);
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

    // When canvas elements are added, deleted or moved inside the frame
    // we also need to refresh the viewport
    if (!this._surfaceModel) return;
    console.log('surface model', this._surfaceModel);
  }

  override render() {
    console.log('element render: ', this._elements);
    const { _surfaceModel, frame } = this;
    console.log('renderer: ', this._surfaceRenderer);
    const noContent = !_surfaceModel || !frame || !frame.xywh;

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
