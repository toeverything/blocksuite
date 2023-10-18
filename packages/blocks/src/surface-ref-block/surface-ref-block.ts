import './portal/note.js';

import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Disposable } from '@blocksuite/global/utils';
import { BlockElement } from '@blocksuite/lit';
import { type Y } from '@blocksuite/store';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  type CssVariableName,
  isCssVariable,
} from '../__internal__/theme/css-variables.js';
import { getThemePropertyValue } from '../__internal__/theme/utils.js';
import { type AbstractEditor } from '../__internal__/utils/types.js';
import type {
  FrameBlockModel,
  NoteBlockModel,
  SurfaceBlockModel,
} from '../models.js';
import { getNotesInFrame } from '../page-block/edgeless/frame-manager.js';
import { type PhasorElementType } from '../surface-block/elements/edgeless-element.js';
import type { SurfaceElement } from '../surface-block/elements/surface-element.js';
import { ElementCtors } from '../surface-block/index.js';
import { Renderer } from '../surface-block/renderer.js';
import { Bound } from '../surface-block/utils/bound.js';
import { deserializeXYWH } from '../surface-block/utils/xywh.js';
import type { SurfaceRefBlockModel } from './surface-ref-model.js';
import { getSurfaceBlock } from './utils.js';
@customElement('affine-surface-ref')
export class SurfaceSyncBlockComponent extends BlockElement<SurfaceRefBlockModel> {
  static override styles = css`
    .affine-surface-ref {
      padding: 10px;
      position: relative;
    }

    .surface-viewport {
      max-width: 100%;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }

    .surface-block-portal {
      pointer-events: none;
      position: absolute;
      left: 0;
      top: 0;
    }

    .surface-canvas-container {
      height: 100%;
      width: 100%;
      position: relative;
    }
  `;
  @state()
  private _surfaceModel: SurfaceBlockModel | null = null;

  @state()
  private _focused: boolean = false;

  private _referenceModel: FrameBlockModel | null = null;
  private _surfaceRenderer = new Renderer();
  private _elements = new Map<string, SurfaceElement>();

  @query('.surface-canvas-container')
  container!: HTMLDivElement;

  @query('.surface-block-portal')
  blocksPortal!: HTMLDivElement;

  override connectedCallback() {
    super.connectedCallback();
    this.initSurfaceModel();
    this.initReferenceModel();
    this.initSelection();
    this.initSurfaceRenderer();
  }

  override updated() {
    this.attachRenderer();
  }

  attachRenderer() {
    if (this._surfaceRenderer.canvas.isConnected || !this.container) return;

    this._surfaceRenderer.attach(this.container);
  }

