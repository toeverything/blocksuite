import './components/index.js';

import type { BaseSelection } from '@blocksuite/block-std';
import { WidgetElement } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  autoUpdate,
  computePosition,
  type ComputePositionConfig,
  type ReferenceElement,
} from '@floating-ui/dom';
import {
  css,
  html,
  nothing,
  type PropertyValues,
  type TemplateResult,
} from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';

import type { AIError } from '../../../_common/components/index.js';
import { on, stopPropagation } from '../../../_common/utils/event.js';
import type { AIPanelDiscardModal } from './components/discard-modal.js';
import { toggleDiscardModal } from './components/discard-modal.js';
import type {
  AIPanelAnswerConfig,
  AIPanelErrorConfig,
} from './components/index.js';

export interface AffineAIPanelWidgetConfig {
  answerRenderer: (
    answer: string,
    state?: AffineAIPanelState
  ) => TemplateResult<1> | typeof nothing;
  generateAnswer?: (props: {
    input: string;
    update: (answer: string) => void;
    finish: (type: 'success' | 'error' | 'aborted', err?: AIError) => void;
    // Used to allow users to stop actively when generating
    signal: AbortSignal;
  }) => void;

  finishStateConfig: AIPanelAnswerConfig;
  errorStateConfig: AIPanelErrorConfig;
  hideCallback?: () => void;
  discardCallback?: () => void;

  positionConfig?: Partial<ComputePositionConfig>;
}

export type AffineAIPanelState =
  | 'hidden'
  | 'input'
  | 'generating'
  | 'finished'
  | 'error';

export const AFFINE_AI_PANEL_WIDGET = 'affine-ai-panel-widget';

@customElement(AFFINE_AI_PANEL_WIDGET)
export class AffineAIPanelWidget extends WidgetElement {
  static override styles = css`
    :host {
      display: flex;
      outline: none;
      border-radius: var(--8, 8px);
      border: 1px solid var(--affine-border-color);
      background: var(--affine-background-overlay-panel-color);

      /* light/toolbarShadow */
      box-shadow: var(
        --affine-toolbar-shadow,
        0px 6px 16px 0px rgba(0, 0, 0, 0.14)
      );

      position: absolute;
      width: max-content;
      top: 0;
      left: 0;

      z-index: 1;
    }

    .ai-panel-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      gap: 8px;
      padding: 8px 0;
    }

    .ai-panel-container:has(ai-panel-answer) {
      padding: 12px 0;
    }

    :host([data-hidden]) {
      display: none;
    }
  `;

  ctx: unknown = null;

  @property({ attribute: false })
  config: AffineAIPanelWidgetConfig | null = null;

  @property()
  state: AffineAIPanelState = 'hidden';

  @query('.mock-selection-container')
  mockSelectionContainer!: HTMLDivElement;

  private _stopAutoUpdate?: undefined | (() => void);

  private _discardModal: AIPanelDiscardModal | null = null;
  private _clearDiscardModal = () => {
    if (this._discardModal) {
      this._discardModal.remove();
      this._discardModal = null;
    }
  };
  private _discardCallback = () => {
    this.hide();
    this.config?.discardCallback?.();
  };

  toggle = (reference: ReferenceElement, input?: string) => {
    if (input) {
      this._inputText = input;
      this.generate();
    } else {
      // reset state
      this.hide();
      this.state = 'input';
    }

    this._stopAutoUpdate?.();
    this._stopAutoUpdate = autoUpdate(reference, this, () => {
      computePosition(reference, this, this.config?.positionConfig)
        .then(({ x, y }) => {
          this.style.left = `${x}px`;
          this.style.top = `${y}px`;
        })
        .catch(console.error);
    });
  };

  hide = () => {
    this._resetAbortController();
    this._stopAutoUpdate?.();
    this.state = 'hidden';
    this._inputText = null;
    this._answer = null;
    this._stopAutoUpdate = undefined;
    this.config?.hideCallback?.();
  };

  discard = (callback: () => void = this._discardCallback) => {
    if (this.state === 'hidden') return;
    if (this.state === 'error') {
      callback();
      return;
    }
    this._clearDiscardModal();
    this._discardModal = toggleDiscardModal(callback);
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

    this.state = 'generating';
    this.config.generateAnswer({
      input: text,
      update,
      finish,
      signal: this._abortController.signal,
    });
  };

  stopGenerating = () => {
    this._abortController.abort();
    this.state = 'finished';
  };

  private _abortController = new AbortController();
  private _resetAbortController = () => {
    this._abortController.abort();
    this._abortController = new AbortController();
  };

  private _inputText: string | null = null;
  get inputText() {
    return this._inputText;
  }

  private _selection?: BaseSelection[];

  private _answer: string | null = null;
  get answer() {
    return this._answer;
  }

  private _inputFinish = (text: string) => {
    this._inputText = text;
    this.generate();
  };

  override connectedCallback() {
    super.connectedCallback();

    this.tabIndex = -1;
    this.disposables.add(on(this, 'wheel', stopPropagation));
    this.disposables.add(on(this, 'pointerdown', stopPropagation));
    this.disposables.addFromEvent(document, 'mousedown', this._onDocumentClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearDiscardModal();
  }

  private _onDocumentClick = (e: MouseEvent) => {
    if (this.state !== 'hidden') {
      e.preventDefault();
    }

    if (
      e.target !== this._discardModal &&
      e.target !== this &&
      !this.contains(e.target as Node) &&
      this.state !== 'generating'
    ) {
      this.discard();
    }
  };

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
        // restore selection
        if (this._selection) {
          this.host.selection.set([...this._selection]);
        }
      }

      // tell format bar to show or hide
      const rootBlockId = this.host.doc.root?.id;
      const formatBar = rootBlockId
        ? this.host.view.getWidget('affine-format-bar-widget', rootBlockId)
        : null;

      if (formatBar) {
        formatBar.requestUpdate();
      }
    }
  }

  override render() {
    if (this.state === 'hidden') {
      this.dataset.hidden = '';
      return nothing;
    } else {
      delete this.dataset.hidden;
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
                >
                  ${this.answer &&
                  config.answerRenderer(this.answer, this.state)}
                </ai-panel-answer>
              `
            : nothing}
          <ai-panel-generating
            .stopGenerating=${this.stopGenerating}
          ></ai-panel-generating>
        `,
      ],
      [
        'finished',
        () => html`
          <ai-panel-answer .config=${config.finishStateConfig}>
            ${this.answer && config.answerRenderer(this.answer, this.state)}
          </ai-panel-answer>
        `,
      ],
      [
        'error',
        () => html`
          <ai-panel-error .config=${config.errorStateConfig}></ai-panel-error>
        `,
      ],
    ]);

    return html`<div class="ai-panel-container">${mainTemplate}</div>`;
  }
}
