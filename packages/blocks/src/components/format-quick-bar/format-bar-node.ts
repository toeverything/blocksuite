import './button.js';

import {
  ArrowDownIcon,
  type BlockConfig,
  paragraphConfig,
} from '@blocksuite/global/config';
import { WithDisposable } from '@blocksuite/lit';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import type { PropertyValues } from 'lit';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import {
  getCurrentBlockRange,
  restoreSelection,
} from '../../__internal__/utils/block-range.js';
import { getRichTextByModel } from '../../__internal__/utils/index.js';
import { stopPropagation } from '../../page-block/edgeless/utils.js';
import { actionConfig } from '../../page-block/utils/const.js';
import { formatConfig } from '../../page-block/utils/format-config.js';
import {
  getCurrentCombinedFormat,
  onModelElementUpdated,
  updateBlockType,
} from '../../page-block/utils/index.js';
import { compareTopAndBottomSpace } from '../../page-block/utils/position.js';
import { formatQuickBarStyle } from './styles.js';

type ParagraphType = `${string}/${string}`;
type ParagraphPanelType = 'top' | 'bottom' | 'hidden';

function ParagraphPanel(
  showParagraphPanel: ParagraphPanelType,
  paragraphPanelMaxHeight: string | null,
  paragraphType: ParagraphType,
  models: BaseBlockModel[],
  positionUpdated: Slot,
  onHover: () => void,
  onHoverEnd: () => void,
  onUpdateModels: (models: BaseBlockModel[]) => void,
  onParagraphTypeChange: (type: ParagraphType) => void
) {
  if (showParagraphPanel === 'hidden') {
    return html``;
  }
  const page = models[0].page;
  assertExists(page);
  const styles = styleMap({
    left: '0',
    top: showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
    bottom: showParagraphPanel === 'top' ? 'calc(100% + 4px)' : null,
    maxHeight: paragraphPanelMaxHeight,
  });
  const updateParagraphType = (
    flavour: BlockConfig['flavour'],
    type?: string
  ) => {
    // Already in the target format, should convert back to text
    const alreadyTargetType = paragraphType === `${flavour}/${type}`;
    const { flavour: defaultFlavour, type: defaultType } = paragraphConfig[0];
    const targetFlavour = alreadyTargetType ? defaultFlavour : flavour;
    const targetType = alreadyTargetType ? defaultType : type;
    const newModels = updateBlockType(models, targetFlavour, targetType);

    // Reset selection if the target is code block
    if (targetFlavour === 'affine:code') {
      if (newModels.length !== 1) {
        throw new Error("Failed to reset selection! New model length isn't 1");
      }
      const codeModel = newModels[0];
      onModelElementUpdated(codeModel, () => {
        restoreSelection({
          type: 'Block',
          startOffset: 0,
          endOffset: codeModel.text?.length ?? 0,
          models: [codeModel],
        });
      });
    }
    onUpdateModels(newModels);
    onParagraphTypeChange(`${targetFlavour}/${targetType}`);
    positionUpdated.emit();
  };

  return html` <div
    class="paragraph-panel"
    style="${styles}"
    @mouseover="${onHover}"
    @mouseout="${onHoverEnd}"
  >
    ${paragraphConfig
      .filter(({ flavour }) => flavour !== 'affine:divider')
      .filter(({ flavour }) => page.schema.flavourSchemaMap.has(flavour))
      .map(
        ({ flavour, type, name, icon }) => html`<format-bar-button
          width="100%"
          style="padding-left: 12px; justify-content: flex-start;"
          text="${name}"
          data-testid="${flavour}/${type}"
          @click="${() => updateParagraphType(flavour, type)}"
        >
          ${icon}
        </format-bar-button>`
      )}
  </div>`;
}

type CustomElementCreator = (
  page: Page,
  // todo(himself65): support get current block range
  getBlockRange: () => ReturnType<typeof getCurrentBlockRange>
) => HTMLDivElement;

@customElement('format-quick-bar')
export class FormatQuickBar extends WithDisposable(LitElement) {
  static override styles = formatQuickBarStyle;
  static customElements: CustomElementCreator[] = [];

  @property()
  page!: Page;

  @property()
  left: string | null = null;

  @property()
  top: string | null = null;

  @property()
  abortController = new AbortController();

  // Sometimes the quick bar need to update position
  @property()
  positionUpdated = new Slot();

  @property()
  models: BaseBlockModel[] = [];

  @state()
  private _paragraphType: ParagraphType = `${paragraphConfig[0].flavour}/${paragraphConfig[0].type}`;

  @state()
  private _paragraphPanelHoverDelay = 150;

  @state()
  private _paragraphPanelTimer = 0;

  @state()
  private _showParagraphPanel: ParagraphPanelType = 'hidden';

  paragraphPanelMaxHeight: string | null = null;

  @state()
  private _format: AffineTextAttributes = {};

  @query('.format-quick-bar')
  formatQuickBarElement!: HTMLElement;

  @query('.custom-items')
  customItemsElement!: HTMLElement;

  private _customElements: HTMLDivElement[] = [];

