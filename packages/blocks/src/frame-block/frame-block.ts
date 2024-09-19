import type { BlockStdScope } from '@blocksuite/block-std';
import type { Doc } from '@blocksuite/store';

import { ColorScheme, FrameBlockModel } from '@blocksuite/affine-model';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  docContext,
  GfxBlockComponent,
  modelContext,
  ShadowlessElement,
  stdContext,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/utils';
import { Bound, type SerializedXYWH } from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing, unsafeCSS } from 'lit';
import { query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { EdgelessRootService } from '../root-block/index.js';

import { parseStringToRgba } from '../root-block/edgeless/components/color-picker/utils.js';
import { isTransparent } from '../root-block/edgeless/components/panel/color-panel.js';

export const frameTitleStyleVars = {
  nestedFrameOffset: 4,
  height: 22,
  fontSize: 14,
};

export class EdgelessFrameTitle extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    edgeless-frame-title {
      position: relative;
    }

    .affine-frame-title {
      position: absolute;
      display: flex;
      align-items: center;
      z-index: 1;
      left: 0px;
      top: 0px;
      border: 1px solid ${unsafeCSS(cssVarV2('edgeless/frame/border/default'))};
      border-radius: 4px;
      width: fit-content;
      height: ${frameTitleStyleVars.height}px;
      padding: 0px 4px;
      transform-origin: left bottom;
      background-color: var(--bg-color);

      span {
        font-family: var(--affine-font-family);
        font-size: ${frameTitleStyleVars.fontSize}px;
        cursor: default;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .affine-frame-title:hover {
      background-color: color-mix(in srgb, var(--bg-color), #000000 7%);
    }
  `;

  private _cachedHeight = 0;

  private _cachedWidth = 0;

  get colors() {
    let backgroundColor = ThemeObserver.getColorValue(
      this.model.background,
      undefined,
      true
    );
    if (isTransparent(backgroundColor)) {
      backgroundColor = ThemeObserver.getPropertyValue(
        cssVarV2('edgeless/frame/background/white').replace(
          /var\((--.*)\)/,
          '$1'
        )
      );
    }

    const { r, g, b, a } = parseStringToRgba(backgroundColor);

    let textColor: string;
    {
      let rPrime, gPrime, bPrime;
      if (ThemeObserver.instance.mode$.value === ColorScheme.Light) {
        rPrime = 1 - a + a * r;
        gPrime = 1 - a + a * g;
        bPrime = 1 - a + a * b;
      } else {
        rPrime = a * r;
        gPrime = a * g;
        bPrime = a * b;
      }

      // light
      const L = 0.299 * rPrime + 0.587 * gPrime + 0.114 * bPrime;
      textColor = L > 0.5 ? 'black' : 'white';
    }

    return {
      background: backgroundColor,
      text: textColor,
    };
  }

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  private _isInsideFrame() {
    return this.gfx.grid.has(
      this.model.elementBound,
      true,
      true,
      model => model !== this.model && model instanceof FrameBlockModel
    );
  }

  private _updateFrameTitleSize() {
    const { _nestedFrame, _zoom: zoom } = this;
    const { elementBound } = this.model;
    const width = this._cachedWidth / zoom;
    const height = this._cachedHeight / zoom;

    const { nestedFrameOffset } = frameTitleStyleVars;

    if (width && height) {
      this.model.externalXYWH = `[${
        elementBound.x + (_nestedFrame ? nestedFrameOffset / zoom : 0)
      },${
        elementBound.y +
        (_nestedFrame
          ? nestedFrameOffset / zoom
          : -(height + nestedFrameOffset / zoom))
      },${width},${height}]`;

      this.gfx.grid.update(this.model);
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    const { _disposables, doc, gfx, rootService } = this;

    this._nestedFrame = this._isInsideFrame();

    _disposables.add(
      doc.slots.blockUpdated.on(payload => {
        if (
          (payload.type === 'update' &&
            payload.props.key === 'xywh' &&
            doc.getBlock(payload.id)?.model instanceof FrameBlockModel) ||
          (payload.type === 'add' && payload.flavour === 'affine:frame')
        ) {
          this._nestedFrame = this._isInsideFrame();
        }

        if (
          payload.type === 'delete' &&
          payload.model instanceof FrameBlockModel &&
          payload.model !== this.model
        ) {
          this._nestedFrame = this._isInsideFrame();
        }
      })
    );

    _disposables.add(
      this.model.propsUpdated.on(() => {
        this._xywh = this.model.xywh;
        this.requestUpdate();
      })
    );

    _disposables.add(
      rootService.selection.slots.updated.on(() => {
        this._editing =
          rootService.selection.selectedIds[0] === this.model.id &&
          rootService.selection.editing;
      })
    );

    _disposables.add(
      rootService.slots.edgelessToolUpdated.on(tool => {
        this._isNavigator = tool.type === 'frameNavigator';
      })
    );

    _disposables.add(
      gfx.viewport.viewportUpdated.on(({ zoom }) => {
        this._zoom = zoom;
      })
    );

    this._zoom = gfx.viewport.zoom;

    const updateTitle = () => {
      this._frameTitle = this.model.title.toString().trim();
    };
    _disposables.add(() => {
      this.model.title.yText.unobserve(updateTitle);
    });
    this.model.title.yText.observe(updateTitle);

    this._frameTitle = this.model.title.toString().trim();
    this._xywh = this.model.xywh;
  }

  override firstUpdated() {
    if (!this._frameTitleEl) return;
    this._cachedWidth = this._frameTitleEl.clientWidth;
    this._cachedHeight = this._frameTitleEl.clientHeight;
    this._updateFrameTitleSize();
  }

  override render() {
    const model = this.model;
    const bound = Bound.deserialize(model.xywh);

    const { _isNavigator, _editing, _zoom: zoom } = this;

    const { nestedFrameOffset, height } = frameTitleStyleVars;

    const nestedFrame = this._nestedFrame;
    const maxWidth = nestedFrame
      ? bound.w * zoom - nestedFrameOffset / zoom
      : bound.w * zoom;
    const hidden = height / zoom >= bound.h;
    const transformOperation = [
      `translate(0%, ${nestedFrame ? 0 : -100}%)`,
      `scale(${1 / zoom})`,
      `translate(${nestedFrame ? nestedFrameOffset : 0}px, ${
        nestedFrame ? nestedFrameOffset : -nestedFrameOffset
      }px)`,
    ];

    return html`
      ${this._frameTitle &&
      this._frameTitle.length !== 0 &&
      !_isNavigator &&
      !_editing
        ? html`
            <div
              style=${styleMap({
                '--bg-color': this.colors.background,
                display: hidden ? 'none' : 'flex',
                transform: transformOperation.join(' '),
                maxWidth: maxWidth + 'px',
                transformOrigin: nestedFrame ? 'top left' : 'bottom left',
                color: this.colors.text,
              })}
              class="affine-frame-title"
            >
              <span>${this._frameTitle}</span>
            </div>
          `
        : nothing}
    `;
  }

  override updated(_changedProperties: Map<string, unknown>) {
    if (
      (!this.gfx.viewport.viewportBounds.contains(this.model.elementBound) &&
        !this.gfx.viewport.viewportBounds.isIntersectWithBound(
          this.model.elementBound
        )) ||
      !this._frameTitleEl
    ) {
      return;
    }

    let sizeChanged = false;
    if (
      this._cachedWidth === 0 ||
      this._cachedHeight === 0 ||
      _changedProperties.has('_frameTitle') ||
      _changedProperties.has('_nestedFrame') ||
      _changedProperties.has('_xywh')
    ) {
      this._cachedWidth = this._frameTitleEl.clientWidth;
      this._cachedHeight = this._frameTitleEl.clientHeight;
      sizeChanged = true;
    }
    if (sizeChanged || _changedProperties.has('_zoom')) {
      this._updateFrameTitleSize();
    }
  }

  @state()
  private accessor _editing = false;

  @state()
  private accessor _frameTitle = '';

  @query('.affine-frame-title')
  private accessor _frameTitleEl!: HTMLDivElement;

  @state()
  private accessor _isNavigator = false;

  @state()
  private accessor _nestedFrame = false;

  @state()
  private accessor _xywh: SerializedXYWH | null = null;

  @state()
  private accessor _zoom!: number;

  @consume({ context: docContext })
  accessor doc!: Doc;

  @consume({ context: modelContext })
  accessor model!: FrameBlockModel;

  @consume({
    context: stdContext,
  })
  accessor std!: BlockStdScope;
}

export class FrameBlockComponent extends GfxBlockComponent<FrameBlockModel> {
  get rootService() {
    return this.std.getService('affine:page') as EdgelessRootService;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._disposables.add(
      this.doc.slots.blockUpdated.on(({ type, id }) => {
        if (id === this.model.id && type === 'update') {
          this.requestUpdate();
        }
      })
    );
  }

  override firstUpdated() {
    this.rootService.slots.edgelessToolUpdated.on(tool => {
      this._isNavigator = tool.type === 'frameNavigator';
    });
  }

  override renderGfxBlock() {
    const { model, _isNavigator, showBorder, rootService } = this;
    const backgroundColor = ThemeObserver.generateColorProperty(
      model.background,
      '--affine-platte-transparent'
    );
    const frameIndex = rootService.layer.getZIndex(model);

    return html`
      <edgeless-frame-title
        style=${styleMap({
          zIndex: 2147483647 - -frameIndex,
        })}
      ></edgeless-frame-title>
      <div
        class="affine-frame-container"
        style=${styleMap({
          zIndex: `${frameIndex}`,
          backgroundColor,
          height: '100%',
          width: '100%',
          borderRadius: '2px',
          border:
            _isNavigator || !showBorder
              ? 'none'
              : `1px solid ${cssVarV2('edgeless/frame/border/default')}`,
        })}
      ></div>
    `;
  }

  override toZIndex(): string {
    return 'auto';
  }

  @state()
  private accessor _isNavigator = false;

  @state()
  accessor showBorder = true;

  @query('edgeless-frame-title')
  accessor titleElement: EdgelessFrameTitle | null = null;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-frame': FrameBlockComponent;
  }
}
