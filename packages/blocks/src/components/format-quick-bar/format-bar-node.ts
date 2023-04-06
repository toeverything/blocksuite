import './button.js';

import {
  ArrowDownIcon,
  type BlockConfig,
  CopyIcon,
  DatabaseTableViewIcon,
  paragraphConfig,
} from '@blocksuite/global/config';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Slot } from '@blocksuite/store';
import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import {
  getCurrentBlockRange,
  restoreSelection,
} from '../../__internal__/utils/block-range.js';
import {
  getRichTextByModel,
  WithDisposable,
} from '../../__internal__/utils/index.js';
import { formatConfig } from '../../page-block/utils/const.js';
import {
  getCurrentCombinedFormat,
  onModelElementUpdated,
  updateBlockType,
} from '../../page-block/utils/index.js';
import { compareTopAndBottomSpace } from '../../page-block/utils/position.js';
import { showDatabaseModal } from '../database-modal/index.js';
import { toast } from '../toast.js';
import { formatQuickBarStyle } from './styles.js';

const DATABASE_WHITE_LIST = ['affine:list', 'affine:paragraph'];

@customElement('format-quick-bar')
export class FormatQuickBar extends WithDisposable(LitElement) {
  static styles = formatQuickBarStyle;

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
  private _paragraphType: `${string}/${string}` = `${paragraphConfig[0].flavour}/${paragraphConfig[0].type}`;

  @state()
  private _paragraphPanelHoverDelay = 150;

  @state()
  private _paragraphPanelTimer = 0;

  @state()
  private _showParagraphPanel: 'top' | 'bottom' | 'hidden' = 'hidden';

  paragraphPanelMaxHeight: string | null = null;

  @state()
  private _format: AffineTextAttributes = {};

  @query('.format-quick-bar')
  formatQuickBarElement!: HTMLElement;

  connectedCallback() {
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

  private _onCopy() {
    // Will forward to the `CopyCutManager`
    this.dispatchEvent(new ClipboardEvent('copy', { bubbles: true }));
    toast('Copied to clipboard');
  }

  private _paragraphPanelTemplate() {
    if (this._showParagraphPanel === 'hidden') {
      return html``;
    }
    const styles = styleMap({
      left: '0',
      top: this._showParagraphPanel === 'bottom' ? 'calc(100% + 4px)' : null,
      bottom: this._showParagraphPanel === 'top' ? 'calc(100% + 4px)' : null,
      maxHeight: this.paragraphPanelMaxHeight,
    });
    const updateParagraphType = (
      flavour: BlockConfig['flavour'],
      type?: string
    ) => {
      // Already in the target format, should convert back to text
      const alreadyTargetType = this._paragraphType === `${flavour}/${type}`;
      const { flavour: defaultFlavour, type: defaultType } = paragraphConfig[0];
      const targetFlavour = alreadyTargetType ? defaultFlavour : flavour;
      const targetType = alreadyTargetType ? defaultType : type;
      const newModels = updateBlockType(this.models, targetFlavour, targetType);

      // Reset selection if the target is code block
      if (targetFlavour === 'affine:code') {
        if (newModels.length !== 1) {
          throw new Error(
            "Failed to reset selection! New model length isn't 1"
          );
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
      this.models = newModels;
      this._paragraphType = `${targetFlavour}/${targetType}`;
      this.positionUpdated.emit();
    };

    return html` <div
      class="paragraph-panel"
      style="${styles}"
      @mouseover="${this._onHover}"
      @mouseout="${this._onHoverEnd}"
    >
      ${paragraphConfig.map(
        ({ flavour, type, name, icon }) => html` <format-bar-button
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

  private renderDatabaseAction() {
    const range = getCurrentBlockRange(this.page);

    const isShow = range?.type === 'Block';
    if (!isShow) return null;

    const enabled = range.models.every(
      model => DATABASE_WHITE_LIST.indexOf(model.flavour) > -1
    );

    const onClick = () => {
      if (enabled) {
        showDatabaseModal({
          page: this.page,
        });
      }
    };

    // TODO: add `Learn more` link
    const toolTip = enabled
      ? html` <tool-tip inert role="tooltip">To Database</tool-tip>`
      : html`<tool-tip tip-position="top" inert role="tooltip"
          >Contains Block types that cannot be converted to Database. Learn
          more</tool-tip
        >`;
    return html`<format-bar-button
      ?disabled=${!enabled}
      class="has-tool-tip database-button"
      data-testid="convert-to-database"
      @click=${onClick}
    >
      ${DatabaseTableViewIcon}${toolTip}
    </format-bar-button>`;
  }

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

    const paragraphPanel = this._paragraphPanelTemplate();
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

    const actionItems = html`
      <format-bar-button
        class="has-tool-tip"
        data-testid="copy"
        @click=${() => this._onCopy()}
      >
        ${CopyIcon}
        <tool-tip inert role="tooltip">Copy</tool-tip>
      </format-bar-button>
      ${this.renderDatabaseAction()}
    `;

    const styles = styleMap({
      left: this.left,
      top: this.top,
    });
    return html` <div class="format-quick-bar" style="${styles}">
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
