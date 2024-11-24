import { ColorScheme, FrameBlockModel } from '@blocksuite/affine-model';
import { ThemeProvider } from '@blocksuite/affine-shared/services';
import {
  type BlockStdScope,
  PropTypes,
  requiredProperties,
  stdContext,
} from '@blocksuite/block-std';
import { GfxControllerIdentifier } from '@blocksuite/block-std/gfx';
import {
  Bound,
  type SerializedXYWH,
  SignalWatcher,
  WithDisposable,
} from '@blocksuite/global/utils';
import { consume } from '@lit/context';
import { themeToVar } from '@toeverything/theme/v2';
import { LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { EdgelessRootService } from '../../edgeless/index.js';

import { parseStringToRgba } from '../../edgeless/components/color-picker/utils.js';
import { isTransparent } from '../../edgeless/components/panel/color-panel.js';
import { frameTitleStyle, frameTitleStyleVars } from './styles.js';

export const AFFINE_FRAME_TITLE = 'affine-frame-title';

@requiredProperties({
  model: PropTypes.instanceOf(FrameBlockModel),
})
export class AffineFrameTitle extends SignalWatcher(
  WithDisposable(LitElement)
) {
  static override styles = frameTitleStyle;

  private _cachedHeight = 0;

  private _cachedWidth = 0;

  get colors() {
    let backgroundColor = this.std
      .get(ThemeProvider)
      .getColorValue(this.model.background, undefined, true);
    if (isTransparent(backgroundColor)) {
      backgroundColor = this.std
        .get(ThemeProvider)
        .getCssVariableColor(themeToVar('edgeless/frame/background/white'));
    }

    const { r, g, b, a } = parseStringToRgba(backgroundColor);

    const theme = this.std.get(ThemeProvider).theme;
    let textColor: string;
    {
      let rPrime, gPrime, bPrime;
      if (theme === ColorScheme.Light) {
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

  get doc() {
    return this.model.doc;
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
    } else {
      this.model.externalXYWH = undefined;
    }
  }

  private _updateStyle() {
    if (
      this._frameTitle.length === 0 ||
      this._editing ||
      this.gfx.tool.currentToolName$.value === 'frameNavigator'
    ) {
      this.style.display = 'none';
      return;
    }

    const model = this.model;
    const bound = Bound.deserialize(model.xywh);

    const { _zoom: zoom } = this;
    const { nestedFrameOffset, height } = frameTitleStyleVars;

    const nestedFrame = this._nestedFrame;
    const maxWidth = nestedFrame
      ? bound.w * zoom - nestedFrameOffset / zoom
      : bound.w * zoom;
    const hidden = height / zoom >= bound.h;
    const transformOperation = [
      `translate(0%, ${nestedFrame ? 0 : -100}%)`,
      `translate(${nestedFrame ? nestedFrameOffset : 0}px, ${
        nestedFrame ? nestedFrameOffset : -nestedFrameOffset
      }px)`,
    ];

    const anchor = this.gfx.viewport.toViewCoord(bound.x, bound.y);

    this.style.display = '';
    this.style.setProperty('--bg-color', this.colors.background);
    this.style.left = `${anchor[0]}px`;
    this.style.top = `${anchor[1]}px`;
    this.style.display = hidden ? 'none' : 'flex';
    this.style.transform = transformOperation.join(' ');
    this.style.maxWidth = `${maxWidth}px`;
    this.style.transformOrigin = nestedFrame ? 'top left' : 'bottom left';
    this.style.color = this.colors.text;
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
      gfx.viewport.viewportUpdated.on(({ zoom }) => {
        this._zoom = zoom;
        this.requestUpdate();
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
    this._cachedWidth = this.clientWidth;
    this._cachedHeight = this.clientHeight;
    this._updateFrameTitleSize();
  }

  override render() {
    this._updateStyle();
    return this._frameTitle;
  }

  override updated(_changedProperties: Map<string, unknown>) {
    if (
      !this.gfx.viewport.viewportBounds.contains(this.model.elementBound) &&
      !this.gfx.viewport.viewportBounds.isIntersectWithBound(
        this.model.elementBound
      )
    ) {
      return;
    }

    let sizeChanged = false;
    if (
      this._cachedWidth === 0 ||
      this._cachedHeight === 0 ||
      _changedProperties.has('_frameTitle') ||
      _changedProperties.has('_nestedFrame') ||
      _changedProperties.has('_xywh') ||
      _changedProperties.has('_editing')
    ) {
      this._cachedWidth = this.clientWidth;
      this._cachedHeight = this.clientHeight;
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

  @state()
  private accessor _nestedFrame = false;

  @state()
  private accessor _xywh: SerializedXYWH | null = null;

  @state()
  private accessor _zoom = 1;

  @property({ attribute: false })
  accessor model!: FrameBlockModel;

  @consume({ context: stdContext })
  accessor std!: BlockStdScope;
}