  initSurfaceRenderer() {
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.width !== lastWidth) {
        lastWidth = entries[0].contentRect.width;
        this._refreshViewport();
      }
    });
    observer.observe(this);

    this._disposables.add(() => observer.disconnect());
  }

  initReferenceModel() {
    let referenceWathcer: Disposable | null = null;
    const init = () => {
      const referenceModel = this.getModel(
        this.model.reference
      ) as FrameBlockModel;

      this._referenceModel = 'xywh' in referenceModel ? referenceModel : null;

      if (!this._referenceModel) return;

      referenceWathcer = referenceModel.propsUpdated.on(() => {
        this.requestUpdate();
        this.updateComplete.then(() => {
          this._refreshViewport();
        });
      });

      this._refreshViewport();
    };

    init();

    this._disposables.add(() => {
      this.model.propsUpdated.on(() => {
        if (this.model.reference !== this._referenceModel?.id) {
          init();
        }
      });
    });
    this._disposables.add(() => {
      referenceWathcer?.dispose();
    });
  }

  initSurfaceModel() {
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

  initSelection() {
    const selection = this.root.selection;
    this._disposables.add(
      selection.slots.changed.on(selList => {
        this._focused = selList.some(
          sel => PathFinder.equals(sel.path, this.path) && sel.is('block')
        );
      })
    );
  }

  private _refreshViewport() {
    if (!this._referenceModel) {
      return;
    }

    const referenceModel = this._referenceModel;

    // trigger an rerender to update element's size
    // and set viewport after element's size has been updated
    this.requestUpdate();
    this.updateComplete.then(() => {
      this._surfaceRenderer.onResize();
      this._surfaceRenderer.setViewportByBound(
        Bound.fromXYWH(deserializeXYWH(referenceModel.xywh))
      );

      // trigger an rerender to update portal transform
      this.requestUpdate();
    });
  }

  private _syncFromExistingContainer(elementsMap: Y.Map<Y.Map<unknown>>) {
    elementsMap.doc?.transact(() => {
      const yConnectors: Y.Map<unknown>[] = [];
      elementsMap.forEach(yElement => {
        const type = yElement.get('type') as PhasorElementType;
        if (type === 'connector') {
          yConnectors.push(yElement);
          return;
        }
        this._createElementFromYMap(yElement);
      });
      yConnectors.forEach(yElement => {
        this._createElementFromYMap(yElement);
      });
    });
  }

  private _createElementFromYMap(yElement: Y.Map<unknown>) {
    const type = yElement.get('type') as PhasorElementType;
    const ElementCtor = ElementCtors[type];
    assertExists(ElementCtor);
    const element = new ElementCtor(yElement, {
      getLocalRecord: () => undefined,
      onElementUpdated: () => {},
    });
    element.computedValue = this._getCSSPropertyValue;
    element.mount(this._surfaceRenderer);
    this._elements.set(element.id, element);
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
      const type = yElement.get('type') as PhasorElementType;

      const ElementCtor = ElementCtors[type];
      assertExists(ElementCtor);
      const element = new ElementCtor(yElement, {
        onElementUpdated() {},
        getLocalRecord: () => undefined,
      });
      element.computedValue = this._getCSSPropertyValue;
      element.mount(this._surfaceRenderer);
      this._elements.set(element.id, element);
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

  private _getCSSPropertyValue = (value: string) => {
    const root = this.root;
    if (isCssVariable(value)) {
      const cssValue = getThemePropertyValue(root, value as CssVariableName);
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

  private getModel(id: string) {
    return this.page.getBlockById(id) ?? this._elements.get(id) ?? null;
  }

  viewInEdgeless() {
    if (!this._referenceModel) return;

    const xywh = deserializeXYWH(this._referenceModel.xywh);
    const doc = this.ownerDocument;
    const editorContainer = doc.querySelector(
      'editor-container'
    ) as AbstractEditor;

    if (!editorContainer) return;

    if (editorContainer.mode !== 'edgeless') {
      editorContainer.mode = 'edgeless';
    }

    setTimeout(() => {
      const edgeless = doc.querySelector('affine-edgeless-page');

      edgeless?.surface.viewport.setViewportByBound(
        Bound.fromXYWH(xywh),
        [100, 60, 100, 60],
        false
      );
    }, 50);

    this.selection.update(selections => {
      return selections.filter(sel => !PathFinder.equals(sel.path, this.path));
    });
  }

  focusBlock() {
    this.selection.update(() => {
      return [this.selection.getInstance('block', { path: this.path })];
    });
  }

  private _renderEdgelessNotes(notes: NoteBlockModel[]) {
    return repeat(
      notes,
      model => model.id,
      (model, index) => {
        return html`<surface-ref-note-portal
          .index=${index}
          .model=${model}
          .renderModel=${this.renderModel}
        ></surface-ref-note-portal>`;
      }
    );
  }

  override render() {
    const { reference } = this.model;
    const model = this.getModel(reference) as FrameBlockModel;

    if (!this._surfaceModel || !model || !model.xywh) return nothing;

    const [, , w, h] = deserializeXYWH(model.xywh);
    const notes = getNotesInFrame(this.page, model, false);
    const { zoom, translateX, translateY } = this._surfaceRenderer;

    return html`<div class="affine-surface-ref">
      <div
        class="surface-viewport"
        style=${styleMap({
          width: `${w}px`,
          aspectRatio: `${w} / ${h}`,
          outline: this._focused
            ? '2px solid var(--affine-primary-color)'
            : undefined,
        })}
      >
        <div
          class="surface-block-portal"
          style=${styleMap({
            transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
          })}
        >
          ${this._renderEdgelessNotes(notes)}
        </div>
        <div
          class="surface-canvas-container"
          @dblclick=${this.viewInEdgeless}
          @click=${this.focusBlock}
        >
          <!-- attach canvas here -->
        </div>
      </div>
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-surface-ref': SurfaceSyncBlockComponent;
  }
}
