import type {
  EmbedCardStyle,
  GfxCompatibleProps,
} from '@blocksuite/affine-model';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  EMBED_CARD_HEIGHT,
  EMBED_CARD_MIN_WIDTH,
  EMBED_CARD_WIDTH,
} from '@blocksuite/affine-shared/consts';
import {
  DocModeProvider,
  DragHandleConfigExtension,
} from '@blocksuite/affine-shared/services';
import { ThemeObserver } from '@blocksuite/affine-shared/theme';
import {
  captureEventTarget,
  convertDragPreviewDocToEdgeless,
  convertDragPreviewEdgelessToDoc,
} from '@blocksuite/affine-shared/utils';
import { type BlockService, isGfxBlockComponent } from '@blocksuite/block-std';
import { html } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { type StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { styles } from './styles.js';

export const EmbedDragHandleOption = DragHandleConfigExtension({
  flavour: /affine:embed-*/,
  edgeless: true,
  onDragEnd: props => {
    const { state, draggingElements } = props;
    if (
      draggingElements.length !== 1 ||
      draggingElements[0].model.flavour.match(/affine:embed-*/) === null
    )
      return false;

    const blockComponent = draggingElements[0] as EmbedBlockComponent;
    const isInSurface = isGfxBlockComponent(blockComponent);
    const target = captureEventTarget(state.raw.target);
    const isTargetEdgelessContainer =
      target?.classList.contains('edgeless-container');

    if (isInSurface) {
      const style = blockComponent._cardStyle;
      const targetStyle =
        style === 'vertical' || style === 'cube' ? 'horizontal' : style;
      return convertDragPreviewEdgelessToDoc({
        blockComponent,
        style: targetStyle,
        ...props,
      });
    } else if (isTargetEdgelessContainer) {
      const style = blockComponent._cardStyle;

      return convertDragPreviewDocToEdgeless({
        blockComponent,
        cssSelector: '.embed-block-container',
        width: EMBED_CARD_WIDTH[style],
        height: EMBED_CARD_HEIGHT[style],
        ...props,
      });
    }

    return false;
  },
});

export class EmbedBlockComponent<
  Model extends BlockModel<GfxCompatibleProps> = BlockModel<GfxCompatibleProps>,
  Service extends BlockService = BlockService,
  WidgetName extends string = string,
> extends CaptionedBlockComponent<Model, Service, WidgetName> {
  static override styles = styles;

  private _fetchAbortController = new AbortController();

  _cardStyle: EmbedCardStyle = 'horizontal';

  /**
   * The actual rendered scale of the embed card.
   * By default, it is set to 1.
   */
  protected _scale = 1;

  /**
   * The style of the embed card.
   * You can use this to change the height and width of the card.
   * By default, the height and width are set to `_cardHeight` and `_cardWidth` respectively.
   */
  protected embedContainerStyle: StyleInfo = {};

  renderEmbed = (content: () => TemplateResult) => {
    const theme = ThemeObserver.mode;
    const isSelected = !!this.selected?.is('block');

    if (
      this._cardStyle === 'horizontal' ||
      this._cardStyle === 'horizontalThin' ||
      this._cardStyle === 'list'
    ) {
      this.style.display = 'block';

      const mode = this.std.get(DocModeProvider).getEditorMode();
      if (mode === 'edgeless') {
        this.style.minWidth = `${EMBED_CARD_MIN_WIDTH}px`;
      }
    }

    return html`
      <div
        class=${classMap({
          'embed-block-container': true,
          [theme]: true,
          selected: isSelected,
        })}
        style=${styleMap({
          height: `${this._cardHeight}px`,
          width: '100%',
          ...this.embedContainerStyle,
        })}
      >
        ${content()}
      </div>
    `;
  };

  /**
   * The height of the current embed card. Changes based on the card style.
   */
  get _cardHeight() {
    return EMBED_CARD_HEIGHT[this._cardStyle];
  }

  /**
   * The width of the current embed card. Changes based on the card style.
   */
  get _cardWidth() {
    return EMBED_CARD_WIDTH[this._cardStyle];
  }

  get fetchAbortController() {
    return this._fetchAbortController;
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this._fetchAbortController.signal.aborted)
      this._fetchAbortController = new AbortController();

    this.contentEditable = 'false';
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._fetchAbortController.abort();
  }

  protected override accessor blockContainerStyles: StyleInfo | undefined = {
    margin: '18px 0',
  };

  @query('.embed-block-container')
  protected accessor embedBlock!: HTMLDivElement;

  override accessor showBlockSelection = false;

  override accessor useCaptionEditor = true;

  override accessor useZeroWidth = true;
}
