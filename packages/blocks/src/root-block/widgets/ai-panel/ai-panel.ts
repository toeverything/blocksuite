import type { BaseSelection } from '@blocksuite/block-std';

import { NotificationProvider } from '@blocksuite/affine-shared/services';
import {
  getPageRootByElement,
  stopPropagation,
} from '@blocksuite/affine-shared/utils';
import { WidgetComponent } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  autoPlacement,
  autoUpdate,
  computePosition,
  type ComputePositionConfig,
  flip,
  offset,
  type Rect,
  shift,
} from '@floating-ui/dom';
import { css, html, nothing, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import type { AIError } from '../../../_common/components/index.js';
import type { EdgelessRootService } from '../../edgeless/edgeless-root-service.js';
import type { AIPanelGenerating } from './components/index.js';
import type { AffineAIPanelState, AffineAIPanelWidgetConfig } from './type.js';

import { PageRootService } from '../../page/page-root-service.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../format-bar/format-bar.js';
import {
  AFFINE_VIEWPORT_OVERLAY_WIDGET,
  type AffineViewportOverlayWidget,
} from '../viewport-overlay/viewport-overlay.js';

export const AFFINE_AI_PANEL_WIDGET = 'affine-ai-panel-widget';

export class AffineAIPanelWidget extends WidgetComponent {
  static override styles = css`
    :host {
      display: flex;
      outline: none;
      border-radius: var(--8, 8px);
      border: 1px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);
      box-shadow: var(--affine-overlay-shadow);

      position: absolute;
      width: max-content;
      height: auto;
      top: 0;
      left: 0;
      overflow-y: auto;
      scrollbar-width: none !important;
      z-index: var(--affine-z-index-popover);
    }

    .ai-panel-container {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      width: 100%;
      height: fit-content;
      padding: 8px 0;
    }

    .ai-panel-container:not(:has(ai-panel-generating)) {
      gap: 8px;
    }

    .ai-panel-container:has(ai-panel-answer),
    .ai-panel-container:has(ai-panel-error),
    .ai-panel-container:has(ai-panel-generating:has(generating-placeholder)) {
      padding: 12px 0;
    }

    :host([data-state='hidden']) {
      display: none;
    }
  `;

  private _abortController = new AbortController();

  private _answer: string | null = null;

  private _cancelCallback = () => {
    this.focus();
  };

  private _clearDiscardModal = () => {
    if (this._discardModalAbort) {
      this._discardModalAbort.abort();
      this._discardModalAbort = null;
    }
  };

  private _clickOutside = () => {
    switch (this.state) {
      case 'hidden':
        return;
      case 'error':
      case 'finished':
        if (!this._answer) {
          this.hide();
        } else {
          this.discard();
        }
        break;
      default:
        this.discard();
    }
  };

  private _discardCallback = () => {
    this.hide();
    this.config?.discardCallback?.();
  };

  private _discardModalAbort: AbortController | null = null;

  private _inputFinish = (text: string) => {
    this._inputText = text;
    this.generate();
  };

  private _inputText: string | null = null;

  private _onDocumentClick = (e: MouseEvent) => {
    if (
      this.state !== 'hidden' &&
      e.target !== this &&
      !this.contains(e.target as Node)
    ) {
      this._clickOutside();
      return true;
    }

    return false;
  };

  private _onKeyDown = (event: KeyboardEvent) => {
    event.stopPropagation();
    const { state } = this;
    if (state !== 'generating' && state !== 'input') {
      return;
    }

    const { key, isComposing } = event;
    if (key === 'Escape') {
      if (state === 'generating') {
        this.stopGenerating();
      } else {
        this.hide();
      }
      return;
    }

    if (key === 'Delete' || key === 'Backspace') {
      if (isComposing) return;

      if (state === 'input' && !this._inputText) {
        this.hide();
      }
    }
  };

  private _resetAbortController = () => {
    if (this.state === 'generating') {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
  };

  private _selection?: BaseSelection[];

  private _stopAutoUpdate?: undefined | (() => void);

  ctx: unknown = null;

  discard = () => {
    if ((this.state === 'finished' || this.state === 'error') && !this.answer) {
      this._discardCallback();
      return;
    }
    if (this.state === 'input') {
      this.hide();
      return;
    }
    this.showDiscardModal()
      .then(discard => {
        if (discard) {
          this._discardCallback();
        } else {
          this._cancelCallback();
        }
        this._restoreSelection();
      })
      .catch(console.error);
  };

  /**
   * You can evaluate this method multiple times to regenerate the answer.
   */
  generate = () => {
    assertExists(this.config);
    const text = this._inputText;
    assertExists(text);
    assertExists(this.config.generateAnswer);

    this._resetAbortController();

    // reset answer
    this._answer = null;

    const update = (answer: string) => {
      this._answer = answer;
      this.requestUpdate();
    };
    const finish = (type: 'success' | 'error' | 'aborted', err?: AIError) => {
      if (type === 'aborted') return;

      assertExists(this.config);
      if (type === 'error') {
        this.state = 'error';
        this.config.errorStateConfig.error = err;
      } else {
        this.state = 'finished';
        this.config.errorStateConfig.error = undefined;
      }

      this._resetAbortController();
    };

    this.scrollTop = 0; // reset scroll top
    this.state = 'generating';
    this.config.generateAnswer({
      input: text,
      update,
      finish,
      signal: this._abortController.signal,
    });
  };

  hide = () => {
    this._resetAbortController();
    this.state = 'hidden';
    this._stopAutoUpdate?.();
    this._inputText = null;
    this._answer = null;
    this._stopAutoUpdate = undefined;
    this.config?.hideCallback?.();
    this.viewportOverlayWidget?.unlock();
  };

  onInput = (text: string) => {
    this._inputText = text;
  };

  showDiscardModal = () => {
    const notification = this.host.std.getOptional(NotificationProvider);
    if (!notification) {
      return Promise.resolve(true);
    }
    this._clearDiscardModal();
    this._discardModalAbort = new AbortController();
    return notification
      .confirm({
        title: 'Discard the AI result',
        message: 'Do you want to discard the results the AI just generated?',
        cancelText: 'Cancel',
        confirmText: 'Discard',
        abort: this._abortController.signal,
      })
      .finally(() => (this._discardModalAbort = null));
  };

  stopGenerating = () => {
    this._abortController.abort();
    this.state = 'finished';
    if (!this.answer) {
      this.hide();
    }
  };

  toggle = (reference: Element, input?: string) => {
    if (input) {
      this._inputText = input;
      this.generate();
    } else {
      // reset state
      this.hide();
      this.state = 'input';
    }

    this._autoUpdatePosition(reference);
  };

  get answer() {
    return this._answer;
  }

  get inputText() {
    return this._inputText;
  }

  get viewportOverlayWidget() {
    const rootId = this.host.doc.root?.id;
    return rootId
      ? (this.host.view.getWidget(
          AFFINE_VIEWPORT_OVERLAY_WIDGET,
          rootId
        ) as AffineViewportOverlayWidget)
      : null;
  }

  private _autoUpdatePosition(reference: Element) {
    // workaround for the case that the reference contains children block elements, like:
    // paragraph
    //    child paragraph
    {
      const childrenContainer = reference.querySelector(
        '.affine-block-children-container'
      );
      if (childrenContainer && childrenContainer.previousElementSibling) {
        reference = childrenContainer.previousElementSibling;
      }
    }

    this._stopAutoUpdate?.();
    this._stopAutoUpdate = autoUpdate(reference, this, () => {
      computePosition(reference, this, this._calcPositionOptions(reference))
        .then(({ x, y }) => {
          this.style.left = `${x}px`;
          this.style.top = `${y}px`;
        })
        .catch(console.error);
    });
  }

  private _calcPositionOptions(
    reference: Element
  ): Partial<ComputePositionConfig> {
    let rootBoundary: Rect | undefined;
    {
      const rootService = this.host.std.getService('affine:page');
      if (rootService instanceof PageRootService) {
        rootBoundary = undefined;
      } else {
        // TODO circular dependency: instanceof EdgelessRootService
        const viewport = (rootService as EdgelessRootService).viewport;
        rootBoundary = {
          x: viewport.left,
          y: viewport.top,
          width: viewport.width,
          height: viewport.height - 100, // 100 for edgeless toolbar
        };
      }
    }

    const overflowOptions = {
      padding: 20,
      rootBoundary: rootBoundary,
    };

    // block element in page editor
    if (getPageRootByElement(reference)) {
      return {
        placement: 'bottom-start',
        middleware: [offset(8), shift(overflowOptions)],
      };
    }
    // block element in doc in edgeless editor
    else if (reference.closest('edgeless-block-portal-note')) {
      return {
        middleware: [
          offset(8),
          shift(overflowOptions),
          autoPlacement({
            ...overflowOptions,
            allowedPlacements: ['top-start', 'bottom-start'],
          }),
        ],
      };
    }
    // edgeless element
    else {
      return {
        placement: 'right-start',
        middleware: [
          offset({ mainAxis: 16 }),
          flip({
            mainAxis: true,
            crossAxis: true,
            flipAlignment: true,
            ...overflowOptions,
          }),
          shift({
            crossAxis: true,
            ...overflowOptions,
          }),
        ],
      };
    }
  }

  private _restoreSelection() {
    if (this._selection) {
      this.host.selection.set([...this._selection]);
      if (this.state === 'hidden') {
        this._selection = undefined;
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    this.tabIndex = -1;
    this.disposables.addFromEvent(
      document,
      'pointerdown',
      this._onDocumentClick
    );
    this.disposables.add(
      this.block.host.event.add('pointerDown', evtState =>
        this._onDocumentClick(
          evtState.get('pointerState').event as PointerEvent
        )
      )
    );
    this.disposables.add(
      this.block.host.event.add('click', () => {
        return this.state !== 'hidden' ? true : false;
      })
    );
    this.disposables.addFromEvent(this, 'wheel', stopPropagation);
    this.disposables.addFromEvent(this, 'pointerdown', stopPropagation);
    this.disposables.addFromEvent(this, 'pointerup', stopPropagation);
    this.disposables.addFromEvent(this, 'keydown', this._onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearDiscardModal();
    this._stopAutoUpdate?.();
  }

  override render() {
    if (this.state === 'hidden') {
      return nothing;
    }

    if (!this.config) return nothing;
    const config = this.config;

    this.updateComplete
      .then(() => {
        this.focus();
      })
      .catch(console.error);

    const mainTemplate = choose(this.state, [
      [
        'input',
        () =>
          html`<ai-panel-input
            .onBlur=${() => this.discard()}
            .onFinish=${this._inputFinish}
            .onInput=${this.onInput}
          ></ai-panel-input>`,
      ],
      [
        'generating',
        () => html`
          ${this.answer
            ? html`
                <ai-panel-answer
                  .finish=${false}
                  .config=${config.finishStateConfig}
                  .host=${this.host}
                >
                  ${this.answer &&
                  config.answerRenderer(this.answer, this.state)}
                </ai-panel-answer>
              `
            : nothing}
          <ai-panel-generating
            .config=${config.generatingStateConfig}
            .stopGenerating=${this.stopGenerating}
            .withAnswer=${!!this.answer}
          ></ai-panel-generating>
        `,
      ],
      [
        'finished',
        () => html`
          <ai-panel-answer
            .config=${config.finishStateConfig}
            .copy=${config.copy}
            .host=${this.host}
          >
            ${this.answer && config.answerRenderer(this.answer, this.state)}
          </ai-panel-answer>
        `,
      ],
      [
        'error',
        () => html`
          <ai-panel-error
            .config=${config.errorStateConfig}
            .copy=${config.copy}
            .withAnswer=${!!this.answer}
            .host=${this.host}
          >
            ${this.answer && config.answerRenderer(this.answer, this.state)}
          </ai-panel-error>
        `,
      ],
    ]);

    return html`<div class="ai-panel-container">${mainTemplate}</div>`;
  }

  protected override willUpdate(changed: PropertyValues): void {
    const prevState = changed.get('state');
    if (prevState) {
      if (prevState === 'hidden') {
        this._selection = this.host.selection.value;
        requestAnimationFrame(() => {
          this.scrollIntoView({
            block: 'center',
          });
        });
      } else {
        this.host.updateComplete
          .then(() => {
            if (this.state !== 'hidden') {
              this.focus();
            }
          })
          .catch(console.error);
        this._restoreSelection();
      }

      // tell format bar to show or hide
      const rootBlockId = this.host.doc.root?.id;
      const formatBar = rootBlockId
        ? this.host.view.getWidget(AFFINE_FORMAT_BAR_WIDGET, rootBlockId)
        : null;

      if (formatBar) {
        formatBar.requestUpdate();
      }
    }

    if (this.state !== 'hidden') {
      this.viewportOverlayWidget?.lock();
    } else {
      this.viewportOverlayWidget?.unlock();
    }

    this.dataset.state = this.state;
  }

  @property({ attribute: false })
  accessor config: AffineAIPanelWidgetConfig | null = null;

  @query('ai-panel-generating')
  accessor generatingElement: AIPanelGenerating | null = null;

  @property()
  accessor state: AffineAIPanelState = 'hidden';
}