  protected override update(changedProperties: PropertyValues) {
    super.update(changedProperties);
    if (
      this._customElements.length === 0 &&
      FormatQuickBar.customElements.length !== 0
    ) {
      this._customElements = FormatQuickBar.customElements.map(element =>
        element(this.page, () => getCurrentBlockRange(this.page))
      );
      this.customItemsElement.append(...this._customElements);
      this._disposables.add(() => {
        this._customElements.forEach(element => {
          element.remove();
        });
        this._customElements = [];
        this.customItemsElement.innerHTML = '';
      });
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    const startModel = this.models[0];
    this._paragraphType = `${startModel.flavour}/${startModel.type}`;
    this._format = getCurrentCombinedFormat(this.page);

    this.addEventListener('mousedown', (e: MouseEvent) => {
      // Prevent click event from making selection lost
      e.preventDefault();
      e.stopPropagation();
    });
    this.abortController.signal.addEventListener('abort', () => {
      this.remove();
    });

    document.addEventListener('selectionchange', this._selectionChangeHandler);

    const mutationObserver = new MutationObserver(() => {
      if (!this.page) {
        return;
      }
      this._format = getCurrentCombinedFormat(this.page);
    });
    this.models.forEach(model => {
      const richText = getRichTextByModel(model);
      if (!richText) {
        console.warn(
          'Format quick bar may not work properly! Cannot find rich text node by model. model:',
          model
        );
        return;
      }
      mutationObserver.observe(richText, {
        // One or more children have been added to and/or removed
        // from the tree.
        childList: true,
        // Omit (or set to false) to observe only changes to the parent node
        subtree: true,
      });
    });
    this._disposables.add(() => mutationObserver.disconnect());
    this._disposables.add(() =>
      document.removeEventListener(
        'selectionchange',
        this._selectionChangeHandler
      )
    );
  }

  private _onHover() {
    if (this._showParagraphPanel !== 'hidden') {
      clearTimeout(this._paragraphPanelTimer);
      return;
    }

    this._paragraphPanelTimer = window.setTimeout(async () => {
      const { placement, height } = compareTopAndBottomSpace(
        this.formatQuickBarElement,
        document.body,
        10
      );
      this._showParagraphPanel = placement;
      this.paragraphPanelMaxHeight = height + 'px';
    }, this._paragraphPanelHoverDelay);
  }

  private _onHoverEnd() {
    if (this._showParagraphPanel !== 'hidden') {
      // Prepare to disappear
      this._paragraphPanelTimer = window.setTimeout(async () => {
        this._showParagraphPanel = 'hidden';
      }, this._paragraphPanelHoverDelay * 2);
      return;
    }
    clearTimeout(this._paragraphPanelTimer);
  }

  private _selectionChangeHandler = () => {
    const blockRange = getCurrentBlockRange(this.page);
    if (!blockRange) {
      this.abortController.abort();
      return;
    }
    // If the selection is collapsed, abort the format quick bar
    if (
      blockRange.type === 'Native' &&
      blockRange.models.length === 1 &&
      blockRange.startOffset === blockRange.endOffset
    ) {
      this.abortController.abort();
      return;
    }
    this._format = getCurrentCombinedFormat(this.page);
    this.positionUpdated.emit();
  };

  override render() {
    const page = this.page;

    if (!this.models.length || !page) {
      console.error(
        'Failed to render format-quick-bar! no model or page not found!',
        this.models,
        page
      );
      return html``;
    }

    const paragraphIcon =
      paragraphConfig.find(
        ({ flavour, type }) => `${flavour}/${type}` === this._paragraphType
      )?.icon ?? paragraphConfig[0].icon;
    const paragraphItems = html` <format-bar-button
      class="paragraph-button"
      width="52px"
      @mouseover="${this._onHover}"
      @mouseout="${this._onHoverEnd}"
    >
      ${paragraphIcon} ${ArrowDownIcon}
    </format-bar-button>`;

    const paragraphPanel = ParagraphPanel(
      this._showParagraphPanel,
      this.paragraphPanelMaxHeight,
      this._paragraphType,
      this.models,
      this.positionUpdated,
      this._onHover,
      this._onHoverEnd,
      newModels => (this.models = newModels),
      paragraphType => (this._paragraphType = paragraphType)
    );
    const formatItems = formatConfig
      .filter(({ showWhen = () => true }) => showWhen(this.models))
      .map(
        ({ id, name, icon, action, activeWhen }) => html` <format-bar-button
          class="has-tool-tip"
          data-testid=${id}
          ?active=${activeWhen(this._format)}
          @click=${() => {
            action({
              page,
              abortController: this.abortController,
              format: this._format,
            });
            // format state need to update after format
            this._format = getCurrentCombinedFormat(page);
            this.positionUpdated.emit();
          }}
        >
          ${icon}
          <tool-tip inert role="tooltip">${name}</tool-tip>
        </format-bar-button>`
      );

    const actionItems = actionConfig
      .filter(({ showWhen = () => true }) => showWhen(page))
      .map(({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
        const enabled = enabledWhen(page);
        const toolTip = enabled
          ? html`<tool-tip inert role="tooltip">${name}</tool-tip>`
          : html`<tool-tip tip-position="top" inert role="tooltip"
              >${disabledToolTip}</tool-tip
            >`;
        return html`<format-bar-button
          class="has-tool-tip"
          data-testid=${id}
          ?disabled=${!enabled}
          @click=${() => {
            if (enabled) action({ page });
          }}
        >
          ${icon}${toolTip}
        </format-bar-button>`;
      });

    const styles = styleMap({
      left: this.left,
      top: this.top,
    });
    return html` <div
      class="format-quick-bar"
      style="${styles}"
      @pointerdown=${stopPropagation}
    >
      <div class="custom-items"></div>
      ${this._customElements.length > 0
        ? html`<div class="divider"></div>`
        : null}
      ${paragraphItems}
      <div class="divider"></div>
      ${formatItems}
      ${formatItems.length ? html` <div class="divider"></div>` : ''}
      ${actionItems} ${paragraphPanel}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'format-quick-bar': FormatQuickBar;
  }
}
